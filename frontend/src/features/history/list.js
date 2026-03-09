    function createAnalysisHistoryListInitialState() {
        return {
            historyListRaw: [],
            historyList: [],
            historyLoading: false,
            historyLoadedCount: 0,
            historySkeletonCount: 5,
            historyHasLoadedOnce: false,
            historyRenderSessionId: 0,
            historyRenderRafId: null,
            historyFetchAbortController: null,
            isSelectionMode: false,
            selectedHistoryIds: [],
        };
    }

    function createAnalysisHistoryListMethods() {
        return {
            cancelHistoryLoading() {
                if (this.historyFetchAbortController) {
                    try {
                        this.historyFetchAbortController.abort();
                    } catch (e) {
                        console.warn('history abort failed', e);
                    }
                    this.historyFetchAbortController = null;
                }
                if (this.historyRenderRafId !== null) {
                    window.cancelAnimationFrame(this.historyRenderRafId);
                    this.historyRenderRafId = null;
                }
                this.historyRenderSessionId += 1;
            },
            normalizePoiSource(source, fallback = 'local') {
                const raw = String(source || '').trim().toLowerCase();
                if (!raw) return fallback;
                if (raw === 'local' || raw === 'history' || raw === 'historical') return 'local';
                if (raw === 'gaode' || raw === 'amap') return 'gaode';
                return fallback;
            },
            getPoiSourceLabel(source) {
                const normalized = this.normalizePoiSource(source, 'unknown');
                if (normalized === 'local') return '本地源（2018年）';
                if (normalized === 'gaode') return '高德源';
                return '未标记';
            },
            normalizeHistoryRecord(item) {
                const record = Object.assign({}, item || {});
                const rawDate = record.created_at;
                let dateText = String(rawDate || '');
                if (rawDate) {
                    const d = new Date(rawDate);
                    if (!Number.isNaN(d.getTime())) {
                        dateText = d.toLocaleDateString();
                    }
                }
                record._createdDateText = dateText;
                const rawSource = record && record.params ? record.params.source : '';
                const normalizedSource = this.normalizePoiSource(rawSource, 'unknown');
                record._source = normalizedSource;
                record._sourceLabel = this.getPoiSourceLabel(normalizedSource);
                return record;
            },
            progressiveRenderHistory(sessionId) {
                if (sessionId !== this.historyRenderSessionId) return;
                if (!Array.isArray(this.historyListRaw)) {
                    this.historyLoading = false;
                    this.historyRenderRafId = null;
                    return;
                }
                if (this.historyLoadedCount >= this.historyListRaw.length) {
                    this.historyLoading = false;
                    this.historyRenderRafId = null;
                    return;
                }

                const nextItem = this.historyListRaw[this.historyLoadedCount];
                this.historyList.push(nextItem);
                this.historyLoadedCount += 1;

                this.historyRenderRafId = window.requestAnimationFrame(() => {
                    this.progressiveRenderHistory(sessionId);
                });
            },
            preloadHistoryListInBackground() {
                if (this.historyHasLoadedOnce || this.historyLoading) {
                    return;
                }
                this.loadHistoryList({ force: true, keepExisting: false, background: true }).catch((err) => {
                    console.warn('History background preload failed', err);
                });
            },
            openHistoryView() {
                this.sidebarView = 'history';
                this.loadHistoryList({ force: false, keepExisting: true, background: false }).catch((err) => {
                    console.warn('History load failed', err);
                });
            },
            refreshHistoryList() {
                this.loadHistoryList({ force: true, keepExisting: true }).catch((err) => {
                    console.warn('History refresh failed', err);
                });
            },
            async loadHistoryList(options = {}) {
                const force = !!(options && options.force);
                const background = !!(options && options.background);
                const keepExisting = options && Object.prototype.hasOwnProperty.call(options, 'keepExisting')
                    ? !!options.keepExisting
                    : (this.historyHasLoadedOnce && this.historyList.length > 0);
                if (!force && this.historyHasLoadedOnce) {
                    return;
                }
                if (this.historyLoading && !force) {
                    return;
                }
                this.cancelHistoryLoading();
                const sessionId = this.historyRenderSessionId;
                this.historyLoading = true;
                if (!keepExisting && !background) {
                    this.historyListRaw = [];
                    this.historyList = [];
                    this.historyLoadedCount = 0;
                }
                this.historyFetchAbortController = new AbortController();

                try {
                    const res = await fetch('/api/v1/analysis/history', {
                        signal: this.historyFetchAbortController.signal
                    });
                    if (!res.ok) {
                        throw new Error(`历史记录请求失败(${res.status})`);
                    }
                    const data = await res.json();
                    if (sessionId !== this.historyRenderSessionId) return;
                    const normalized = Array.isArray(data)
                        ? data.map((item) => this.normalizeHistoryRecord(item))
                        : [];
                    this.historyListRaw = normalized;
                    this.historyList = normalized.slice();
                    this.historyLoadedCount = normalized.length;
                    this.historyLoading = false;
                    this.historyRenderRafId = null;
                    this.historyHasLoadedOnce = true;
                } catch (e) {
                    if (e && e.name === 'AbortError') return;
                    console.error('History Load Error:', e);
                    if (sessionId !== this.historyRenderSessionId) return;
                    this.historyLoading = false;
                    if (!keepExisting && !background) {
                        this.historyListRaw = [];
                        this.historyList = [];
                        this.historyLoadedCount = 0;
                    }
                } finally {
                    if (sessionId === this.historyRenderSessionId) {
                        this.historyFetchAbortController = null;
                    }
                }
            },
            toggleSelectionMode(active) {
                this.isSelectionMode = active;
                this.selectedHistoryIds = [];
            },
            handleHistoryItemClick(item) {
                if (this.isSelectionMode) {
                    const idx = this.selectedHistoryIds.indexOf(item.id);
                    if (idx > -1) {
                        this.selectedHistoryIds.splice(idx, 1);
                    } else {
                        this.selectedHistoryIds.push(item.id);
                    }
                } else {
                    this.loadHistoryDetail(item.id);
                }
            },
            async deleteSelectedHistory() {
                const count = this.selectedHistoryIds.length;
                if (count === 0) return;

                if (!confirm(`确定要删除选中的 ${count} 条记录吗？`)) return;

                try {
                    const deletePromises = this.selectedHistoryIds.map((id) =>
                        fetch(`/api/v1/analysis/history/${id}`, { method: 'DELETE' })
                    );

                    await Promise.all(deletePromises);

                    const removedIds = new Set(this.selectedHistoryIds);
                    this.historyList = this.historyList.filter((item) => !removedIds.has(item.id));
                    this.historyListRaw = this.historyListRaw.filter((item) => !removedIds.has(item.id));
                    this.historyLoadedCount = this.historyList.length;
                    this.selectedHistoryIds = [];
                    this.isSelectionMode = false;
                } catch (e) {
                    console.error('Batch delete failed', e);
                    alert('批量删除失败');
                }
            },
            async deleteHistory(id) {
                if (!confirm('确定要删除这条记录吗？')) return;
                try {
                    await fetch(`/api/v1/analysis/history/${id}`, { method: 'DELETE' });
                    this.historyList = this.historyList.filter((item) => item.id !== id);
                    this.historyListRaw = this.historyListRaw.filter((item) => item.id !== id);
                    this.historyLoadedCount = this.historyList.length;
                } catch (e) {
                    console.error(e);
                }
            },
        };
    }

export { createAnalysisHistoryListInitialState, createAnalysisHistoryListMethods };
