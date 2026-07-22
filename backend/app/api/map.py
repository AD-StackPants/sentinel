import math

import snowflake.connector
import structlog
from fastapi import APIRouter

from app.core.config import settings

logger = structlog.get_logger()
router = APIRouter()


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
        if not unique_pts or (
            abs(p[0] - unique_pts[-1][0]) > 0.003 or abs(p[1] - unique_pts[-1][1]) > 0.003
        ):
            unique_pts.append([round(p[0], 5), round(p[1], 5)])

    if unique_pts:
        unique_pts.append(unique_pts[0])
    return [unique_pts]


def _fetch_snowflake_map_features():
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
            main_cluster_pts = [
                (float(r[2]), float(r[1])) for r in high_risk_rows if float(r[1]) < 7.0
            ]
            outer_cluster_pts = [
                (float(r[2]), float(r[1])) for r in high_risk_rows if float(r[1]) >= 7.0
            ]

            if main_cluster_pts:
                poly_coords = _generate_dynamic_risk_polygon(main_cluster_pts, buffer=0.015)
                if poly_coords and len(poly_coords[0]) >= 4:
                    features.append(
                        {
                            "type": "Feature",
                            "properties": {
                                "type": "risk_zone",
                                "name": "Tumaga / Central River Basin Active Flood Zone",
                                "risk_level": "High",
                            },
                            "geometry": {"type": "Polygon", "coordinates": poly_coords},
                        }
                    )

            if outer_cluster_pts:
                poly_coords_outer = _generate_dynamic_risk_polygon(outer_cluster_pts, buffer=0.012)
                if poly_coords_outer and len(poly_coords_outer[0]) >= 4:
                    features.append(
                        {
                            "type": "Feature",
                            "properties": {
                                "type": "risk_zone",
                                "name": "North Zamboanga River Spillway Risk Zone",
                                "risk_level": "High",
                            },
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": poly_coords_outer,
                            },
                        }
                    )

        # 2. Fetch Evacuation Centers directly from Snowflake DB
        cursor.execute("""
            SELECT name, capacity, current_occupancy, latitude, longitude
            FROM evacuation_centers
        """)
        for row in cursor.fetchall():
            name, cap, occ, lat, lon = row
            if lat is not None and lon is not None:
                features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "type": "evacuation_center",
                            "name": name,
                            "capacity": cap,
                            "occupancy": occ,
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [float(lon), float(lat)],
                        },
                    }
                )

        # 3. Fetch Hospitals directly from Snowflake DB
        cursor.execute("""
            SELECT hospital, beds_available, latitude, longitude
            FROM hospitals
        """)
        for row in cursor.fetchall():
            h_name, beds, lat, lon = row
            if lat is not None and lon is not None:
                features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "type": "hospital",
                            "name": h_name,
                            "beds": beds,
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [float(lon), float(lat)],
                        },
                    }
                )

        # 4. Fetch River Sensors directly from Snowflake DB
        cursor.execute("""
            SELECT sensor_id, water_level, latitude, longitude
            FROM river_sensors
        """)
        for row in cursor.fetchall():
            s_id, level, lat, lon = row
            if lat is not None and lon is not None:
                status = "Critical" if level >= 8.0 else ("Warning" if level >= 6.0 else "Normal")
                features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "type": "sensor",
                            "name": s_id,
                            "level": f"{level}m",
                            "status": status,
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [float(lon), float(lat)],
                        },
                    }
                )

        cursor.close()
        conn.close()
        return {"type": "FeatureCollection", "features": features}
    except Exception as e:
        logger.error("failed_to_fetch_snowflake_map_data", error=str(e))
        return {"type": "FeatureCollection", "features": []}


@router.get("/data")
def get_map_data():
    """Returns dynamic GeoJSON map data fetched live from active Snowflake database."""
    db_features = _fetch_snowflake_map_features()
    if db_features and "features" in db_features:
        return db_features
    return {"type": "FeatureCollection", "features": []}
