import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import HTMLResponse

from models import MapRequest
from store import build_center_fingerprint, find_map_by_fingerprint
from utils import parse_json, generate_html_content

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/map", response_class=HTMLResponse, summary="渲染地图页面")
async def render_map_page(
    search_type: str = Query(..., alias="type"),
    location: str = Query(..., description="lng,lat"),
    place_types: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
):
    """
    通过查询参数指纹匹配 mapData 并渲染地图模板。
    """
    normalized_type = (search_type or "").strip()
    if normalized_type not in ("around", "city"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="type 参数必须为 around 或 city",
        )
    lng_str, lat_str = (location.split(",") + ["", ""])[:2]
    logger.debug("渲染地图页面请求: type=%s, location=%s", normalized_type, (lng_str, lat_str))
    try:
        lng = float(lng_str)
        lat = float(lat_str)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="location 参数格式错误，应为 lng,lat",
        ) from exc
    parsed_place_types = parse_json(place_types)
    normalized_place_types = tuple(item for item in (parsed_place_types or []) if item)
    center = {"lng": lng, "lat": lat}
    effective_source = (source or "gaode").strip()
    effective_year = year
    if effective_source == "gaode" and effective_year is None:
        effective_year = datetime.now().year
    fingerprint_json = build_center_fingerprint(
        center,
        normalized_type,
        normalized_place_types,
        effective_source,
        effective_year,
    )
    logger.debug("生成指纹: %s", fingerprint_json)
    existing = find_map_by_fingerprint(fingerprint_json)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地图数据不存在或已过期",
        )
    map_id, map_data, _ = existing
    map_request = MapRequest(**map_data)
    html_content = await generate_html_content(map_request, map_id=map_id)
    return HTMLResponse(content=html_content, media_type="text/html")
