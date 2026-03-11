    const STEP3_PANEL_IDS = Object.freeze({
        POI: 'poi',
        H3: 'h3',
        H3_SETTINGS: 'h3_settings',
        SYNTAX: 'syntax',
    });

    function createAnalysisWorkbenchMethods() {
        return {
            normalizeStep3PanelId(panelId = '') {
                const panel = String(panelId || '');
                if (panel === STEP3_PANEL_IDS.H3_SETTINGS) return STEP3_PANEL_IDS.H3;
                return panel;
            },
            shouldShowPoiOnCurrentPanel() {
                const panel = String(this.activeStep3Panel || '');
                return panel === STEP3_PANEL_IDS.POI
                    && !this.poiSystemSuspendedForSyntax
                    && String(this.poiSubTab || 'category') !== 'analysis';
            },
            shouldShowPoiKdeOnCurrentPanel() {
                const panel = String(this.activeStep3Panel || '');
                return panel === STEP3_PANEL_IDS.POI
                    && !this.poiSystemSuspendedForSyntax
                    && String(this.poiSubTab || '') === 'analysis'
                    && !!this.poiKdeEnabled;
            },
            applyPoiFilterPanel(reason = '') {
                const panel = this.filterPanel;
                if (!panel || typeof panel.applyFilters !== 'function') {
                    return Promise.resolve({
                        ok: false,
                        skipped: true,
                        reason: 'filter_panel_unavailable:' + String(reason || ''),
                    });
                }
                try {
                    const maybePromise = panel.applyFilters();
                    if (maybePromise && typeof maybePromise.then === 'function') {
                        return maybePromise;
                    }
                    return Promise.resolve({
                        ok: true,
                        reason: 'filter_panel_sync:' + String(reason || ''),
                    });
                } catch (err) {
                    return Promise.resolve({
                        ok: false,
                        reason: 'filter_panel_exception:' + String(reason || ''),
                        error: err && err.message ? err.message : String(err),
                    });
                }
            },
            applySimplifyPointVisibility() {
                const shouldShowPoi = this.shouldShowPoiOnCurrentPanel();
                if (typeof this.applyPoiVisualState === 'function') {
                    this.applyPoiVisualState({
                        shouldShowPoi: shouldShowPoi,
                    });
                }

                if (!this.markerManager && shouldShowPoi && Array.isArray(this.allPoisDetails) && this.allPoisDetails.length > 0) {
                    this.rebuildPoiRuntimeSystem(this.allPoisDetails);
                }
            },
            selectStep3Panel(panelId) {
                if (this.isDraggingNav) return;
                const nextPanelId = this.normalizeStep3PanelId(panelId);
                if (nextPanelId === STEP3_PANEL_IDS.SYNTAX && !this.roadSyntaxModulesReady) {
                    this.roadSyntaxSetStatus('路网模块未完整加载：' + (this.roadSyntaxModuleMissing || []).join(', '));
                    return;
                }
                if (!this.isStep3PanelVisible(nextPanelId)) return;

                const previousPanel = this.activeStep3Panel;
                this.activeStep3Panel = nextPanelId;

                if (previousPanel === STEP3_PANEL_IDS.SYNTAX && nextPanelId !== STEP3_PANEL_IDS.SYNTAX) {
                    this.suspendRoadSyntaxDisplay();
                }
                if (nextPanelId !== STEP3_PANEL_IDS.H3) {
                    this.h3ExportMenuOpen = false;
                    this.h3ExportTasksOpen = false;
                }
                if (nextPanelId === STEP3_PANEL_IDS.POI) {
                    this.applySimplifyPointVisibility();
                    this.$nextTick(() => {
                        if (String(this.poiSubTab || 'category') === 'analysis') {
                            this.refreshPoiKdeOverlay();
                        } else {
                            this.updatePoiCharts();
                            setTimeout(() => this.resizePoiChart(), 0);
                        }
                    });
                    return;
                }
                if (nextPanelId === STEP3_PANEL_IDS.H3) {
                    this.syncH3PoiFilterSelection(false);
                    this.ensureH3PanelEntryState();
                    this.restoreH3GridDisplayOnEnter();
                    this.$nextTick(() => {
                        if (typeof this.updateH3Charts === 'function') this.updateH3Charts();
                        if (typeof this.updateDecisionCards === 'function') this.updateDecisionCards();
                    });
                    this.applySimplifyPointVisibility();
                    return;
                }
                if (nextPanelId === STEP3_PANEL_IDS.SYNTAX) {
                    const hasRoadSnapshot = !!this.roadSyntaxSummary
                        || (Array.isArray(this.roadSyntaxRoadFeatures) && this.roadSyntaxRoadFeatures.length > 0)
                        || (Array.isArray(this.roadSyntaxNodes) && this.roadSyntaxNodes.length > 0);
                    if (hasRoadSnapshot) {
                        const metricTabs = (typeof this.roadSyntaxMetricTabs === 'function')
                            ? this.roadSyntaxMetricTabs().map((tab) => tab.value)
                            : ['connectivity', 'control', 'depth', 'choice', 'integration', 'intelligibility'];
                        const currentTab = String(this.roadSyntaxMainTab || '').trim();
                        const currentMetric = String(this.roadSyntaxMetric || '').trim();
                        const lastMetric = String(this.roadSyntaxLastMetricTab || '').trim();
                        const defaultMetric = typeof this.roadSyntaxDefaultMetric === 'function'
                            ? this.roadSyntaxDefaultMetric()
                            : 'connectivity';
                        const targetTab = metricTabs.includes(currentTab)
                            ? currentTab
                            : (metricTabs.includes(currentMetric)
                                ? currentMetric
                                : (metricTabs.includes(lastMetric) ? lastMetric : defaultMetric));
                        this.setRoadSyntaxMainTab(targetTab, { refresh: false, syncMetric: true });
                    } else {
                        this.setRoadSyntaxMainTab('params', { refresh: false, syncMetric: false });
                    }
                    this.resumeRoadSyntaxDisplay();
                }
                this.applySimplifyPointVisibility();
            },
            suspendPoiSystemForSyntax() {
                if (this.poiSystemSuspendedForSyntax) return;
                this.clearPoiOverlayLayers({
                    reason: 'suspend_for_syntax',
                    clearManager: true,
                    clearSimpleMarkers: true,
                    resetFilterPanel: true,
                    immediate: true,
                });
                this.poiSystemSuspendedForSyntax = true;
            },
            resumePoiSystemAfterSyntax() {
                if (!this.poiSystemSuspendedForSyntax) return;
                this.poiSystemSuspendedForSyntax = false;
                if (!this.markerManager && Array.isArray(this.allPoisDetails) && this.allPoisDetails.length) {
                    this.rebuildPoiRuntimeSystem(this.allPoisDetails);
                }
            },
            onStep3DragStart(index, event) {
                this.dragIndex = index;
                this.dragOverIndex = index;
                this.dragInsertPosition = 'before';
                this.isDraggingNav = true;
                if (event && event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                }
            },
            onStep3DragOver(index, event) {
                if (event) event.preventDefault();
                this.dragOverIndex = index;
                const bounds = event.currentTarget.getBoundingClientRect();
                const midY = bounds.top + bounds.height / 2;
                this.dragInsertPosition = event.clientY < midY ? 'before' : 'after';
            },
            onStep3Drop(index) {
                if (this.dragIndex === null) {
                    this.dragOverIndex = null;
                    this.dragInsertPosition = null;
                    return;
                }
                const items = this.step3NavItems.slice();
                const moved = items.splice(this.dragIndex, 1)[0];
                let insertIndex = index;
                if (this.dragInsertPosition === 'after') {
                    insertIndex = index + 1;
                }
                if (this.dragIndex < insertIndex) {
                    insertIndex -= 1;
                }
                items.splice(insertIndex, 0, moved);
                this.step3NavItems = items;
                this.dragIndex = null;
                this.dragOverIndex = null;
                this.dragInsertPosition = null;
                this.isDraggingNav = false;
            },
            onStep3DragEnd() {
                this.dragIndex = null;
                this.dragOverIndex = null;
                this.dragInsertPosition = null;
                this.isDraggingNav = false;
            },
            goToStep(targetStep) {
                this.confirmNavigation(() => {
                    if (targetStep < this.step) {
                        if (typeof this.cancelHistoryDetailLoading === 'function') {
                            this.cancelHistoryDetailLoading();
                        }
                        if (this.step === 3 && targetStep <= 2) {
                            this.clearPoiOverlayLayers({
                                reason: 'go_to_step_back_to_step2',
                                clearManager: true,
                                clearSimpleMarkers: true,
                                resetFilterPanel: true,
                            });
                            this.resetRoadSyntaxState();
                            this.poiStatus = '';
                            this.clearH3Grid();
                        }

                        if (this.step >= 2 && targetStep <= 1) {
                            if (typeof this.clearScopePolygonsFromMap === 'function') {
                                this.clearScopePolygonsFromMap();
                            }
                            this.resetRoadSyntaxState();
                            this.lastIsochroneGeoJSON = null;
                            this.clearH3Grid();
                        }
                    }
                    this.step = targetStep;
                });
            },
            confirmNavigation(callback) {
                if (this.isFetchingPois) {
                    if (confirm('数据抓取正在进行中，离开将取消未完成的任务。确定要离开吗？')) {
                        this.cancelFetch();
                        callback();
                    }
                } else {
                    callback();
                }
            },
            cancelFetch() {
                if (this.abortController) {
                    this.abortController.abort();
                    this.abortController = null;
                }
                this.isFetchingPois = false;
                this.poiStatus = '任务已取消';
                this.resetFetchSubtypeProgress();
            },
            backToHome() {
                this.confirmNavigation(() => {
                    this.destroyPlaceSearch();
                    this.clearAnalysisLayers();
                    this.sidebarView = 'start';
                    this.step = 1;
                    this.selectedPoint = null;
                    if (typeof this.clearCenterMarkerOverlay === 'function') {
                        this.clearCenterMarkerOverlay();
                    }
                    this.errorMessage = '';
                });
            },
        };
    }

export { createAnalysisWorkbenchMethods };
