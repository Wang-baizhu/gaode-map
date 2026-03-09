from datetime import datetime, timezone
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .database import SessionLocal
from .models import AnalysisHistory, PoiResult

class HistoryRepo:
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

    def get_list(self, limit: int = 20) -> List[Dict]:
        """
        Get latest history records (metadata only).
        """
        session: Session = SessionLocal()
        try:
            records = session.query(AnalysisHistory)\
                .order_by(desc(AnalysisHistory.created_at))\
                .limit(limit)\
                .all()
            
            result = []
            for r in records:
                result.append({
                    "id": r.id,
                    "description": r.description,
                    "created_at": self._serialize_created_at(r.created_at),
                    "params": r.params
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
