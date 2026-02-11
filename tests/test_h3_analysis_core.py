import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from modules.gaode_service.utils.transform_posi import wgs84_to_gcj02
from modules.grid_h3.analysis import analyze_h3_grid


def _sample_wgs84_polygon():
    lat = 31.2304
    lon = 121.4737
    d = 0.01
    return [
        [lon - d, lat - d],
        [lon + d, lat - d],
        [lon + d, lat + d],
        [lon - d, lat + d],
        [lon - d, lat - d],
    ]


def _sample_gcj02_polygon():
    return [list(wgs84_to_gcj02(x, y)) for x, y in _sample_wgs84_polygon()]


def _sample_pois_gcj02():
    points_wgs84 = [
        (121.4737, 31.2304, "050000"),  # dining
        (121.4742, 31.2306, "050000"),  # dining
        (121.4740, 31.2302, "060000"),  # shopping
        (121.4734, 31.2299, "150000"),  # transport
    ]
    pois = []
    for idx, (lng, lat, type_code) in enumerate(points_wgs84):
        glng, glat = wgs84_to_gcj02(lng, lat)
        pois.append(
            {
                "id": str(idx + 1),
                "name": f"poi-{idx + 1}",
                "location": [glng, glat],
                "type": type_code,
            }
        )
    return pois


def test_poi_count_consistency():
    result = analyze_h3_grid(
        polygon=_sample_gcj02_polygon(),
        resolution=10,
        coord_type="gcj02",
        include_mode="intersects",
        min_overlap_ratio=0.0,
        pois=_sample_pois_gcj02(),
        poi_coord_type="gcj02",
        neighbor_ring=1,
    )
    grid = result["grid"]
    assigned = sum((f.get("properties", {}).get("poi_count") or 0) for f in grid["features"])
    assert assigned == result["summary"]["poi_count"]


def test_single_category_entropy_zero():
    one_poi = [_sample_pois_gcj02()[0]]
    result = analyze_h3_grid(
        polygon=_sample_gcj02_polygon(),
        resolution=10,
        coord_type="gcj02",
        include_mode="intersects",
        min_overlap_ratio=0.0,
        pois=one_poi,
        poi_coord_type="gcj02",
        neighbor_ring=1,
    )
    non_empty_cells = [f for f in result["grid"]["features"] if (f.get("properties", {}).get("poi_count") or 0) > 0]
    assert len(non_empty_cells) > 0
    for feature in non_empty_cells:
        assert feature["properties"]["local_entropy"] == 0.0


def test_empty_poi_input():
    result = analyze_h3_grid(
        polygon=_sample_gcj02_polygon(),
        resolution=10,
        coord_type="gcj02",
        include_mode="intersects",
        min_overlap_ratio=0.0,
        pois=[],
        poi_coord_type="gcj02",
        neighbor_ring=1,
    )
    assert result["summary"]["poi_count"] == 0
    assert result["summary"]["avg_density_poi_per_km2"] == 0.0
    assert result["summary"]["avg_local_entropy"] == 0.0


def test_neighbor_metrics_fields_exist():
    result = analyze_h3_grid(
        polygon=_sample_gcj02_polygon(),
        resolution=10,
        coord_type="gcj02",
        include_mode="intersects",
        min_overlap_ratio=0.0,
        pois=_sample_pois_gcj02(),
        poi_coord_type="gcj02",
        neighbor_ring=1,
    )
    for feature in result["grid"]["features"]:
        props = feature["properties"]
        assert "neighbor_mean_density" in props
        assert "neighbor_mean_entropy" in props
        assert "neighbor_count" in props


def test_moran_i_is_none_or_finite():
    result = analyze_h3_grid(
        polygon=_sample_gcj02_polygon(),
        resolution=10,
        coord_type="gcj02",
        include_mode="intersects",
        min_overlap_ratio=0.0,
        pois=_sample_pois_gcj02(),
        poi_coord_type="gcj02",
        neighbor_ring=1,
    )
    moran = result["summary"]["global_moran_i_density"]
    assert moran is None or isinstance(moran, float)


if __name__ == "__main__":
    test_poi_count_consistency()
    test_single_category_entropy_zero()
    test_empty_poi_input()
    test_neighbor_metrics_fields_exist()
    test_moran_i_is_none_or_finite()
    print("H3 analysis core tests passed.")
