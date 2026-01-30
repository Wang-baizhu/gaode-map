import requests
import json
import logging
from typing import List, Tuple, Union
from shapely.geometry import Point, Polygon
from config import settings

logger = logging.getLogger(__name__)

def fetch_amap_isochrone(center: Point, time_sec: int, mode: str) -> Polygon:
    """
    Fetch isochrone polygon from Valhalla (Real Implementation).
    
    Args:
        center: Point in WGS84
        time_sec: Time in seconds (Valhalla expects minutes usually, we will convert)
        mode: 'walking', 'driving', 'bicycling' (Valhalla costing models)
        
    Returns:
        Polygon in WGS84
    """
    # 1. Map mode to Valhalla costing
    costing_map = {
        "walking": "pedestrian",
        "driving": "auto",
        "bicycling": "bicycle"
    }
    costing = costing_map.get(mode, "pedestrian")
    
    # 2. Prepare payload
    # Valhalla expects 'contours' with 'time' in minutes
    time_min = time_sec / 60
    
    payload = {
        "locations": [{"lat": center.y, "lon": center.x}],
        "costing": costing,
        "contours": [{"time": time_min}],
        "polygons": True  # Request polygon geometry output
    }
    
    url = f"{settings.valhalla_base_url}/isochrone"
    
    logger.info(f"Requesting Valhalla: {url} | Mode: {costing} | Time: {time_min}min")
    
    try:
        resp = requests.post(url, json=payload, timeout=settings.valhalla_timeout_s)
        resp.raise_for_status()
        data = resp.json()
        
        # 3. Parse Response
        # Valhalla returns a FeatureCollection. We expect at least one feature.
        features = data.get("features", [])
        if not features:
            logger.warning("Valhalla returned no isochrone features.")
            return Polygon()
            
        # Extract coordinates from the first feature (the isochrone)
        # Geometry type is usually 'Polygon' or 'MultiPolygon'
        geometry = features[0].get("geometry", {})
        coords = geometry.get("coordinates", [])
        
        if not coords:
            return Polygon()
            
        # Handle Polygon vs MultiPolygon
        # Simplication: Take the largest outer ring if complex, or just the first shell.
        # Valhalla Polygon structure: [ [ [lon, lat], ... ] ] (Outer ring)
        
        # Note: Shapely Polygon takes (shell, holes). 
        # Valhalla returns [shell, hole1, hole2...]
        if geometry.get("type") == "Polygon":
            shell = coords[0]
            holes = coords[1:] if len(coords) > 1 else []
            return Polygon(shell, holes)
            
        elif geometry.get("type") == "MultiPolygon":
            # For simplicity in this MVP, return the largest polygon or the union (if we had MultiPolygon support in type hint)
            # The interface defines return as Polygon. We take the first one (usually the main distinct region).
            shell = coords[0][0] # First polygon, first ring (shell)
            return Polygon(shell)
            
        return Polygon()

    except requests.RequestException as e:
        logger.error(f"Valhalla API connection failed: {e}")
        # Fallback or re-raise? 
        # For development, we might want to see the error. 
        # But to prevent app crash, let's log and return empty (or fallback to mock if we kept it).
        # We will re-raise to let the caller handle 'Service Unavailable'.
        raise RuntimeError(f"Failed to fetch isochrone from Valhalla at {url}") from e
