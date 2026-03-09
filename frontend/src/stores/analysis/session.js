import { defineStore } from 'pinia'

export const ANALYSIS_SESSION_STATE_KEYS = Object.freeze([
  'step',
  'sidebarView',
  'selectedPoint',
  'transportMode',
  'timeHorizon',
  'isochroneScopeMode',
  'poiDataSource',
  'resultDataSource',
  'isCalculating',
  'errorMessage',
  'basemapSource',
  'tdtDiag',
  'tdtDiagCopyStatus',
  'scopeSource',
  'drawnScopePolygon',
  'lastIsochroneGeoJSON',
  'abortController',
])

export function createAnalysisSessionInitialState() {
  return {
    step: 1,
    sidebarView: 'start',
    selectedPoint: null,
    transportMode: 'walking',
    timeHorizon: 15,
    isochroneScopeMode: 'point',
    poiDataSource: 'local',
    resultDataSource: 'local',
    isCalculating: false,
    errorMessage: '',
    basemapSource: 'amap',
    tdtDiag: null,
    tdtDiagCopyStatus: '',
    scopeSource: '',
    drawnScopePolygon: [],
    lastIsochroneGeoJSON: null,
    abortController: null,
  }
}

export const useAnalysisSessionStore = defineStore('analysis_session', {
  state: () => createAnalysisSessionInitialState(),
})
