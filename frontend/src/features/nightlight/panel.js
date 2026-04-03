function createNightlightFallbackMeta() {
  return {
    available_years: [
      { year: 2025, label: '2025 年' },
    ],
    default_year: 2025,
  }
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function createAnalysisNightlightInitialState() {
  const meta = createNightlightFallbackMeta()
  return {
    isComputingNightlight: false,
    isLoadingNightlightMeta: false,
    isLoadingNightlightGrid: false,
    nightlightStatus: '',
    nightlightScopeId: '',
    nightlightMeta: meta,
    nightlightMetaLoaded: false,
    nightlightSelectedYear: Number(meta.default_year || 2025),
    nightlightOverview: null,
    nightlightGrid: null,
    nightlightGridCount: 0,
    nightlightLayer: null,
    nightlightRaster: null,
  }
}

function createAnalysisNightlightMethods() {
  return {
    createNightlightFallbackMeta,
    isNightlightPanelActive() {
      return this.step === 2 && this.activeStep3Panel === 'nightlight'
    },
    isNightlightDisplayActive() {
      return this.step === 2
        && (typeof this.hasSimplifyDisplayTarget === 'function'
          ? this.hasSimplifyDisplayTarget('nightlight')
          : this.isNightlightPanelActive())
    },
    formatNightlightValue(value, digits = 2) {
      const num = toNumber(value, 0)
      if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
      return num.toFixed(digits)
    },
    formatNightlightPercent(value) {
      return `${(toNumber(value, 0) * 100).toFixed(1)}%`
    },
    getNightlightYearOptions() {
      return Array.isArray(this.nightlightMeta && this.nightlightMeta.available_years)
        ? this.nightlightMeta.available_years
        : []
    },
    getNightlightSelectedYearLabel() {
      const year = Number(this.nightlightSelectedYear || 0)
      const option = this.getNightlightYearOptions().find((item) => Number(item && item.year) === year)
      return String((option && option.label) || (year > 0 ? `${year} 年` : '-'))
    },
    async loadNightlightMeta(force = false) {
      if ((this.nightlightMetaLoaded && !force) || this.isLoadingNightlightMeta) return this.nightlightMeta
      this.isLoadingNightlightMeta = true
      try {
        const res = await fetch('/api/v1/analysis/nightlight/meta')
        if (!res.ok) {
          throw new Error(`/api/v1/analysis/nightlight/meta 请求失败(${res.status})`)
        }
        const data = await res.json()
        const years = Array.isArray(data.available_years)
          ? data.available_years
            .map((item) => ({
              year: Number(item && item.year),
              label: String((item && item.label) || `${item && item.year} 年`),
            }))
            .filter((item) => Number.isFinite(item.year) && item.year > 0)
          : []
        const defaultYear = Number(data.default_year || (years[years.length - 1] && years[years.length - 1].year) || 2025)
        this.nightlightMeta = {
          available_years: years.length ? years : createNightlightFallbackMeta().available_years,
          default_year: defaultYear,
        }
        this.nightlightMetaLoaded = true
        if (!Number.isFinite(Number(this.nightlightSelectedYear)) || !years.some((item) => item.year === Number(this.nightlightSelectedYear))) {
          this.nightlightSelectedYear = defaultYear
        }
        return this.nightlightMeta
      } catch (e) {
        console.error(e)
        this.nightlightMeta = createNightlightFallbackMeta()
        this.nightlightMetaLoaded = false
        this.nightlightSelectedYear = Number(this.nightlightMeta.default_year || 2025)
        throw e
      } finally {
        this.isLoadingNightlightMeta = false
      }
    },
    resetNightlightAnalysisState(options = {}) {
      const keepMeta = !!(options && options.keepMeta)
      const keepYear = !!(options && options.keepYear)
      this.isComputingNightlight = false
      this.isLoadingNightlightGrid = false
      this.nightlightStatus = ''
      this.nightlightScopeId = ''
      this.nightlightOverview = null
      this.nightlightGrid = null
      this.nightlightGridCount = 0
      this.nightlightLayer = null
      this.nightlightRaster = null
      if (!keepMeta) {
        this.nightlightMeta = createNightlightFallbackMeta()
        this.nightlightMetaLoaded = false
      }
      if (!keepYear) {
        this.nightlightSelectedYear = Number((this.nightlightMeta && this.nightlightMeta.default_year) || 2025)
      }
      this.clearNightlightDisplayOnLeave()
    },
    clearNightlightDisplayOnLeave() {
      if (this.mapCore && typeof this.mapCore.clearGridPolygons === 'function') {
        this.mapCore.clearGridPolygons()
      }
      if (this.mapCore && typeof this.mapCore.clearPopulationRasterOverlay === 'function') {
        this.mapCore.clearPopulationRasterOverlay()
      }
    },
    buildNightlightStyledFeatures() {
      const baseFeatures = ((this.nightlightGrid && this.nightlightGrid.features) || [])
      const cellMap = new Map(
        (((this.nightlightLayer && this.nightlightLayer.cells) || []).map((cell) => [String((cell && cell.cell_id) || ''), cell]))
      )
      return baseFeatures.map((feature) => {
        const props = Object.assign({}, (feature && feature.properties) || {})
        const cell = cellMap.get(String(props.cell_id || ''))
        return {
          type: 'Feature',
          geometry: feature.geometry,
          properties: Object.assign({}, props, cell ? {
            fillColor: String(cell.fill_color || '#0f172a'),
            fillOpacity: toNumber(cell.fill_opacity, 0.28),
            strokeColor: String(cell.stroke_color || '#94a3b8'),
            strokeWeight: 0.8,
          } : {
            fillColor: '#090b1f',
            fillOpacity: 0.28,
            strokeColor: '#94a3b8',
            strokeWeight: 0.8,
          }),
        }
      })
    },
    applyNightlightGridToMap() {
      if (!this.mapCore) return
      if (typeof this.mapCore.clearPopulationRasterOverlay === 'function') {
        this.mapCore.clearPopulationRasterOverlay()
      }
      const features = this.buildNightlightStyledFeatures()
      if (!features.length) {
        if (typeof this.mapCore.clearGridPolygons === 'function') {
          this.mapCore.clearGridPolygons()
        }
        return
      }
      if (typeof this.mapCore.setGridFeatures === 'function') {
        this.mapCore.setGridFeatures(features, {
          strokeColor: '#94a3b8',
          strokeWeight: 0.8,
          fillColor: '#090b1f',
          fillOpacity: 0.28,
          clickable: false,
          webglBatch: true,
        })
      }
    },
    restoreNightlightDisplayOnEnter() {
      if (!this.isNightlightDisplayActive()) return
      this.applyNightlightGridToMap()
    },
    async ensureNightlightBaseGrid(force = false) {
      const rawRing = this.getIsochronePolygonRing()
      if (!rawRing || this.isLoadingNightlightGrid) return this.nightlightGrid
      if (this.nightlightGrid && !force) return this.nightlightGrid
      this.isLoadingNightlightGrid = true
      try {
        const polygon = this.getIsochronePolygonPayload()
        const res = await fetch('/api/v1/analysis/nightlight/grid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            polygon,
            coord_type: 'gcj02',
            year: Number(this.nightlightSelectedYear || 0) || null,
          }),
        })
        if (!res.ok) {
          let detail = ''
          try {
            detail = await res.text()
          } catch (_) {}
          throw new Error(detail || '夜光格子生成失败')
        }
        const data = await res.json()
        this.nightlightGrid = data
        this.nightlightGridCount = Number.isFinite(Number(data.cell_count))
          ? Number(data.cell_count)
          : ((((data && data.features) || []).length))
        this.nightlightScopeId = String(data.scope_id || '')
        if (this.isNightlightDisplayActive()) {
          this.applyNightlightGridToMap()
        }
        return data
      } finally {
        this.isLoadingNightlightGrid = false
      }
    },
    async fetchNightlightOverview() {
      const polygon = this.getIsochronePolygonPayload()
      const res = await fetch('/api/v1/analysis/nightlight/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon,
          coord_type: 'gcj02',
          year: Number(this.nightlightSelectedYear || 0) || null,
        }),
      })
      if (!res.ok) {
        let detail = ''
        try {
          detail = await res.text()
        } catch (_) {}
        throw new Error(detail || '夜光总览生成失败')
      }
      const data = await res.json()
      this.nightlightOverview = data
      this.nightlightScopeId = String(data.scope_id || this.nightlightScopeId || '')
      return data
    },
    async fetchNightlightLayer() {
      const polygon = this.getIsochronePolygonPayload()
      const res = await fetch('/api/v1/analysis/nightlight/layer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon,
          coord_type: 'gcj02',
          year: Number(this.nightlightSelectedYear || 0) || null,
          scope_id: this.nightlightScopeId || null,
          view: 'radiance',
        }),
      })
      if (!res.ok) {
        let detail = ''
        try {
          detail = await res.text()
        } catch (_) {}
        throw new Error(detail || '夜光图层生成失败')
      }
      const data = await res.json()
      this.nightlightLayer = data
      this.nightlightScopeId = String(data.scope_id || this.nightlightScopeId || '')
      return data
    },
    async fetchNightlightRaster() {
      const polygon = this.getIsochronePolygonPayload()
      const res = await fetch('/api/v1/analysis/nightlight/raster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon,
          coord_type: 'gcj02',
          year: Number(this.nightlightSelectedYear || 0) || null,
          scope_id: this.nightlightScopeId || null,
        }),
      })
      if (!res.ok) {
        let detail = ''
        try {
          detail = await res.text()
        } catch (_) {}
        throw new Error(detail || '夜光栅格预览生成失败')
      }
      const data = await res.json()
      this.nightlightRaster = data
      this.nightlightScopeId = String(data.scope_id || this.nightlightScopeId || '')
      return data
    },
    async computeNightlightAnalysis() {
      const rawRing = this.getIsochronePolygonRing()
      if (!rawRing || this.isComputingNightlight) return
      this.isComputingNightlight = true
      this.nightlightStatus = '正在计算夜光分析...'
      try {
        await this.ensureNightlightBaseGrid(false)
        await this.fetchNightlightOverview()
        await this.fetchNightlightLayer()
        await this.fetchNightlightRaster()
        this.nightlightStatus = `夜光分析完成：${this.getNightlightSelectedYearLabel()}`
        if (this.isNightlightDisplayActive()) {
          this.applyNightlightGridToMap()
        }
      } catch (e) {
        console.error(e)
        this.nightlightStatus = '夜光分析失败: ' + (e && e.message ? e.message : String(e))
      } finally {
        this.isComputingNightlight = false
      }
    },
    async ensureNightlightPanelEntryState() {
      const rawRing = this.getIsochronePolygonRing()
      if (!rawRing) {
        this.nightlightStatus = ''
        this.restoreNightlightDisplayOnEnter()
        return
      }
      try {
        await this.loadNightlightMeta(false)
        await this.ensureNightlightBaseGrid(false)
      } catch (e) {
        this.nightlightStatus = '夜光格子加载失败: ' + (e && e.message ? e.message : String(e))
        this.restoreNightlightDisplayOnEnter()
        return
      }
      if (!this.nightlightOverview || !this.nightlightLayer || !this.nightlightRaster) {
        await this.computeNightlightAnalysis()
        return
      }
      this.nightlightStatus = this.nightlightStatus || `夜光分析完成：${this.getNightlightSelectedYearLabel()}`
      this.restoreNightlightDisplayOnEnter()
    },
    async onNightlightYearChange() {
      const year = Number(this.nightlightSelectedYear || 0)
      const options = this.getNightlightYearOptions()
      if (!options.some((item) => Number(item.year) === year)) {
        this.nightlightSelectedYear = Number((this.nightlightMeta && this.nightlightMeta.default_year) || 2025)
      }
      this.nightlightOverview = null
      this.nightlightGrid = null
      this.nightlightGridCount = 0
      this.nightlightLayer = null
      this.nightlightRaster = null
      this.nightlightScopeId = ''
      await this.ensureNightlightPanelEntryState()
    },
    getNightlightSummaryRows() {
      const summary = (this.nightlightOverview && this.nightlightOverview.summary)
        || (this.nightlightLayer && this.nightlightLayer.summary)
        || {}
      return [
        { key: 'total_radiance', label: '总辐亮', value: this.formatNightlightValue(summary.total_radiance, 1) },
        { key: 'mean_radiance', label: '平均辐亮', value: this.formatNightlightValue(summary.mean_radiance, 2) },
        { key: 'p90_radiance', label: 'P90 辐亮', value: this.formatNightlightValue(summary.p90_radiance, 2) },
        { key: 'lit_pixel_ratio', label: '点亮占比', value: this.formatNightlightPercent(summary.lit_pixel_ratio) },
      ]
    },
    getNightlightLegendGradientStyle() {
      const stops = (((this.nightlightLayer && this.nightlightLayer.legend && this.nightlightLayer.legend.stops) || [])
        .map((item) => {
          const ratio = Math.max(0, Math.min(1, toNumber(item && item.ratio, 0)))
          return `${String(item && item.color || '#0f172a')} ${Math.round(ratio * 100)}%`
        }))
      return {
        background: `linear-gradient(90deg, ${stops.length ? stops.join(', ') : '#0f172a 0%, #fde047 100%'})`,
      }
    },
  }
}

export {
  createAnalysisNightlightInitialState,
  createAnalysisNightlightMethods,
}
