from pydantic import BaseModel, Field
from typing import Literal, List, Optional

class IsochroneRequest(BaseModel):
    """
    Independent Request Model for Isochrone Service.
    Input: GCJ02 by default (matches AMap/Frontend), can be WGS84 if coord_type set.
    """
    lat: float = Field(..., description="Latitude (coord_type)", ge=-90, le=90)
    lon: float = Field(..., description="Longitude (coord_type)", ge=-180, le=180)
    time_min: int = Field(15, description="Time Horizon (minutes)", gt=0, le=120)
    mode: Literal["walking", "driving", "bicycling"] = Field("walking", description="Transportation Mode")
    coord_type: Literal["wgs84", "gcj02"] = Field("gcj02", description="Input Coordinate System")
    origin_mode: Literal["single", "multi_sample"] = Field(
        default="single",
        description="Origin generation mode: single center point or sampled multi-origins inside scope."
    )
    clip_polygon: Optional[List[List[float]]] = Field(
        default=None,
        description="Optional polygon ring to clip the isochrone result; uses coord_type."
    )
    clip_output: Optional[bool] = Field(
        default=None,
        description="Whether to clip final output by clip_polygon. Default: true for single, false for multi_sample."
    )
    sample_boundary_step_m: int = Field(
        default=120,
        ge=60,
        le=300,
        description="Boundary sampling spacing (meters) when origin_mode=multi_sample."
    )
    sample_inner_step_m: int = Field(
        default=220,
        ge=100,
        le=500,
        description="Interior sampling spacing (meters) when origin_mode=multi_sample."
    )
    sample_max_points: int = Field(
        default=48,
        ge=8,
        le=120,
        description="Max sampled origins when origin_mode=multi_sample."
    )

class IsochroneResponse(BaseModel):
    """
    Standard GeoJSON Response Wrapper
    """
    type: str = "Feature"
    properties: dict
    geometry: dict
