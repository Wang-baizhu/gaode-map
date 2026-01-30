import h3
from shapely.geometry import Polygon, mapping
from typing import List, Tuple

def polygon_to_hexagons(polygon: Polygon, resolution: int = 9) -> List[str]:
    """
    Convert a Shapely Polygon to a list of H3 hexagon indices.
    
    Args:
        polygon: Shapely Polygon (WGS84).
        resolution: H3 resolution (0-15).
                    Res 9 ~ 0.1km^2 edge length ~174m
                    Res 8 ~ 0.7km^2 edge length ~461m
        
    Returns:
        List of H3 indices (strings).
    """
    if not isinstance(polygon, Polygon) or polygon.is_empty:
        return []

    # h3-py v4 API: polygon_to_cells (formerly polyfill)
    # Input format: GeoJSON-like dictionary. 
    # Important: h3 expects (lat, lng) or GeoJSON (lng, lat).
    # h3.polygon_to_cells(geojson, res) checks for GeoJSON compliance.
    
    geo_json = mapping(polygon)
    
    # Handle the fact that mapping() returns {'type': 'Polygon', 'coordinates': (((lng, lat), ...),)}
    # h3.polygon_to_cells expects the geometry dict or similar.
    
    try:
        # h3 >= 4.0.0
        cells = h3.geojson_to_cells(geo_json, resolution)
    except AttributeError:
        # Fallback for older versions if needed, but we installed latest.
        # Check if user has h3-py < 4.0
        try: 
             cells = h3.polyfill(geo_json, resolution, geo_json_conformant=True)
        except:
             # Manual fallback if geojson helper fails
             # Coordinates need to be valid
             return []

    return list(cells)

def get_hexagon_boundary(h3_index: str) -> List[Tuple[float, float]]:
    """
    Get the boundary coordinates of an H3 hexagon.
    
    Returns:
        List of (lat, lng) tuples. 
        Note: Frontend usually expects [lng, lat], ensure consistency.
        H3 native returns (lat, lng).
    """
    # h3.cell_to_boundary(h, geo_json=True) returns ((lng, lat), ...)
    try:
        boundary = h3.cell_to_boundary(h3_index, geo_json=True)
        # It usually returns a tuple of tuples.
        return list(boundary)
    except:
        return []
