from fastapi import APIRouter

router = APIRouter()

@router.get("/data")
def get_map_data():
    """Returns mock GeoJSON data for the Northern Mindanao demo scenario."""
    # Mock data for Cagayan de Oro high-risk barangays and evacuation centers
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "type": "risk_zone",
                    "name": "Barangay Carmen Flood Zone",
                    "risk_level": "High"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [124.6300, 8.4800],
                        [124.6500, 8.4800],
                        [124.6500, 8.4600],
                        [124.6300, 8.4600],
                        [124.6300, 8.4800]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "type": "risk_zone",
                    "name": "Barangay Macasandig Flood Zone",
                    "risk_level": "High"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [124.6400, 8.4600],
                        [124.6600, 8.4600],
                        [124.6600, 8.4400],
                        [124.6400, 8.4400],
                        [124.6400, 8.4600]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "type": "evacuation_center",
                    "name": "Macasandig Covered Court",
                    "capacity": 500
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [124.6500, 8.4500]
                }
            },
             {
                "type": "Feature",
                "properties": {
                    "type": "evacuation_center",
                    "name": "City Central School",
                    "capacity": 1200
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [124.6450, 8.4700]
                }
            }
        ]
    }
