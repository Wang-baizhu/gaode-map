import { defineStore } from 'pinia'

export const useAnalysisPoiStore = defineStore('analysis_poi', {
  state: () => ({
    poiKeywords: '',
    typeMapConfig: { groups: [] },
    step3NavItems: [
      { id: 'poi', label: 'POI', title: 'POI 点数据分析' },
      { id: 'population', label: '人口', title: '人口栅格分析' },
      { id: 'syntax', label: '路网', title: '路网分析' },
    ],
    activeStep3Panel: 'poi',
    dragIndex: null,
    dragOverIndex: null,
    dragInsertPosition: null,
    isDraggingNav: false,
    isFetchingPois: false,
    fetchProgress: 0,
    poiStatus: '',
    pointSimplifyEnabled: false,
    pointLayersSuspendedForSyntax: false,
    poiSystemSuspendedForSyntax: false,
  }),
})
