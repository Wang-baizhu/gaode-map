import asyncio
import json
import logging
from io import BytesIO
from typing import Optional, Sequence
from urllib.parse import urlencode
from datetime import datetime

from fastapi import APIRouter, HTTPException, Security, status
from fastapi.responses import StreamingResponse

from config import settings
from models import (
    MapGenerateRequest,
    MapResponse,
    PolygonCreateRequest,
    PolygonListResponse,
    PolygonRecord,
)
from modules import generate_map_json
from store import (
    delete_polygon,
    find_map_by_center_and_type,
    get_map_data,
    list_polygons_for_map,
    save_map_data,
    save_polygon,
)
from utils import export_map_to_xlsx

from .utils.deps import load_map_request, verify_api_key

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/api/v1/generate-map",
    response_model=MapResponse,
    summary="生成地图页面",
    description="接收位置数据，生成地图HTML并返回访问链接。需要在请求头中添加 Authorization: Bearer YOUR_API_KEY",
)
async def generate_map(
    request: MapGenerateRequest,
    api_key_valid: bool = Security(verify_api_key),
):
    """
    生成地图主接口：
    - 用户只需提供 place 和 type（around/city）
    - 服务内部调用 gen_json 生成完整地图JSON，再渲染为HTML
    """
    try:
        logger.info("收到地图生成请求: place=%s, type=%s", request.place, request.type)

        # 1) 生成完整地图 JSON（中间产物）
        def pre_points_hook(center: dict, search_type: str, place_types: Optional[Sequence[str]] = None):
            """
            仅在拿到中心点后查询数据库，命中则返回 (id, body)。
            """
            normalized_place_types = tuple(sorted({item for item in (place_types or []) if item}))
            source = request.source or "gaode"
            effective_year = request.year
            if source == "gaode" and effective_year is None:
                effective_year = datetime.now().year
            existing = find_map_by_center_and_type(
                center,
                search_type,
                normalized_place_types,
                source,
                effective_year,
            )
            if not existing:
                return None
            map_id, body, _ = existing
            logger.info("预检查命中缓存: center=%s, type=%s", center, search_type)
            return map_id, body

        source = request.source or "gaode"
        effective_year = request.year
        if source == "gaode" and effective_year is None:
            effective_year = datetime.now().year
        map_payload, cached_id = generate_map_json(
            place=request.place,
            search_type=request.type,
            place_types=request.place_types,
            radius=request.radius,
            year=effective_year,
            source=source,
            auth_header=None,
            pre_points_hook=pre_points_hook,
        )

        # 2) 校验并构造渲染所需数据
        map_request = MapRequest(**map_payload["body"])

        # 3) 如果没有缓存的 id，则保存至数据库
        if cached_id is None:
            cached_id = await asyncio.to_thread(
                save_map_data,
                map_request.model_dump(),
                map_request.center,
                request.type,
                tuple(sorted({item for item in (request.place_types or []) if item})),
                source,
                effective_year,
            )
        else:
            logging.debug("使用缓存的地图数据，无需保存新记录")
        # 生成访问URL
        base_url = settings.app_base_url.rstrip("/")
        center = map_request.center or {}
        location = f"{center.get('lng')},{center.get('lat')}"
        params = {
            "type": request.type,
            "location": location,
        }
        if source != "gaode":
            params["source"] = source
        if effective_year is not None:
            params["year"] = str(effective_year)
        normalized_place_types = [item for item in (request.place_types or []) if item]
        if normalized_place_types:
            params["place_types"] = json.dumps(normalized_place_types, ensure_ascii=False)
        file_url = f"{base_url}/map?{urlencode(params)}"

        logger.info("地图生成成功: id=%s, url=%s", cached_id, file_url)
        return MapResponse(
            status=200,
            message="地图生成成功",
            url=file_url,
            expires_at=None,
        )

    except Exception as exc:  # noqa: BLE001
        logger.error("地图生成失败: %s", exc, exc_info=True)
        return MapResponse(
            status=500,
            message=f"地图生成失败: {str(exc)}",
            url=None,
            expires_at=None,
        )


@router.get(
    "/api/v1/maps/{map_id}/export/xlsx",
    summary="导出地图数据为xlsx",
)
async def export_map_xlsx(map_id: int):
    """导出当前地图数据为 xlsx 文件。"""
    map_request = await load_map_request(map_id)
    filename, content = export_map_to_xlsx(map_request, map_id)
    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/api/v1/maps/{map_id}/polygons",
    response_model=PolygonListResponse,
    summary="获取地图多边形列表",
)
async def list_map_polygons(map_id: int):
    """获取指定地图的多边形列表。"""
    map_data = await asyncio.to_thread(get_map_data, map_id)
    if not map_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地图数据不存在或已过期",
        )
    polygons = await asyncio.to_thread(list_polygons_for_map, map_id)
    return {"polygons": polygons}


@router.post(
    "/api/v1/maps/{map_id}/polygons",
    response_model=PolygonRecord,
    summary="新增地图多边形",
)
async def create_map_polygon(map_id: int, payload: PolygonCreateRequest):
    """新增多边形并绑定 map_id。"""
    map_data = await asyncio.to_thread(get_map_data, map_id)
    if not map_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地图数据不存在或已过期",
        )
    polygon_id = await asyncio.to_thread(save_polygon, map_id, payload.coordinates)
    return {"id": polygon_id, "coordinates": payload.coordinates}


@router.delete(
    "/api/v1/maps/{map_id}/polygons/{polygon_id}",
    summary="删除地图多边形",
)
async def delete_map_polygon(map_id: int, polygon_id: int):
    """删除指定地图的多边形。"""
    map_data = await asyncio.to_thread(get_map_data, map_id)
    if not map_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地图数据不存在或已过期",
        )
    deleted = await asyncio.to_thread(delete_polygon, map_id, polygon_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="多边形记录不存在",
        )
    return {"status": "ok"}


@router.get("/api/v1/config", summary="前端配置接口")
async def get_frontend_config():
    """
    获取前端所需配置信息 (JS API Key, Security Code等)
    前端 (Vue) 初始化时调用此接口。
    """
    return {
        "amap_js_api_key": settings.amap_js_api_key,
        "amap_js_security_code": settings.amap_js_security_code,
        # 默认空的地图配置，analysis页面自己控制逻辑
        "map_type_config_json": { "groups": [], "markerStyles": {} }
    }
