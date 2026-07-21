from fastapi import APIRouter

router = APIRouter()

@router.get("/data")
def get_map_data():
    """Returns mock GeoJSON data for the Zamboanga City demo scenario."""
    # Mock data for Zamboanga City high-risk barangays, evacuation centers, and hospitals
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
