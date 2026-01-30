from datetime import datetime
import os
from fastapi import APIRouter, Response
from fastapi.responses import FileResponse

from config import settings

router = APIRouter()


@router.get("/health", summary="健康检查")
async def health_check():
    """检查服务是否正常运行"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
    }


@router.get("/", summary="根路径")
async def root():
    """返回欢迎信息"""
    return {
        "message": "欢迎使用高德地图扣子插件API",
        "docs": f"{settings.app_base_url}/docs",
        "health": f"{settings.app_base_url}/health",
    }


@router.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """处理favicon.ico请求，避免404错误"""
    favicon_path = os.path.join(settings.static_dir, "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path)
    # 如果没有图标文件，返回204 No Content (成功但无内容) 避免浏览器控制台报错
    return Response(status_code=204)


@router.get("/api/v1/config", summary="获取前端配置")
async def get_frontend_config():
    """
    返回前端所需的配置信息 (如高德地图 API Key)
    """
    return {
        "amap_js_api_key": settings.amap_js_api_key,
        "amap_js_security_code": settings.amap_js_security_code,
    }
