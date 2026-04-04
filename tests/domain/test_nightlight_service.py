import sys
from pathlib import Path

import numpy as np
from rasterio.transform import from_origin
from shapely.geometry import box

sys.path.append(str(Path(__file__).resolve().parents[2]))
sys.path.append(str(Path(__file__).resolve().parents[1]))

from core.config import settings  # noqa: E402
from modules.nightlight.aggregate import aggregate_clip_to_target_cells  # noqa: E402
from modules.nightlight.types import NightlightClip, TargetGridCell  # noqa: E402
from modules.nightlight.service import (  # noqa: E402
    build_nightlight_meta_payload,
    get_nightlight_grid,
    get_nightlight_layer,
    get_nightlight_overview,
    get_nightlight_raster_preview,
)
from modules.population.service import get_population_grid  # noqa: E402
from nightlight_test_utils import (  # noqa: E402
    configure_nightlight_dir,
    sample_gcj02_polygon,
    write_population_test_dataset,
    write_nightlight_test_dataset,
)


def _target_cell(cell_id: str, row: int, col: int, minx: float, miny: float, maxx: float, maxy: float):
    ring = [
        [minx, maxy],
        [maxx, maxy],
        [maxx, miny],
        [minx, miny],
        [minx, maxy],
    ]
    return TargetGridCell(
        cell_id=cell_id,
        row=row,
        col=col,
        centroid_gcj02=[(minx + maxx) / 2.0, (miny + maxy) / 2.0],
        geometry_gcj02=[ring],
        geometry_wgs84=box(minx, miny, maxx, maxy),
        feature={
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [ring],
            },
            "properties": {
                "row": row,
                "col": col,
                "centroid_gcj02": [(minx + maxx) / 2.0, (miny + maxy) / 2.0],
                "cell_id": cell_id,
            },
        },
    )


def test_nightlight_meta_and_overview_summary(tmp_path):
    configure_nightlight_dir(tmp_path, year=2025)

    meta = build_nightlight_meta_payload()
    assert meta["default_year"] == 2025
    assert meta["available_years"] == [{"year": 2025, "label": "2025 年"}]

    overview = get_nightlight_overview(sample_gcj02_polygon(), "gcj02", 2025)
    summary = overview["summary"]
    assert overview["year"] == 2025
    assert abs(summary["total_radiance"] - 136.0) < 1e-6
    assert abs(summary["mean_radiance"] - 8.5) < 1e-6
    assert abs(summary["max_radiance"] - 16.0) < 1e-6
    assert abs(summary["lit_pixel_ratio"] - 1.0) < 1e-6
    assert abs(summary["p90_radiance"] - 14.5) < 1e-6
    assert summary["valid_pixel_count"] == 16
    assert summary["lit_pixel_count"] == 16


def test_nightlight_grid_layer_and_raster_alignment(tmp_path):
    configure_nightlight_dir(tmp_path, year=2025)
    polygon = sample_gcj02_polygon()

    population_grid = get_population_grid(polygon, "gcj02")
    grid = get_nightlight_grid(polygon, "gcj02", 2025)
    layer = get_nightlight_layer(polygon, "gcj02", scope_id=grid["scope_id"], year=2025, view="radiance")
    raster = get_nightlight_raster_preview(polygon, "gcj02", scope_id=grid["scope_id"], year=2025)

    assert grid["cell_count"] == len(grid["features"])
    assert grid["cell_count"] > 0
    grid_ids = {str((feature.get("properties") or {}).get("cell_id") or "") for feature in grid["features"]}
    population_ids = {str((feature.get("properties") or {}).get("cell_id") or "") for feature in population_grid["features"]}
    layer_ids = {str((cell or {}).get("cell_id") or "") for cell in layer["cells"]}
    assert "" not in grid_ids
    assert grid["cell_count"] == population_grid["cell_count"]
    assert grid_ids == population_ids
    assert grid_ids == layer_ids
    assert len(layer["cells"]) == grid["cell_count"]
    assert any(float(cell["value"]) > 0.0 for cell in layer["cells"])
    assert raster["image_url"].startswith("data:image/png;base64,")
    assert len(raster["bounds_gcj02"]) == 2
    assert raster["legend"]["unit"] == "nWatts/(cm^2 sr)"


def test_nightlight_clip_aggregation_maps_one_large_pixel_to_multiple_population_cells():
    clip = NightlightClip(
        array=np.ma.array(np.array([[10.0]], dtype=np.float64), mask=np.array([[False]], dtype=bool)),
        transform=from_origin(0.0, 1.0, 1.0, 1.0),
        width=1,
        height=1,
    )
    features = [
        _target_cell("nl_0_0", 0, 0, 0.0, 0.5, 0.5, 1.0),
        _target_cell("nl_0_1", 0, 1, 0.5, 0.5, 1.0, 1.0),
        _target_cell("nl_1_0", 1, 0, 0.0, 0.0, 0.5, 0.5),
        _target_cell("nl_1_1", 1, 1, 0.5, 0.0, 1.0, 0.5),
    ]

    rows = aggregate_clip_to_target_cells(clip, features)

    assert len(rows) == 4
    assert all(float(row.raw_value) > 0.0 for row in rows)
    assert all(float(row.raw_value) == 10.0 for row in rows)
    assert all(int(row.valid_pixel_count) == 1 for row in rows)


def test_nightlight_clip_aggregation_uses_area_weighted_mean():
    clip = NightlightClip(
        array=np.ma.array(np.array([[10.0, 20.0]], dtype=np.float64), mask=np.array([[False, False]], dtype=bool)),
        transform=from_origin(0.0, 1.0, 1.0, 1.0),
        width=2,
        height=1,
    )
    features = [
        _target_cell("weighted", 0, 0, 0.25, 0.0, 1.25, 1.0),
        _target_cell("outside", 0, 1, 2.0, 0.0, 2.2, 1.0),
    ]

    rows = aggregate_clip_to_target_cells(clip, features)
    row_map = {str(row.cell_id): row for row in rows}

    assert abs(float(row_map["weighted"].raw_value) - 12.5) < 1e-6
    assert int(row_map["weighted"].valid_pixel_count) == 2
    assert float(row_map["outside"].raw_value) == 0.0
    assert int(row_map["outside"].valid_pixel_count) == 0


def test_nightlight_grid_omits_cells_outside_valid_coverage(tmp_path):
    data_dir = tmp_path / "nightlight_zero_fill"
    write_nightlight_test_dataset(
        data_dir,
        year=2025,
        data=np.array(
            [
                [1, -9999],
                [-9999, -9999],
            ],
            dtype=np.float32,
        ),
        nodata=-9999.0,
    )
    population_dir = tmp_path / "population_data"
    write_population_test_dataset(population_dir)
    settings.nightlight_data_dir = str(data_dir)
    settings.nightlight_preview_max_size = 512
    settings.population_data_dir = str(population_dir)

    grid = get_nightlight_grid(sample_gcj02_polygon(), "gcj02", 2025)
    layer = get_nightlight_layer(sample_gcj02_polygon(), "gcj02", scope_id=grid["scope_id"], year=2025)

    assert grid["cell_count"] == 16
    assert grid["cell_count"] == len(layer["cells"])
    positive_count = sum(1 for cell in layer["cells"] if float(cell["value"]) > 0.0)
    zero_count = sum(1 for cell in layer["cells"] if float(cell["value"]) <= 0.0)
    assert positive_count == 1
    assert zero_count == 15


def test_nightlight_unavailable_year_raises_value_error(tmp_path):
    configure_nightlight_dir(tmp_path, year=2025)

    try:
        get_nightlight_overview(sample_gcj02_polygon(), "gcj02", 2024)
    except ValueError as exc:
        assert "nightlight dataset year unavailable" in str(exc)
    else:  # pragma: no cover
        raise AssertionError("expected ValueError for unavailable year")
