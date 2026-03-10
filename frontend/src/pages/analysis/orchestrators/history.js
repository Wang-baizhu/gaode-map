function createAnalysisHistoryOrchestratorMethods() {
  return {
    cancelHistoryDetailLoading() {
      if (this.historyDetailAbortController) {
        try {
          this.historyDetailAbortController.abort()
        } catch (e) {
          console.warn('history detail abort failed', e)
        }
        this.historyDetailAbortController = null
      }
      this.historyDetailLoadToken += 1
    },
    saveAnalysisHistoryAsync(polygon, selectedCats, pois) {
      if (!this.selectedPoint || !Array.isArray(pois) || pois.length === 0) return
      const typesLabel = (selectedCats || []).map((c) => c.name).join(',')
      const drawnPolygonForSave = (
        this.isochroneScopeMode === 'area'
        && Array.isArray(this.drawnScopePolygon)
        && this.drawnScopePolygon.length >= 3
      )
        ? this._closePolygonRing(this.normalizePath(this.drawnScopePolygon, 3, 'history.drawn_polygon'))
        : null
      const compactPois = pois.map((p) => ({
        id: p && p.id ? String(p.id) : '',
        name: p && p.name ? String(p.name) : '未命名',
        location: Array.isArray(p && p.location) ? [p.location[0], p.location[1]] : null,
        address: p && p.address ? String(p.address) : '',
        type: p && p.type ? String(p.type) : '',
        adname: p && p.adname ? String(p.adname) : '',
        lines: Array.isArray(p && p.lines) ? p.lines : [],
      })).filter((p) => Array.isArray(p.location) && p.location.length === 2)
      const payload = {
        center: [this.selectedPoint.lng, this.selectedPoint.lat],
        polygon: this.getIsochronePolygonPayload(),
        drawn_polygon: Array.isArray(drawnPolygonForSave) && drawnPolygonForSave.length >= 4
          ? drawnPolygonForSave
          : null,
        pois: compactPois,
        keywords: typesLabel,
        location_name: this.selectedPoint.lng.toFixed(4) + ',' + this.selectedPoint.lat.toFixed(4),
        mode: this.transportMode,
        time_min: parseInt(this.timeHorizon),
        source: this.normalizePoiSource(this.resultDataSource || this.poiDataSource, 'local'),
      }
      setTimeout(() => {
        fetch('/api/v1/analysis/history/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then(async (res) => {
            if (!res.ok) {
              let detail = ''
              try {
                detail = (await res.text()) || ''
              } catch (_) {}
              throw new Error(`HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
            }
            return res.json().catch(() => ({}))
          })
          .then(() => {})
          .catch((err) => {
            console.warn('Failed to save history', err)
            this.poiStatus = `抓取完成，但历史保存失败：${err && err.message ? err.message : String(err)}`
          })
      }, 0)
    },
  }
}

export { createAnalysisHistoryOrchestratorMethods }
