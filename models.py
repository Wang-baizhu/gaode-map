"""
数据模型定义模块
使用Pydantic定义请求和响应的数据结构
"""

from typing import List, Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator


class LocationPoint(BaseModel):
    """
    位置点数据模型
    定义地图上一个点的属性，使用Pydantic进行数据验证
    """

    lng: float = Field(..., description="经度", ge=-180, le=180)
    lat: float = Field(..., description="纬度", ge=-90, le=90)
    name: str = Field(..., description="位置名称", min_length=1)
    type: str = Field("default", description="位置类型")
    lines: Optional[List[str]] = Field(None, description="途经线路")
    distance: Optional[int] = Field(None, description="距离(米)")
    year: Optional[int] = Field(None, description="年份")


class MapRequest(BaseModel):
    """
    地图生成请求模型
    经过服务内部生成的完整地图数据
    """

    center: dict = Field(..., description="中心点坐标")
    radius: int = Field(..., description="半径(米)", gt=0)
    points: List[LocationPoint] = Field(..., description="位置点列表", min_items=1)
    adcode: Optional[str] = Field(None, description="城市行政区编码，city 模式用于绘制边界")


class MapGenerateRequest(BaseModel):
    """
    用户请求模型
    只需提供地点和请求类型（around/city），其他参数由服务默认生成
    """

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    place: str = Field(..., description="地点名称，如城市或地标", min_length=1)
    type: Literal["around", "city"] = Field(
        ..., description="查询类型：around（附近）或 city（整城）"
    )
    source: Optional[Literal["gaode", "local"]] = Field(
        "gaode",
        description="数据来源：gaode（高德）或 local（本地历史数据）",
    )
    year: Optional[int] = Field(None, description="查询年份，仅 local 模式使用")
    radius: int = Field(1200, description="半径(米)", gt=0)
    place_types: Optional[List[str]] = Field(
        None,
        alias="place_types",
        description="可选：查询的类别数组，例如 ['公交站','地铁站']，优先使用该配置"
    )

    @model_validator(mode="before")
    def _handle_legacy_alias(cls, values):
        if isinstance(values, dict) and "place_types" not in values and "search_type" in values:
            values["place_types"] = values["search_type"]
        return values


class MapResponse(BaseModel):
    """
    地图生成响应模型
    服务端返回的响应数据
    """

    status: int = Field(..., description="状态码")
    message: str = Field(..., description="提示信息")
    url: Optional[str] = Field(None, description="生成的地图页面URL")
    expires_at: Optional[str] = Field(None, description="过期时间")


class PolygonCreateRequest(BaseModel):
    """
    多边形创建请求
    """

    coordinates: List[List[float]] = Field(..., description="多边形坐标数组")

    @field_validator("coordinates")
    @classmethod
    def _validate_coordinates(cls, value):
        if not isinstance(value, list) or len(value) < 3:
            raise ValueError("多边形至少需要 3 个坐标点")
        normalized = []
        for item in value:
            if not isinstance(item, (list, tuple)) or len(item) != 2:
                raise ValueError("坐标点必须为 [lng, lat] 数组")
            lng = float(item[0])
            lat = float(item[1])
            if not (-180 <= lng <= 180 and -90 <= lat <= 90):
                raise ValueError("坐标点超出范围")
            normalized.append([lng, lat])
        return normalized


class PolygonRecord(BaseModel):
    """
    多边形记录
    """

    id: int = Field(..., description="多边形ID")
    coordinates: List[List[float]] = Field(..., description="多边形坐标数组")


class PolygonListResponse(BaseModel):
    """
    多边形列表响应
    """

    polygons: List[PolygonRecord] = Field(default_factory=list, description="多边形列表")


class AdminMapRecord(BaseModel):
    """
    后台地图记录
    """

    id: int = Field(..., description="地图ID")
    created_at: datetime = Field(..., description="创建时间")
    search_type: str = Field(..., description="查询类型")
    center: dict = Field(..., description="中心点坐标")
    source: Optional[str] = Field(None, description="数据来源")
    year: Optional[int] = Field(None, description="年份")
    map_url: str = Field(..., description="地图访问URL")
    polygons: List[PolygonRecord] = Field(default_factory=list, description="多边形列表")


class AdminMapListResponse(BaseModel):
    """
    后台地图列表响应
    """

    maps: List[AdminMapRecord] = Field(default_factory=list, description="地图列表")
