from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from shapely.geometry import mapping
from shapely.ops import transform
import logging
import time
import asyncio

from config import settings
from modules.isochrone import get_isochrone_polygon
from modules.isochrone.schemas import IsochroneRequest, IsochroneResponse
from modules.gaode_service.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/v1", tags=["Spatial Analysis"])

templates = Jinja2Templates(directory=settings.templates_dir)

@router.get("/analysis", response_class=HTMLResponse, summary="Analysis Page")
async def render_analysis_page(request: Request):
    """
    Render the spatial analysis page.
    """
    return templates.TemplateResponse(
        "analysis.html", 
        {
            "request": request,
            "amap_js_api_key": settings.amap_js_api_key,
            "amap_js_security_code": settings.amap_js_security_code,
            # Pass minimal map context required by map_base.html
            "map_type_config_json": "{}", 
            "map_id": "null",
            "map_data_json": "{}" 
        }
    )

@router.post(
    "/analysis/isochrone",
    response_model=IsochroneResponse,
    summary="Calculate Isochrone Polygon",
    description="Generates a reachable area polygon (WGS84) using the Valhalla engine."
)
async def calculate_isochrone_endpoint(payload: IsochroneRequest):
    start_time = time.time()
    try:
        # 1. Handle Coordinate System
        lat, lon = payload.lat, payload.lon
        
        if payload.coord_type == "gcj02":
            # Input is GCJ02 (from AMap click), convert to WGS84 for Valhalla
            lon, lat = gcj02_to_wgs84(payload.lon, payload.lat)
            logger.debug(f"Converted Input: GCJ02({payload.lon},{payload.lat}) -> WGS84({lon},{lat})")

        # Convert minutes to seconds
        time_sec = payload.time_min * 60
        
        # 2. Call the Logic (Valhalla returns WGS84 Polygon)
        polygon_wgs84 = await asyncio.to_thread(
            get_isochrone_polygon,
            lat,
            lon,
            time_sec,
            payload.mode
        )
        
        if polygon_wgs84.is_empty:
             raise HTTPException(status_code=404, detail="Could not generate isochrone (Empty result from engine).")

        # 3. Output Transformation
        # If input was GCJ02, Frontend likely expects GCJ02 back to match the map layer.
        # Alternatively, map-core/AMap handles WGS84->GCJ02 automatically if configured? 
        # AMap JS API v2 usually assumes GCJ02 for LngLat objects unless specified.
        # It's safest to return GCJ02 if input was GCJ02.
        
        final_polygon = polygon_wgs84
        
        if payload.coord_type == "gcj02":
            # Transform Polygon WGS84 -> GCJ02
            # Helper for shapely transform
            def _transform_to_gcj(x, y, z=None):
                new_x = []
                new_y = []
                # Handle scalar or array (shapely passes array-like usually)
                try:
                    iter(x)
                except TypeError:
                    # Scalar
                    nx, ny = wgs84_to_gcj02(x, y)
                    return nx, ny
                
                # Iterable
                for i in range(len(x)):
                    nx, ny = wgs84_to_gcj02(x[i], y[i])
                    new_x.append(nx)
                    new_y.append(ny)
                return tuple(new_x), tuple(new_y)
                
            final_polygon = transform(_transform_to_gcj, polygon_wgs84)

        # Construct GeoJSON Feature
        return {
            "type": "Feature",
            "properties": {
                "center": [payload.lon, payload.lat], # Original input center (for reference)
                "time_min": payload.time_min,
                "mode": payload.mode,
                "algorithm": "valhalla",
                "coord_type": payload.coord_type,
                "calc_time_ms": int((time.time() - start_time) * 1000)
            },
            "geometry": mapping(final_polygon)
        }

    except RuntimeError as e:
        logger.error(f"Isochrone service error: {e}")
        raise HTTPException(status_code=503, detail="Analysis Service Unavailable (Valhalla connection failed)")
    except Exception as e:
        logger.error(f"Unexpected analysis error: {e}", exc_info=True)

from modules.poi.schemas import PoiRequest, PoiResponse
from modules.poi.core import fetch_pois_by_polygon
from store.history_repo import history_repo

@router.post(
    "/analysis/pois",
    response_model=PoiResponse,
    summary="Fetch POIs in Isochrone",
    description="Fetch POIs within the given polygon boundary. Optionally saves to history."
)
async def fetch_pois_endpoint(payload: PoiRequest):
    try:
        # payload.polygon is List[List[float]] [[lng, lat]]
        # Assumed to be GCJ02 matching the map
        
        results = await fetch_pois_by_polygon(
            payload.polygon,
            payload.keywords,
            payload.types,
            max_count=payload.max_count
        )
        
        # Save History if requested
        if payload.save_history:
            center = payload.center or [0, 0]
            if payload.location_name:
                desc = f"{payload.location_name} - {len(results)} POIs"
            else:
                desc = f"{payload.keywords} - {len(results)} POIs"
            
            if payload.time_min:
                desc = f"{payload.time_min}min Analysis - {desc}"
                
            params = {
                "center": center,
                "time_min": payload.time_min,
                "keywords": payload.keywords,
                "mode": "walking" # Default or passed from context?
            }
            
            history_repo.create_record(
                params=params, 
                polygon=payload.polygon,
                pois=results,
                description=desc
            )
        
        return {
            "pois": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"POI fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/history", summary="Get Analysis History")
async def get_history_list(limit: int = 20):
    return history_repo.get_list(limit)

@router.get("/analysis/history/{id}", summary="Get Analysis Detail")
async def get_history_detail(id: int):
    res = history_repo.get_detail(id)
    if not res:
        raise HTTPException(status_code=404, detail="Record not found")
    return res

@router.delete("/analysis/history/{id}", summary="Delete Analysis Record")
async def delete_history_record(id: int):
    success = history_repo.delete_record(id)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found or delete failed")
    return {"status": "success", "id": id}
