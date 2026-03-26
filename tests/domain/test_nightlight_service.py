import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))
sys.path.append(str(Path(__file__).resolve().parents[1]))

from modules.nightlight.service import (  # noqa: E402
    build_nightlight_meta_payload,
    get_nightlight_grid,
    get_nightlight_layer,
    get_nightlight_overview,
    get_nightlight_raster_preview,
)
from nightlight_test_utils import configure_nightlight_dir, sample_gcj02_polygon  # noqa: E402


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

    grid = get_nightlight_grid(polygon, "gcj02", 2025)
    layer = get_nightlight_layer(polygon, "gcj02", scope_id=grid["scope_id"], year=2025, view="radiance")
    raster = get_nightlight_raster_preview(polygon, "gcj02", scope_id=grid["scope_id"], year=2025)

    assert grid["cell_count"] == len(grid["features"])
    assert 0 < grid["cell_count"] <= 4
    grid_ids = {str((feature.get("properties") or {}).get("cell_id") or "") for feature in grid["features"]}
    layer_ids = {str((cell or {}).get("cell_id") or "") for cell in layer["cells"]}
    assert "" not in grid_ids
    assert grid_ids == layer_ids
    assert raster["image_url"].startswith("data:image/png;base64,")
    assert len(raster["bounds_gcj02"]) == 2
    assert raster["legend"]["unit"] == "nWatts/(cm^2 sr)"


def test_nightlight_unavailable_year_raises_value_error(tmp_path):
    configure_nightlight_dir(tmp_path, year=2025)

    try:
        get_nightlight_overview(sample_gcj02_polygon(), "gcj02", 2024)
    except ValueError as exc:
        assert "nightlight dataset year unavailable" in str(exc)
    else:  # pragma: no cover
        raise AssertionError("expected ValueError for unavailable year")
