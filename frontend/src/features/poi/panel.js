    function createEmptyPoiKdeStats() {
        return {
            visiblePointCount: 0,
            maxIntensity: 6,
            topCategoryRows: [],
            chartRows: [],
        };
    }

    function createAnalysisPoiInitialState() {
        return {
            poiMarkers: [],
            allPoisDetails: [],
            poiChart: null,
            poiChartResizeHandler: null,
            poiSubTab: 'category',
            poiAnalysisSubTab: 'kde',
            poiKdeEnabled: false,
            poiKdeRadius: 28,
            poiKdeStats: createEmptyPoiKdeStats(),
        };
    }

    function createAnalysisPoiPanelMethods() {
        return {
            createEmptyPoiKdeStats,
            initPoiChart() {
                const el = document.getElementById('poiChart');
                if (!el || !window.echarts || el.clientWidth === 0) return null;

                let chart = echarts.getInstanceByDom(el);
                if (!chart) {
                    chart = echarts.init(el);
                    if (!this.poiChartResizeHandler) {
                        this.poiChartResizeHandler = () => this.resizePoiChart();
                        window.addEventListener('resize', this.poiChartResizeHandler);
                    }
                }
                this.poiChart = chart;
                return chart;
            },
            resizePoiChart() {
                if (this.poiChart) this.poiChart.resize();
            },
            disposePoiChart() {
                if (this.poiChart) {
                    this.poiChart.dispose();
                    this.poiChart = null;
                }
                if (this.poiChartResizeHandler) {
                    window.removeEventListener('resize', this.poiChartResizeHandler);
                    this.poiChartResizeHandler = null;
                }
            },
            setPoiSubTab(tab) {
                const nextTab = String(tab || '').trim().toLowerCase() === 'analysis' ? 'analysis' : 'category';
                if (this.poiSubTab === nextTab && this.poiKdeEnabled === (nextTab === 'analysis')) {
                    return;
                }
                this.poiSubTab = nextTab;
                if (nextTab === 'analysis' && !['kde', 'stats'].includes(String(this.poiAnalysisSubTab || ''))) {
                    this.poiAnalysisSubTab = 'kde';
                }
                this.poiKdeEnabled = nextTab === 'analysis';
                this.applySimplifyPointVisibility();
                this.$nextTick(() => {
                    if (nextTab === 'category') {
                        this.updatePoiCharts();
                        setTimeout(() => this.resizePoiChart(), 0);
                    } else {
                        this.recomputePoiKdeStats();
                    }
                    this.refreshPoiKdeOverlay();
                });
            },
            setPoiAnalysisSubTab(tab) {
                const nextTab = String(tab || '').trim().toLowerCase() === 'stats' ? 'stats' : 'kde';
                if (this.poiAnalysisSubTab === nextTab) {
                    return;
                }
                this.poiAnalysisSubTab = nextTab;
                if (this.poiSubTab === 'analysis') {
                    this.$nextTick(() => {
                        this.recomputePoiKdeStats();
                        if (nextTab === 'kde') {
                            this.refreshPoiKdeOverlay();
                        }
                    });
                }
            },
            shouldShowPoiPanelStatus() {
                const text = String(this.poiStatus || '').trim();
                if (!text) return false;
                if (text.indexOf('已加载历史:') === 0) return false;
                return true;
            },
            getPoiPanelStatusText() {
                const text = String(this.poiStatus || '').trim();
                if (!text) return '';
                if (text.indexOf('已加载历史:') === 0) return '';
                return text;
            },
            isHistoryPoiRestoring() {
                const text = String(this.poiStatus || '');
                return !!this.historyDetailAbortController && text.indexOf('正在加载历史 POI') >= 0;
            },
            clearPoiKdeOverlay() {
                if (!this.mapCore || typeof this.mapCore.clearPoiHeatmap !== 'function') return;
                this.mapCore.clearPoiHeatmap();
            },
            _getPoiKdeSourcePoints() {
                if (this.markerManager && typeof this.markerManager.getVisiblePointsData === 'function') {
                    return this.markerManager.getVisiblePointsData(1);
                }
                const source = Array.isArray(this.allPoisDetails) ? this.allPoisDetails : [];
                return source.map((poi) => {
                    const loc = this.normalizeLngLat(poi && poi.location, 'poi.kde.location');
                    if (!loc) return null;
                    return { lng: Number(loc[0]), lat: Number(loc[1]), count: 1 };
                }).filter((item) => !!item);
            },
            _getPoiKdeStatsSourcePois() {
                if (Array.isArray(this.allPoisDetails) && this.allPoisDetails.length) {
                    return this.allPoisDetails;
                }
                return (this.markerManager && typeof this.markerManager.getVisiblePoints === 'function')
                    ? this.markerManager.getVisiblePoints()
                    : [];
            },
            _buildPoiKdeTopCategoryRows(limit = 5) {
                const stats = this.computePoiStats(this._getPoiKdeStatsSourcePois());
                const rows = (stats.labels || []).map((label, index) => ({
                    id: String((this.poiCategories[index] && this.poiCategories[index].id) || `poi-kde-${index}`),
                    label: String(label || `分类${index + 1}`),
                    color: (stats.colors && stats.colors[index]) || '#94a3b8',
                    value: Number((stats.values && stats.values[index]) || 0),
                })).filter((item) => item.value > 0)
                    .sort((a, b) => b.value - a.value);
                const safeLimit = Number(limit);
                const limitedRows = Number.isFinite(safeLimit) && safeLimit > 0
                    ? rows.slice(0, Math.max(1, safeLimit))
                    : rows;
                const maxValue = limitedRows.reduce((max, item) => Math.max(max, Number(item.value) || 0), 0);
                return limitedRows.map((item) => Object.assign({}, item, {
                    ratio: maxValue > 0 ? Math.max(10, Math.round((Number(item.value) || 0) / maxValue * 100)) : 0,
                }));
            },
            _buildPoiKdeChartRows(rows) {
                const sourceRows = Array.isArray(rows) ? rows : [];
                const maxValue = sourceRows.reduce((max, item) => Math.max(max, Number(item.value) || 0), 0);
                return sourceRows.map((item) => {
                    const label = String(item.label || '');
                    return Object.assign({}, item, {
                        height: maxValue > 0 ? Math.max(16, Math.round((Number(item.value) || 0) / maxValue * 100)) : 0,
                        shortLabel: label.length > 4 ? `${label.slice(0, 4)}...` : label,
                    });
                });
            },
            recomputePoiKdeStats() {
                const visiblePointCount = this._getPoiKdeSourcePoints().length;
                const maxIntensity = Math.max(6, Math.ceil(visiblePointCount / 40));
                const rankedRows = this._buildPoiKdeTopCategoryRows(0);
                const topCategoryRows = rankedRows.slice(0, 5);
                const chartRows = this._buildPoiKdeChartRows(rankedRows);
                this.poiKdeStats = {
                    visiblePointCount,
                    maxIntensity,
                    topCategoryRows,
                    chartRows,
                };
                return this.poiKdeStats;
            },
            async refreshPoiKdeOverlay() {
                if (!this.mapCore || typeof this.mapCore.renderPoiHeatmap !== 'function') return;
                if (!this.poiKdeEnabled || (typeof this.shouldShowPoiKdeOnCurrentPanel === 'function' && !this.shouldShowPoiKdeOnCurrentPanel())) {
                    this.clearPoiKdeOverlay();
                    return;
                }
                const points = this._getPoiKdeSourcePoints();
                const stats = this.recomputePoiKdeStats();
                if (!points.length) {
                    this.clearPoiKdeOverlay();
                    return;
                }
                const max = Math.max(6, Number((stats && stats.maxIntensity) || 0));
                await this.mapCore.renderPoiHeatmap(points, {
                    radius: this.poiKdeRadius,
                    max: max,
                    opacity: 0.7
                });
            },
        };
    }

export { createEmptyPoiKdeStats, createAnalysisPoiInitialState, createAnalysisPoiPanelMethods };
