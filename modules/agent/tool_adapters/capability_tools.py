from __future__ import annotations

from typing import Any, Awaitable, Callable, Dict, List

from ..analysis_extractors import (
    analyze_poi_mix,
    build_h3_structure_analysis,
    build_nightlight_pattern_analysis,
    build_poi_structure_analysis,
    build_population_profile_analysis,
    build_road_pattern_analysis,
    infer_area_character_labels,
    score_site_candidates,
)
from ..policy_table import resolve_policy
from ..schemas import AnalysisSnapshot, ToolResult
from .analysis_tools import analyze_target_supply_gap_from_scope
from .h3_tools import compute_h3_metrics_from_scope_and_pois
from .nightlight_tools import compute_nightlight_overview_from_scope
from .poi_tools import fetch_pois_in_scope
from .population_tools import compute_population_overview_from_scope
from .result_tools import read_current_results
from .road_tools import compute_road_syntax_from_scope
from .scope_tools import read_current_scope

ToolAdapter = Callable[..., Awaitable[ToolResult]]


async def _run_child_tool(
    *,
    runner: ToolAdapter,
    tool_name: str,
    arguments: Dict[str, Any],
    snapshot: AnalysisSnapshot,
    artifacts: Dict[str, Any],
    question: str,
) -> ToolResult:
    try:
        return await runner(arguments=arguments, snapshot=snapshot, artifacts=artifacts, question=question)
    except Exception as exc:
        return ToolResult(
            tool_name=tool_name,
            status="failed",
            warnings=[str(exc)],
            error=exc.__class__.__name__,
        )


def _current_summary(snapshot: AnalysisSnapshot, artifacts: Dict[str, Any], key: str) -> Dict[str, Any]:
    artifact = artifacts.get(f"current_{key}_summary")
    if isinstance(artifact, dict):
        return dict(artifact)
    source = getattr(snapshot, key, {})
    if isinstance(source, dict) and isinstance(source.get("summary"), dict):
        return dict(source.get("summary") or {})
    return {}


def _has_scope(snapshot: AnalysisSnapshot, artifacts: Dict[str, Any]) -> bool:
    if artifacts.get("scope_polygon"):
        return True
    scope = snapshot.scope if isinstance(snapshot.scope, dict) else {}
    return bool(scope.get("polygon") or scope.get("drawn_polygon") or scope.get("isochrone_feature"))


async def get_area_data_bundle(
    *,
    arguments: Dict[str, Any],
    snapshot: AnalysisSnapshot,
    artifacts: Dict[str, Any],
    question: str,
) -> ToolResult:
    policy = resolve_policy(arguments.get("policy_key"), fallback="district_summary")
    local_artifacts = dict(artifacts or {})
    evidence: List[Dict[str, Any]] = []
    warnings: List[str] = []
    tool_statuses: List[Dict[str, Any]] = []

    if not _has_scope(snapshot, local_artifacts):
        return ToolResult(
            tool_name="get_area_data_bundle",
            status="failed",
            warnings=["缺少分析范围，无法构建区域数据包"],
            error="missing_scope_polygon",
        )

    base_steps: List[tuple[str, ToolAdapter, Dict[str, Any], bool]] = [
        ("read_current_scope", read_current_scope, {}, True),
        ("read_current_results", read_current_results, {}, True),
        ("fetch_pois_in_scope", fetch_pois_in_scope, {"source": str(arguments.get("source") or "local")}, not bool(local_artifacts.get("current_pois") or snapshot.pois or (snapshot.poi_summary or {}).get("total"))),
        (
            "compute_h3_metrics_from_scope_and_pois",
            compute_h3_metrics_from_scope_and_pois,
            {
                "resolution": int(arguments.get("resolution") or policy.get("h3_resolution") or 9),
                "include_mode": str(arguments.get("include_mode") or policy.get("include_mode") or "intersects"),
                "min_overlap_ratio": float(arguments.get("min_overlap_ratio") or policy.get("min_overlap_ratio") or 0.0),
                "neighbor_ring": int(arguments.get("neighbor_ring") or policy.get("neighbor_ring") or 1),
            },
            not bool(_current_summary(snapshot, local_artifacts, "h3")),
        ),
        (
            "compute_population_overview_from_scope",
            compute_population_overview_from_scope,
            {"coord_type": "gcj02"},
            not bool(_current_summary(snapshot, local_artifacts, "population")),
        ),
        (
            "compute_nightlight_overview_from_scope",
            compute_nightlight_overview_from_scope,
            {"coord_type": "gcj02", "year": arguments.get("year")},
            not bool(_current_summary(snapshot, local_artifacts, "nightlight")),
        ),
        (
            "compute_road_syntax_from_scope",
            compute_road_syntax_from_scope,
            {"mode": str(arguments.get("mode") or policy.get("mode") or "walking")},
            not bool(_current_summary(snapshot, local_artifacts, "road")),
        ),
    ]

    for tool_name, runner, child_arguments, should_run in base_steps:
        if not should_run:
            tool_statuses.append({"tool_name": tool_name, "status": "reused"})
            continue
        result = await _run_child_tool(
            runner=runner,
            tool_name=tool_name,
            arguments=child_arguments,
            snapshot=snapshot,
            artifacts=local_artifacts,
            question=question,
        )
        tool_statuses.append({"tool_name": tool_name, "status": result.status, "error": result.error or ""})
        evidence.extend(result.evidence or [])
        warnings.extend(result.warnings or [])
        if result.status == "success":
            local_artifacts.update(result.artifacts or {})

    result_summary = {
        "policy_key": policy["policy_key"],
        "policy_params": policy,
        "available_dimensions": [
            key
            for key in ("poi", "h3", "population", "nightlight", "road")
            if key == "poi"
            and bool(local_artifacts.get("current_pois") or snapshot.pois or (snapshot.poi_summary or {}).get("total"))
            or key != "poi"
            and bool(_current_summary(snapshot, local_artifacts, key))
        ],
        "tool_statuses": tool_statuses,
    }
    return ToolResult(
        tool_name="get_area_data_bundle",
        status="success",
        result=result_summary,
        evidence=evidence,
        warnings=warnings,
        artifacts={**local_artifacts, "current_area_data_bundle": result_summary},
    )


async def analyze_poi_structure(
    *,
    arguments: Dict[str, Any],
    snapshot: AnalysisSnapshot,
    artifacts: Dict[str, Any],
    question: str,
) -> ToolResult:
    del arguments, question
    poi_structure = build_poi_structure_analysis(snapshot, artifacts)
    business_profile = analyze_poi_mix(snapshot, artifacts, poi_structure=poi_structure)
    return ToolResult(
        tool_name="analyze_poi_structure",
        status="success",
        result={
            "structure_tags": list(poi_structure.get("structure_tags") or []),
            "dominant_categories": list(poi_structure.get("dominant_categories") or []),
            "business_profile": business_profile.get("business_profile"),
            "functional_mix_score": business_profile.get("functional_mix_score"),
            "summary_text": business_profile.get("summary_text") or poi_structure.get("summary_text") or "",
        },
        evidence=[
            {"field": "poi.structure.dominant_categories", "value": poi_structure.get("dominant_categories")},
            {"field": "poi.structure.business_profile", "value": business_profile.get("business_profile")},
        ],
        warnings=[] if poi_structure.get("evidence_ready") else [str(poi_structure.get("summary_text") or "POI 结构证据不足")],
        artifacts={
            "current_poi_structure_analysis": poi_structure,
            "current_business_profile": business_profile,
        },
    )


async def analyze_spatial_structure(
    *,
    arguments: Dict[str, Any],
    snapshot: AnalysisSnapshot,
    artifacts: Dict[str, Any],
    question: str,
) -> ToolResult:
    del arguments, question
    h3_structure = build_h3_structure_analysis(snapshot, artifacts)
    population_profile = build_population_profile_analysis(snapshot, artifacts)
    nightlight_pattern = build_nightlight_pattern_analysis(snapshot, artifacts)
    road_pattern = build_road_pattern_analysis(snapshot, artifacts)
    return ToolResult(
        tool_name="analyze_spatial_structure",
        status="success",
        result={
            "distribution_pattern": h3_structure.get("distribution_pattern"),
            "population_view": population_profile.get("summary_text"),
            "nightlight_view": nightlight_pattern.get("summary_text"),
            "road_view": road_pattern.get("summary_text"),
            "summary_text": (
                f"H3 为 {h3_structure.get('distribution_pattern') or 'unknown'}，"
                f"人口/夜光/路网证据已整理。"
            ),
        },
        evidence=[
            {"field": "h3.structure.distribution_pattern", "value": h3_structure.get("distribution_pattern")},
            {"field": "population.profile.top_age_band", "value": population_profile.get("top_age_band")},
            {"field": "nightlight.pattern.core_hotspot_count", "value": nightlight_pattern.get("core_hotspot_count")},
            {"field": "road.pattern.node_count", "value": road_pattern.get("node_count")},
        ],
        artifacts={
            "current_h3_structure_analysis": h3_structure,
            "current_population_profile_analysis": population_profile,
            "current_nightlight_pattern_analysis": nightlight_pattern,
            "current_road_pattern_analysis": road_pattern,
        },
    )


async def infer_area_labels(
    *,
    arguments: Dict[str, Any],
    snapshot: AnalysisSnapshot,
    artifacts: Dict[str, Any],
    question: str,
) -> ToolResult:
    del arguments, question
    poi_structure = build_poi_structure_analysis(snapshot, artifacts)
    business_profile = analyze_poi_mix(snapshot, artifacts, poi_structure=poi_structure)
    population_profile = build_population_profile_analysis(snapshot, artifacts)
    nightlight_pattern = build_nightlight_pattern_analysis(snapshot, artifacts)
    road_pattern = build_road_pattern_analysis(snapshot, artifacts)
    payload = infer_area_character_labels(
        snapshot,
        artifacts,
        poi_structure=poi_structure,
        business_profile=business_profile,
        population_profile=population_profile,
        nightlight_pattern=nightlight_pattern,
        road_pattern=road_pattern,
    )
    return ToolResult(
        tool_name="infer_area_labels",
        status="success",
        result=payload,
        evidence=[
            {"field": "area.character_tags", "value": payload.get("character_tags")},
            {"field": "area.rule_hits", "value": payload.get("rule_hits")},
        ],
        artifacts={
            "current_poi_structure_analysis": poi_structure,
            "current_business_profile": business_profile,
            "current_population_profile_analysis": population_profile,
            "current_nightlight_pattern_analysis": nightlight_pattern,
            "current_road_pattern_analysis": road_pattern,
            "current_area_character_labels": payload,
        },
    )


async def score_site_candidates_tool(
    *,
    arguments: Dict[str, Any],
    snapshot: AnalysisSnapshot,
    artifacts: Dict[str, Any],
    question: str,
) -> ToolResult:
    target_supply_gap = await analyze_target_supply_gap_from_scope(
        arguments={"place_type": str(arguments.get("place_type") or "")},
        snapshot=snapshot,
        artifacts=artifacts,
        question=question,
    )
    population_profile = build_population_profile_analysis(snapshot, artifacts)
    nightlight_pattern = build_nightlight_pattern_analysis(snapshot, artifacts)
    road_pattern = build_road_pattern_analysis(snapshot, artifacts)
    payload = score_site_candidates(
        snapshot,
        artifacts,
        target_supply_gap=target_supply_gap.result,
        population_profile=population_profile,
        nightlight_pattern=nightlight_pattern,
        road_pattern=road_pattern,
    )
    return ToolResult(
        tool_name="score_site_candidates",
        status="success",
        result=payload,
        evidence=[
            {"field": "site.ranking", "value": payload.get("ranking")},
            {"field": "site.confidence", "value": payload.get("confidence")},
        ],
        warnings=list(target_supply_gap.warnings or []),
        artifacts={
            "current_target_supply_gap": target_supply_gap.result,
            "current_site_candidate_scores": payload,
        },
    )
