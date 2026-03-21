import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from .database import SessionLocal
from .models import AnalysisHistory, PoiResult

class HistoryRepo:
    @staticmethod
    def _coerce_extracted_json_value(value: Any) -> Any:
        if value is None or isinstance(value, (dict, list, int, float)):
            return value
        text = str(value).strip()
        if not text or text.lower() == "null":
            return None
        try:
            return json.loads(text)
        except Exception:
            return value

    @staticmethod
    def _build_lightweight_list_params(row: Any) -> Dict:
        return {
            "center": HistoryRepo._coerce_extracted_json_value(getattr(row, "center", None)),
            "time_min": HistoryRepo._coerce_extracted_json_value(getattr(row, "time_min", None)),
            "keywords": HistoryRepo._coerce_extracted_json_value(getattr(row, "keywords", None)),
            "mode": HistoryRepo._coerce_extracted_json_value(getattr(row, "mode", None)),
            "source": HistoryRepo._coerce_extracted_json_value(getattr(row, "source", None)),
        }

    @staticmethod
    def _json_extract_expr(dialect_name: str, path: str):
        extracted = func.json_extract(AnalysisHistory.params, path)
        if dialect_name == "mysql":
            return func.json_unquote(extracted)
        return extracted

    @staticmethod
    def _build_list_params_from_params(raw_params: Dict) -> Dict:
        params = raw_params if isinstance(raw_params, dict) else {}
        return {
            "center": params.get("center"),
            "time_min": params.get("time_min"),
            "keywords": params.get("keywords"),
            "mode": params.get("mode"),
            "source": params.get("source"),
        }

    @staticmethod
    def _build_history_list_dedupe_key(description: str, params: Dict) -> str:
        params = params if isinstance(params, dict) else {}
        center = params.get("center")
        if isinstance(center, (list, tuple)) and len(center) >= 2:
            try:
                center_key = f"{float(center[0]):.6f},{float(center[1]):.6f}"
            except Exception:
                center_key = str(center)
        else:
            center_key = ""
        time_min = str(params.get("time_min") if params.get("time_min") is not None else "")
        mode = str(params.get("mode") or "").strip().lower()
        source = str(params.get("source") or "").strip().lower()
        keywords = str(params.get("keywords") or "").strip()
        desc_key = str(description or "").strip()
        return "||".join([center_key, time_min, mode, source, keywords, desc_key])

    @staticmethod
    def _build_history_overwrite_key(params: Dict) -> str:
        """
        Stable overwrite key for "same analysis run":
        center + time_min + mode + source + keywords.
        Do not include description, because description may contain POI count.
        """
        params = params if isinstance(params, dict) else {}
        center = params.get("center")
        if isinstance(center, (list, tuple)) and len(center) >= 2:
            try:
                center_key = f"{float(center[0]):.6f},{float(center[1]):.6f}"
            except Exception:
                center_key = str(center)
        else:
            center_key = ""
        time_min = str(params.get("time_min") if params.get("time_min") is not None else "")
        mode = str(params.get("mode") or "").strip().lower()
        source = str(params.get("source") or "").strip().lower()
        keywords = str(params.get("keywords") or "").strip()
        return "||".join([center_key, time_min, mode, source, keywords])

    def _find_same_history_ids_for_overwrite(
        self,
        session: Session,
        params: Dict,
    ) -> List[int]:
        incoming_list_params = self._build_list_params_from_params(params)
        incoming_key = self._build_history_overwrite_key(incoming_list_params)

        query = session.query(
            AnalysisHistory.id,
            AnalysisHistory.params,
        )

        rows = query.order_by(desc(AnalysisHistory.id)).all()
        matched_ids: List[int] = []
        for row in rows:
            row_list_params = self._build_list_params_from_params(row.params)
            row_key = self._build_history_overwrite_key(row_list_params)
            if row_key == incoming_key:
                matched_ids.append(int(row.id))
        return matched_ids

    @staticmethod
    def _serialize_created_at(value: datetime) -> str:
        """
        Persisted history timestamps are stored in UTC.
        Serialize as explicit UTC (with trailing Z) to avoid
        client-side local-time misinterpretation.
        """
        if not isinstance(value, datetime):
            return str(value or "")
        dt = value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")

    def _build_detail_payload(
        self,
        history: AnalysisHistory,
        *,
        pois: Optional[List[Dict]] = None,
        poi_summary: Optional[Dict] = None,
        poi_count: Optional[int] = None,
    ) -> Dict:
        payload = {
            "id": history.id,
            "description": history.description,
            "created_at": self._serialize_created_at(history.created_at),
            "params": history.params,
            "polygon": history.result_polygon,
            "poi_summary": poi_summary or {},
        }
        if poi_count is not None:
            payload["poi_count"] = int(max(0, poi_count))
        if pois is not None:
            payload["pois"] = pois
        return payload

    def create_record(self, 
                      params: Dict, 
                      polygon: List, 
                      pois: List[Dict], 
                      description: str = "") -> int:
        """
        Create a new history record with associated POIs.
        """
        session: Session = SessionLocal()
        try:
            # Physical overwrite: delete old records with the same history key first.
            same_ids = self._find_same_history_ids_for_overwrite(session, params)
            if same_ids:
                session.query(PoiResult).filter(PoiResult.history_id.in_(same_ids)).delete(synchronize_session=False)
                session.query(AnalysisHistory).filter(AnalysisHistory.id.in_(same_ids)).delete(synchronize_session=False)

            # 1. Create History
            history = AnalysisHistory(
                params=params,
                result_polygon=polygon,
                description=description,
                created_at=datetime.utcnow()
            )
            session.add(history)
            session.flush() # Get ID
            
            # 2. Create POI Result if exists
            if pois:
                # Calculate summary
                # Assuming pois have 'type' or we count total
                summary = {"total": len(pois)}
                
                poi_res = PoiResult(
                    history_id=history.id,
                    poi_data=pois,
                    summary=summary
                )
                session.add(poi_res)
            
            session.commit()
            return history.id
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def get_list(self, limit: int = 0) -> List[Dict]:
        """
        Get latest history records (metadata only).
        If limit <= 0, return all records.
        """
        session: Session = SessionLocal()
        try:
            bind = session.get_bind()
            dialect_name = bind.dialect.name if bind is not None else ""
            # Keep history list query lightweight:
            # - select only list fields needed by sidebar
            # - avoid fetching large h3/road snapshots embedded in params JSON
            # - order by PK (indexed) to avoid extra sort cost
            if dialect_name in {"mysql", "sqlite"}:
                query = (
                    session.query(
                        AnalysisHistory.id,
                        AnalysisHistory.description,
                        AnalysisHistory.created_at,
                        self._json_extract_expr(dialect_name, "$.center").label("center"),
                        self._json_extract_expr(dialect_name, "$.time_min").label("time_min"),
                        self._json_extract_expr(dialect_name, "$.keywords").label("keywords"),
                        self._json_extract_expr(dialect_name, "$.mode").label("mode"),
                        self._json_extract_expr(dialect_name, "$.source").label("source"),
                    )
                    .order_by(desc(AnalysisHistory.id))
                )
                build_list_params = self._build_lightweight_list_params
            else:
                query = (
                    session.query(
                        AnalysisHistory.id,
                        AnalysisHistory.description,
                        AnalysisHistory.created_at,
                        AnalysisHistory.params,
                    )
                    .order_by(desc(AnalysisHistory.id))
                )
                build_list_params = lambda row: self._build_list_params_from_params(row.params)
            if isinstance(limit, int) and limit > 0:
                query = query.limit(limit)
            records = query.all()
            
            result = []
            seen_keys = set()
            for r in records:
                list_params = build_list_params(r)
                dedupe_key = self._build_history_list_dedupe_key(r.description, list_params)
                if dedupe_key in seen_keys:
                    continue
                seen_keys.add(dedupe_key)
                result.append({
                    "id": r.id,
                    "description": r.description,
                    "created_at": self._serialize_created_at(r.created_at),
                    "params": list_params
                })
            return result
        finally:
            session.close()

    def get_detail(self, history_id: int, include_pois: bool = True) -> Optional[Dict]:
        """
        Get full details including POIs.
        """
        session: Session = SessionLocal()
        try:
            history = session.query(AnalysisHistory).filter_by(id=history_id).first()
            if not history:
                return None

            if include_pois:
                poi_res = session.query(PoiResult).filter_by(history_id=history_id).first()
                pois = poi_res.poi_data if poi_res else []
                poi_summary = poi_res.summary if poi_res else {}
                poi_count = len(pois) if isinstance(pois, list) else 0
                return self._build_detail_payload(
                    history,
                    pois=pois if isinstance(pois, list) else [],
                    poi_summary=poi_summary if isinstance(poi_summary, dict) else {},
                    poi_count=poi_count,
                )

            poi_row = session.query(PoiResult.summary).filter_by(history_id=history_id).first()
            poi_summary = poi_row[0] if poi_row and isinstance(poi_row[0], dict) else {}
            poi_count = int(poi_summary.get("total") or 0) if isinstance(poi_summary, dict) else 0
            return self._build_detail_payload(
                history,
                poi_summary=poi_summary if isinstance(poi_summary, dict) else {},
                poi_count=poi_count,
            )
        finally:
            session.close()

    def get_pois(self, history_id: int) -> Optional[Dict]:
        session: Session = SessionLocal()
        try:
            history_exists = session.query(AnalysisHistory.id).filter_by(id=history_id).first()
            if not history_exists:
                return None

            poi_res = session.query(PoiResult).filter_by(history_id=history_id).first()
            pois = poi_res.poi_data if poi_res and isinstance(poi_res.poi_data, list) else []
            poi_summary = poi_res.summary if poi_res and isinstance(poi_res.summary, dict) else {}
            return {
                "history_id": history_id,
                "pois": pois,
                "poi_summary": poi_summary,
                "count": len(pois),
            }
        finally:
            session.close()

    def delete_record(self, history_id: int) -> bool:
        """
        Delete a record. Cascades to PoiResult if configured in DB, 
        otherwise ORM handles it if relationship defined (I defined FK ondelete but not relationship obj).
        SQLAlchemy requires relationship() for cascade usually, or DB schema support.
        Since I'm using SQLite, ensuring foreign key support is enabled is key, 
        but explicit delete is safer given simple `models.py`.
        """
        session: Session = SessionLocal()
        try:
            # Delete POI Results first manually to be safe
            session.query(PoiResult).filter_by(history_id=history_id).delete()
            
            # Delete History
            rows = session.query(AnalysisHistory).filter_by(id=history_id).delete()
            session.commit()
            return rows > 0
        except Exception:
            session.rollback()
            return False
        finally:
            session.close()

history_repo = HistoryRepo()
