import h3
import logging
from shapely.geometry import Polygon, mapping
from typing import List, Tuple, Literal
from modules.gaode_service.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02

logger = logging.getLogger(__name__)

def polygon_to_hexagons(
    polygon: Polygon,
    resolution: int = 9,
    coord_type: Literal["gcj02", "wgs84"] = "gcj02"
) -> List[str]:
    """
    Convert a Shapely Polygon to a list of H3 hexagon indices.
    
    Args:
        polygon: Shapely Polygon (GCJ02 by default).
        resolution: H3 resolution (0-15).
                    Res 9 ~ 0.1km^2 edge length ~174m
                    Res 8 ~ 0.7km^2 edge length ~461m
        coord_type: Input coordinate system. "gcj02" or "wgs84".
        
    Returns:
        List of H3 indices (strings).
    """
    if not isinstance(polygon, Polygon) or polygon.is_empty:
        return []

    # h3-py v4 API: polygon_to_cells (formerly polyfill)
    # Input format: GeoJSON-like dictionary. 
    # Important: h3 expects (lat, lng) or GeoJSON (lng, lat).
    # h3.polygon_to_cells(geojson, res) checks for GeoJSON compliance.
    
    # h3.polygon_to_cells(geojson, res) checks for GeoJSON compliance.
    
    # 1. Ensure polygon is WGS84 for H3
    if coord_type == "gcj02":
        wgs84_poly = []
        if polygon.exterior:
            for x, y in polygon.exterior.coords:
                wx, wy = gcj02_to_wgs84(x, y)
                wgs84_poly.append((wx, wy))
        if not wgs84_poly:
            return []
        temp_poly = Polygon(wgs84_poly)
    else:
        temp_poly = polygon
    geo_json = mapping(temp_poly)
    
    # Handle the fact that mapping() returns {'type': 'Polygon', 'coordinates': (((lng, lat), ...),)}
    # h3.polygon_to_cells expects the geometry dict or similar.
    
    try:
        # h3 >= 4.0.0
        cells = h3.geo_to_cells(geo_json, resolution)
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

def get_hexagon_boundary(
    h3_index: str,
    coord_type: Literal["gcj02", "wgs84"] = "gcj02"
) -> List[Tuple[float, float]]:
    """
    Get the boundary coordinates of an H3 hexagon.
    
    Returns:
        List of (lng, lat) tuples.
        coord_type determines whether output is GCJ02 or WGS84.
    """
    try:
        # h3 v4: cell_to_boundary(..., geo_json=True) -> ((lng, lat), ...)
        # h3 v3: h3_to_geo_boundary(..., geo_json=True) -> ((lng, lat), ...)
        if hasattr(h3, "cell_to_boundary"):
            try:
                boundary = h3.cell_to_boundary(h3_index, geo_json=True)
            except TypeError:
                boundary = h3.cell_to_boundary(h3_index)
        elif hasattr(h3, "h3_to_geo_boundary"):
            try:
                boundary = h3.h3_to_geo_boundary(h3_index, geo_json=True)
            except TypeError:
                boundary = h3.h3_to_geo_boundary(h3_index)
        else:
            raise AttributeError("No H3 boundary function available")

        # Defensive: if order is (lat, lng), swap based on value range.
        normalized = []
        for lng, lat in boundary:
            if abs(lng) <= 90 and abs(lat) > 90:
                lng, lat = lat, lng
            normalized.append((lng, lat))

        if coord_type == "wgs84":
            return normalized

        # Boundary is WGS84, convert back to GCJ02 for AMap
        gcj02_boundary = []
        for lng, lat in normalized:
            gx, gy = wgs84_to_gcj02(lng, lat)
            gcj02_boundary.append((gx, gy))

        return gcj02_boundary
    except Exception as e:
        logger.warning("H3 boundary failed for %s: %s", h3_index, e)
        return []

def get_hexagon_children(h3_index: str) -> List[str]:
    """
    Get children of a hexagon (1 resolution finer).
    """
    try:
        # h3 v4
        if hasattr(h3, "cell_to_children"):
            return list(h3.cell_to_children(h3_index))
        # h3 v3
        elif hasattr(h3, "h3_to_children"):
            return list(h3.h3_to_children(h3_index))
        else:
            return []
    except Exception as e:
        logger.warning("H3 children failed for %s: %s", h3_index, e)
        return []
