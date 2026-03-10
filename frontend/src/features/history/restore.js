    function createAnalysisHistoryInitialState() {
        return {
            historyDetailAbortController: null,
            historyDetailLoadToken: 0,
        };
    }

    function createAnalysisHistoryMethods() {
        return {
            _applyHistoryDetailBaseResult(data) {
                this.clearH3Grid();
                this.clearPoiOverlayLayers({
                    reason: 'load_history_detail',
                    clearManager: true,
                    clearSimpleMarkers: true,
                    clearCenterMarker: true,
                    resetFilterPanel: true
                });
                this.clearScopeOutlineDisplay();
                this.drawnScopePolygon = [];
                this.resetRoadSyntaxState();
                this.allPoisDetails = [];

                if (data.params && data.params.center) {
                    this.selectedPoint = { lng: data.params.center[0], lat: data.params.center[1] };
                    this.mapCore.map.setCenter(data.params.center);
                    this.mapCore.center = { lng: data.params.center[0], lat: data.params.center[1] };
                    this.mapCore.setRadius(0);
                    if (data.params.time_min) this.timeHorizon = data.params.time_min;
                    if (data.params.mode) this.transportMode = data.params.mode;
                }
                this.resultDataSource = this.normalizePoiSource(
                    data && data.params ? data.params.source : '',
                    'unknown'
                );
                const historyDrawnPolygon = this._closePolygonRing(this.normalizePath(
                    data && data.params ? data.params.drawn_polygon : [],
                    3,
                    'history.detail.drawn_polygon'
                ));
                const hasHistoryDrawnPolygon = Array.isArray(historyDrawnPolygon) && historyDrawnPolygon.length >= 4;
                this.drawnScopePolygon = hasHistoryDrawnPolygon ? historyDrawnPolygon.slice() : [];
                this.isochroneScopeMode = hasHistoryDrawnPolygon ? 'area' : 'point';

                if (data.polygon) {
                    const historyRings = this._normalizePolygonPayloadRings(
                        data.polygon,
                        'history.detail.polygon'
                    );
                    this.scopeSource = historyRings.length ? 'history' : '';
                    if (historyRings.length === 1) {
                        this.lastIsochroneGeoJSON = {
                            type: 'Feature',
                            properties: { mode: 'history' },
                            geometry: { type: 'Polygon', coordinates: [historyRings[0]] },
                        };
                    } else if (historyRings.length > 1) {
                        this.lastIsochroneGeoJSON = {
                            type: 'Feature',
                            properties: { mode: 'history' },
                            geometry: { type: 'MultiPolygon', coordinates: historyRings.map((ring) => [ring]) },
                        };
                    } else {
                        this.lastIsochroneGeoJSON = null;
                    }
                } else {
                    this.scopeSource = '';
                    this.lastIsochroneGeoJSON = null;
                }
                this.applySimplifyConfig();

                this.step = 3;
                this.sidebarView = 'wizard';
                this.activeStep3Panel = 'poi';
            },
            async _restoreHistoryPoisAsync(id, token, signal, poiCountHint = 0) {
                const res = await fetch(`/api/v1/analysis/history/${id}/pois`, { signal });
                if (!res.ok) {
                    throw new Error(`历史 POI 请求失败(${res.status})`);
                }
                const data = await res.json();
                if (token !== this.historyDetailLoadToken) return;

                const pois = Array.isArray(data && data.pois) ? data.pois : [];
                this.allPoisDetails = pois;

                if (!pois.length) {
                    this.poiStatus = poiCountHint > 0
                        ? `历史主结果已恢复，但未取到 POI 明细（期望 ${poiCountHint} 条）`
                        : '该历史无 POI 数据';
                    return;
                }

                this.rebuildPoiRuntimeSystem(pois);
                if (token !== this.historyDetailLoadToken) return;
                this.recomputePoiKdeStats();
                this.poiStatus = '';
                this.applySimplifyConfig();
                setTimeout(() => this.resizePoiChart(), 0);
            },
            async loadHistoryDetail(id) {
                const historyId = Number(id || 0);
                if (!Number.isFinite(historyId) || historyId <= 0) return;
                let controller = null;
                let baseRestored = false;
                try {
                    this.cancelHistoryLoading();
                    this.cancelHistoryDetailLoading();
                    this.stopScopeDrawing();
                    this.clearIsochroneDebugState();
                    this.errorMessage = '';
                    if (!this.mapCore || !this.mapCore.map) {
                        this.errorMessage = '地图尚未初始化，请稍后重试';
                        return;
                    }

                    controller = new AbortController();
                    const token = this.historyDetailLoadToken + 1;
                    this.historyDetailLoadToken = token;
                    this.historyDetailAbortController = controller;

                    const res = await fetch(`/api/v1/analysis/history/${historyId}?include_pois=false`, {
                        signal: controller.signal
                    });
                    if (!res.ok) {
                        throw new Error(`历史详情请求失败(${res.status})`);
                    }
                    const data = await res.json();
                    if (!data || token !== this.historyDetailLoadToken) return;

                    this._applyHistoryDetailBaseResult(data);
                    baseRestored = true;
                    const poiCountHint = Math.max(
                        0,
                        Number((data && data.poi_count) || (((data || {}).poi_summary || {}).total) || 0)
                    );
                    this.poiStatus = poiCountHint > 0
                        ? `历史主结果已恢复，正在加载历史 POI（${poiCountHint} 条）...`
                        : '历史主结果已恢复，正在检查 POI 数据...';
                    await this.$nextTick();
                    await new Promise((resolve) => window.requestAnimationFrame(resolve));
                    await this._restoreHistoryPoisAsync(historyId, token, controller.signal, poiCountHint);

                } catch (e) {
                    if (e && e.name === 'AbortError') return;
                    console.error(e);
                    if (baseRestored && this.step === 3 && this.lastIsochroneGeoJSON) {
                        this.poiStatus = '历史主结果已恢复，但 POI 恢复失败，可稍后重试';
                    } else {
                        this.errorMessage = `加载历史失败: ${(e && e.message) || e}`;
                    }
                } finally {
                    if (controller && this.historyDetailAbortController === controller) {
                        this.historyDetailAbortController = null;
                    }
                }
            },
            formatHistoryTitle(desc) {
                if (!desc) return '无标题分析';
                return desc.replace(/^\d+min Analysis - /, '');
            },
        };
    }

export { createAnalysisHistoryInitialState, createAnalysisHistoryMethods };
