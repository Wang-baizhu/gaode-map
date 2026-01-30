"""
配置管理模块
使用Pydantic Settings从环境变量加载配置
"""

from pathlib import Path
from typing import List, Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    应用配置类
    从环境变量加载配置，支持类型转换和验证
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # 未声明的 env 变量忽略，不抛出校验错误
    )

    # 应用配置
    app_host: str = "0.0.0.0"  # 应用主机地址，默认0.0.0.0（允许外部访问）
    app_port: int = 8000  # 应用端口，默认8000
    app_base_url: str = "http://localhost:8000"  # 基础URL，用于生成完整的访问链接

    # API密钥配置
    api_keys: List[str] = ["dev-only-key-change-in-production"]  # API密钥列表，用于访问鉴权

    # 文件存储配置
    static_dir: str = str(Path(__file__).resolve().parent / "static")  # 静态资源根目录
    templates_dir: str = str(Path(__file__).resolve().parent / "templates")  # Jinja模板目录
    template_name: str = "map_with_filters.html"  # 默认模板文件名
    db_path: str = str(Path(__file__).resolve().parent / "data" / "map.db")  # SQLite 数据文件路径

    # 高德地图API配置
    amap_web_service_key: str = Field(
        "",
        validation_alias="AMAP_WEB_SERVICE_KEY",
        description="高德 Web 服务（Web API）Key",
    )
    amap_js_api_key: str = Field(
        validation_alias= "AMAP_JS_API_KEY",
        description="高德 Web JS API Key",
    )
    amap_js_security_code: str = Field(
        "",
        validation_alias="AMAP_JS_SECURITY_CODE",
        description="高德 JS 安全码（若未开启可留空）",
    )

    # 本地历史数据查询服务配置
    local_query_base_url: str = Field(
        "http://127.0.0.1:8001",
        validation_alias="LOCAL_QUERY_BASE_URL",
        description="本地历史数据查询服务地址",
    )
    local_query_coord_system: Literal["gcj02", "wgs84"] = Field(
        "gcj02",
        validation_alias="LOCAL_QUERY_COORD_SYSTEM",
        description="本地历史数据查询服务使用的坐标系（location 字段）",
    )

    # CORS跨域配置
    cors_origins: List[str] = ["*"]  # 允许访问的域名列表

    # 等时圈（Isochrone）配置
    valhalla_base_url: str = Field(
        "http://127.0.0.1:8002",
        validation_alias="VALHALLA_BASE_URL",
        description="Valhalla 路由引擎基础地址",
    )
    valhalla_timeout_s: int = Field(
        60,
        validation_alias="VALHALLA_TIMEOUT_S",
        description="Valhalla 请求超时时间（秒）",
    )


settings = Settings()
