from datetime import datetime

from fastapi import APIRouter

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
