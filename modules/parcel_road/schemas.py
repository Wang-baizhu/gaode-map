from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class RoadParcelRequest(BaseModel):
    polygon: List[List[float]] = Field(
        ...,
        min_length=3,
        description="Polygon ring coordinates ([[lng, lat], ...])",
    )
    coord_type: Literal["gcj02", "wgs84"] = Field(
        "gcj02",
        description="Input and output coordinate system of polygon",
    )
    center: Optional[List[float]] = Field(
        None,
        min_length=2,
        max_length=2,
        description="Center coordinate [lng, lat], optional",
    )
    mode: Literal["walking", "bicycling", "driving"] = Field(
        "walking",
        description="Travel mode used by Valhalla expansion",
    )
    time_min: int = Field(15, ge=3, le=90, description="Isochrone time in minutes")
    min_parcel_area_m2: float = Field(
        300.0,
        ge=0.0,
        description="Minimum parcel area in square meters",
    )


class RoadParcelFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any] = Field(default_factory=dict)


class RoadParcelMeta(BaseModel):
    source: str = "valhalla_expansion"
    road_line_count: int = 0
    min_parcel_area_m2: float = 0.0


class RoadParcelResponse(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: List[RoadParcelFeature] = Field(default_factory=list)
    count: int = 0
    meta: RoadParcelMeta
