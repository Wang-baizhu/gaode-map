from __future__ import annotations

from pathlib import Path
from typing import Any

from core.spatial import (
    build_scope_id,
    convert_geometry,
    normalize_ring,
    polygon_from_payload,
    round_float,
    to_wgs84_geometry,
)

RADIANCE_VIEW = "radiance"
RADIANCE_VIEW_LABEL = "夜光辐亮"
RADIANCE_UNIT = "nWatts/(cm^2 sr)"
PREVIEW_STYLE_VERSION = "v1"
GRID_STYLE_VERSION = "v2"
MANIFEST_FILENAME = "manifest.json"
DEFAULT_VARIABLE_NAME = "NearNadir_Composite_Snow_Free"
PREVIEW_PALETTE = [
    (9, 11, 31),
    (35, 57, 91),
    (47, 104, 141),
    (96, 165, 250),
    (250, 204, 21),
    (249, 115, 22),
]


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolve_dir(path_value: str) -> Path:
    path = Path(path_value).expanduser()
    if not path.is_absolute():
        path = project_root() / path
    return path.resolve()
def year_label(year: int) -> str:
    return f"{int(year)} 年"
