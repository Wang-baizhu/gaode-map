from pydantic import BaseModel, Field
from typing import Literal

class IsochroneRequest(BaseModel):
    """
    Independent Request Model for Isochrone Service.
    Input: WGS84 Coordinates.
    """
    lat: float = Field(..., description="Latitude (WGS84)", ge=-90, le=90)
    lon: float = Field(..., description="Longitude (WGS84)", ge=-180, le=180)
    time_min: int = Field(15, description="Time Horizon (minutes)", gt=0, le=120)
    mode: Literal["walking", "driving", "bicycling"] = Field("walking", description="Transportation Mode")
    coord_type: Literal["wgs84", "gcj02"] = Field("wgs84", description="Input Coordinate System")

class IsochroneResponse(BaseModel):
    """
    Standard GeoJSON Response Wrapper
    """
    type: str = "Feature"
    properties: dict
    geometry: dict
