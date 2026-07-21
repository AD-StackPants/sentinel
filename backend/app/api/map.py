from fastapi import APIRouter
import structlog
import snowflake.connector

from app.core.config import settings

logger = structlog.get_logger()
router = APIRouter()

import math

def _generate_dynamic_risk_polygon(points, buffer=0.012):
    if not points:
        return []
    avg_lon = sum(p[0] for p in points) / len(points)
    avg_lat = sum(p[1] for p in points) / len(points)

    outer_points = []
    for lon, lat in points:
        for angle_deg in range(0, 360, 45):
            rad = math.radians(angle_deg)
            outer_points.append((lon + buffer * math.cos(rad), lat + buffer * math.sin(rad)))

    sorted_pts = sorted(outer_points, key=lambda p: math.atan2(p[1] - avg_lat, p[0] - avg_lon))

    unique_pts = []
    for p in sorted_pts:
        if not unique_pts or (abs(p[0] - unique_pts[-1][0]) > 0.003 or abs(p[1] - unique_pts[-1][1]) > 0.003):
            unique_pts.append([round(p[0], 5), round(p[1], 5)])

    if unique_pts:
        unique_pts.append(unique_pts[0])
    return [unique_pts]

def _fetch_snowflake_map_features():
    if settings.SNOWFLAKE_ACCOUNT == "placeholder_account":
        return None

    try:
        conn = snowflake.connector.connect(
            user=settings.SNOWFLAKE_USER,
            password=settings.SNOWFLAKE_PASSWORD,
            account=settings.SNOWFLAKE_ACCOUNT,
            warehouse=settings.SNOWFLAKE_WAREHOUSE,
            database=settings.SNOWFLAKE_DATABASE,
            schema=settings.SNOWFLAKE_SCHEMA,
            role=settings.SNOWFLAKE_ROLE,
        )
        cursor = conn.cursor()
        features = []

        # 1. Fetch Dynamic Risk Zone Polygons based on live high-risk sensors & barangay GPS locations
        cursor.execute("""
            SELECT b.barangay, b.latitude, b.longitude, r.water_level
            FROM barangays b
            JOIN river_sensors r ON b.barangay = r.barangay
            WHERE r.water_level >= 6.0
        """)
        high_risk_rows = cursor.fetchall()
        if high_risk_rows:
            # Cluster by proximity (main city cluster vs outer barangays)
            main_cluster_pts = [(float(r[2]), float(r[1])) for r in high_risk_rows if float(r[1]) < 7.0]
            outer_cluster_pts = [(float(r[2]), float(r[1])) for r in high_risk_rows if float(r[1]) >= 7.0]

            if main_cluster_pts:
                poly_coords = _generate_dynamic_risk_polygon(main_cluster_pts, buffer=0.015)
                if poly_coords and len(poly_coords[0]) >= 4:
                    features.append({
                        "type": "Feature",
                        "properties": {
                            "type": "risk_zone",
                            "name": "Tumaga / Central River Basin Active Flood Zone",
                            "risk_level": "High"
                        },
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": poly_coords
                        }
                    })

            if outer_cluster_pts:
                poly_coords_outer = _generate_dynamic_risk_polygon(outer_cluster_pts, buffer=0.012)
                if poly_coords_outer and len(poly_coords_outer[0]) >= 4:
                    features.append({
                        "type": "Feature",
                        "properties": {
                            "type": "risk_zone",
                            "name": "North Zamboanga River Spillway Risk Zone",
                            "risk_level": "High"
                        },
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": poly_coords_outer
                        }
                    })

        # 2. Fetch Evacuation Centers joined with barangay coordinates
        cursor.execute("""
            SELECT e.name, e.capacity, e.current_occupancy, b.latitude, b.longitude
            FROM evacuation_centers e
            JOIN barangays b ON e.barangay = b.barangay
        """)
        for row in cursor.fetchall():
            name, cap, occ, lat, lon = row
            features.append({
                "type": "Feature",
                "properties": {
                    "type": "evacuation_center",
                    "name": name,
                    "capacity": cap,
                    "occupancy": occ
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(lon), float(lat)]
                }
            })

        # 3. Fetch Hospitals joined with barangay coordinates
        cursor.execute("""
            SELECT h.hospital, h.beds_available, b.latitude, b.longitude
            FROM hospitals h
            LEFT JOIN barangays b ON h.barangay = b.barangay
        """)
        for row in cursor.fetchall():
            h_name, beds, lat, lon = row
            # Fallback coords for hospitals outside mapped barangays
            lat_val = float(lat) if lat else 6.9350
            lon_val = float(lon) if lon else 122.0750
            features.append({
                "type": "Feature",
                "properties": {
                    "type": "hospital",
                    "name": h_name,
                    "beds": beds
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon_val, lat_val]
                }
            })

        # 4. Fetch River Sensors joined with barangay coordinates
        cursor.execute("""
            SELECT r.sensor_id, r.water_level, b.latitude, b.longitude
            FROM river_sensors r
            JOIN barangays b ON r.barangay = b.barangay
        """)
        for row in cursor.fetchall():
            s_id, level, lat, lon = row
            status = "Critical" if level >= 8.0 else ("Warning" if level >= 6.0 else "Normal")
            features.append({
                "type": "Feature",
                "properties": {
                    "type": "sensor",
                    "name": s_id,
                    "level": f"{level}m",
                    "status": status
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(lon), float(lat)]
                }
            })

        cursor.close()
        conn.close()
        return {"type": "FeatureCollection", "features": features}
    except Exception as e:
        logger.error("failed_to_fetch_snowflake_map_data", error=str(e))
        return None

@router.get("/data")
def get_map_data():
    """Returns dynamic GeoJSON map data fetched from Snowflake database, with static fallback."""
    db_features = _fetch_snowflake_map_features()
    if db_features and db_features.get("features"):
        return db_features

    # Fallback GeoJSON data for Zamboanga City demo scenario
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "type": "risk_zone",
                    "name": "Tumaga River High-Risk Flood Zone",
                    "risk_level": "High"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [122.0600, 6.9500],
                        [122.0800, 6.9500],
                        [122.0900, 6.9200],
                        [122.0500, 6.9200],
                        [122.0600, 6.9500]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "type": "evacuation_center",
                    "name": "Tumaga Gymnasium",
                    "capacity": 800,
                    "occupancy": 210
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [122.0650, 6.9450]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "type": "evacuation_center",
                    "name": "City Coliseum Tetuan",
                    "capacity": 2500,
                    "occupancy": 650
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [122.0850, 6.9250]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "type": "hospital",
                    "name": "Zamboanga City Medical Center (ZCMC)",
                    "beds": 65
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [122.0750, 6.9350]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "type": "sensor",
                    "name": "ZAM-TUMAGA-01",
                    "level": "8.8m",
                    "status": "Critical"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [122.0630, 6.9480]
                }
            }
        ]
    }
