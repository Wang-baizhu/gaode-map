"""
FastAPI主应用入口
职责：创建应用实例、集成中间件、挂载路由、处理请求生命周期
"""

import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from router import admin_router, api_router, misc_router, pages_router, analysis_router
from store import init_db
import asyncio

# ==================== 配置日志 ====================
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(_: FastAPI):
    """应用生命周期管理"""
    logger.info("=" * 50)
    logger.info("应用启动中...")
    logger.info(f"基础URL: {settings.app_base_url}")
    logger.info(f"静态文件目录: {settings.static_dir}")
    logger.info("=" * 50)

    # 初始化数据库
    await asyncio.to_thread(init_db)

    # 确保静态文件目录存在
    os.makedirs(settings.static_dir, exist_ok=True)

    try:
        yield
    finally:
        logger.info("应用关闭中...")
        logger.info("应用已关闭")

# ==================== 创建FastAPI应用 ====================
app = FastAPI(
    title="高德地图扣子插件API",
    description="接收JSON数据，生成地图页面并返回URL链接",
    version="1.0.0",
    lifespan=lifespan,
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation Error: {exc.body}")
    logger.error(f"Errors: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


# 确保静态目录存在（统一的静态资源根目录）
STATIC_ROOT = Path(settings.static_dir).resolve()
os.makedirs(STATIC_ROOT, exist_ok=True)

# 挂载静态资源目录（同时覆盖生成的HTML和拆分的CSS/JS等资源）
app.mount(
    "/static",
    StaticFiles(directory=STATIC_ROOT),
    name="static",
)

# ==================== API路由 ====================

app.include_router(api_router)
app.include_router(admin_router)
app.include_router(pages_router)
app.include_router(misc_router)
app.include_router(analysis_router)
# ==================== 主入口 ====================

if __name__ == "__main__":
    import uvicorn

    logger.info("启动FastAPI应用...")
    logger.info(f"访问地址: http://localhost:{settings.app_port}")
    logger.info(f"API文档: http://localhost:{settings.app_port}/docs")

    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True,
        log_level="info"
    )
