import json
from pathlib import Path

import numpy as np

from core.config import settings
from modules.nightlight import service as nightlight_service
from modules.providers.amap.utils.transform_posi import wgs84_to_gcj02


def write_nightlight_test_dataset(root: Path, year: int = 2025) -> Path:
    import rasterio
    from rasterio.transform import from_origin

    annual_dir = root / "annual"
    annual_dir.mkdir(parents=True, exist_ok=True)
    tif_path = annual_dir / f"black_marble_{year}_china.tif"

    data = np.array(
        [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16],
        ],
        dtype=np.float32,
    )
    transform = from_origin(121.46, 31.25, 0.01, 0.01)
    with rasterio.open(
        tif_path,
        "w",
        driver="GTiff",
        width=data.shape[1],
        height=data.shape[0],
        count=1,
        dtype="float32",
        crs="EPSG:4326",
        transform=transform,
        nodata=-9999.0,
    ) as dst:
        dst.write(data, 1)

    manifest = {
        "default_year": int(year),
        "datasets": [
            {
                "year": int(year),
                "label": f"{int(year)} 年",
                "file": f"annual/{tif_path.name}",
                "unit": "nWatts/(cm^2 sr)",
                "variable": "NearNadir_Composite_Snow_Free",
            }
        ],
    }
    (root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return tif_path


def sample_gcj02_polygon():
    ring_wgs84 = [
        [121.462, 31.248],
        [121.498, 31.248],
        [121.498, 31.214],
        [121.462, 31.214],
        [121.462, 31.248],
    ]
    return [list(wgs84_to_gcj02(lng, lat)) for lng, lat in ring_wgs84]


def configure_nightlight_dir(tmp_path: Path, year: int = 2025) -> Path:
    data_dir = tmp_path / "nightlight_data"
    write_nightlight_test_dataset(data_dir, year=year)
    settings.nightlight_data_dir = str(data_dir)
    settings.nightlight_preview_max_size = 512
    settings.nightlight_grid_max_cells = 4
    nightlight_service._CLIP_CACHE.clear()
    return data_dir
