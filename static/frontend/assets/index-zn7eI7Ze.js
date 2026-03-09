import{c as pt}from"./vendor-vue-DkdC8wD7.js";import{c as St}from"./feature-isochrone-CoKIAalb.js";import{c as gt,a as xt,b as mt,d as bt}from"./feature-poi-Jfq-YZAz.js";import{c as ft,a as vt,b as Mt,d as Rt}from"./feature-history-Dh5BLdU8.js";import{a as kt,c as Pt}from"./feature-h3-CVHZCJ-S.js";import{a as wt,c as _t}from"./feature-export-ClJqo9Zo.js";import{a as At,b as st,d as rt,c as ot,e as lt,f as Lt,g as Ct}from"./feature-road-map-CTSBP9_i.js";import{c as Tt,u as Nt,a as It,b as Dt,d as Ot,e as Ft,A as Et,f as $t,g as Bt,h as Wt,i as zt}from"./feature-stores-NQOjmGAz.js";import{m as it,u as yt,v as Gt,x as Ht,y as et,z as at,A as jt,B as Vt,C as qt,d as dt}from"./vendor-C18lXgnW.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))h(c);new MutationObserver(c=>{for(const g of c)if(g.type==="childList")for(const M of g.addedNodes)M.tagName==="LINK"&&M.rel==="modulepreload"&&h(M)}).observe(document,{childList:!0,subtree:!0});function l(c){const g={};return c.integrity&&(g.integrity=c.integrity),c.referrerPolicy&&(g.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?g.credentials="include":c.crossOrigin==="anonymous"?g.credentials="omit":g.credentials="same-origin",g}function h(c){if(c.ep)return;c.ep=!0;const g=l(c);fetch(c.href,g)}})();const ct=new Map,Kt="analysis-style-";function ht(r){const o=ct.get(r);if(o)return o;const l=new Promise((h,c)=>{const g=document.querySelector(`script[data-analysis-src="${r}"]`);if(g){if(g.__loaded){h();return}g.addEventListener("load",()=>h(),{once:!0}),g.addEventListener("error",()=>c(new Error(`script load failed: ${r}`)),{once:!0});return}const M=document.createElement("script");M.src=r,M.async=!1,M.dataset.analysisSrc=r,M.onload=()=>{M.__loaded=!0,h()},M.onerror=()=>c(new Error(`script load failed: ${r}`)),document.head.appendChild(M)});return ct.set(r,l),l}function nt(r){const o=`${Kt}${r}`.replace(/[^a-zA-Z0-9_-]/g,"_");if(document.getElementById(o))return;const l=document.createElement("link");l.id=o,l.rel="stylesheet",l.href=r,document.head.appendChild(l)}async function Ut(){nt("/static/css/map-common.css"),nt("/static/css/filter-panel.css"),nt("/static/css/analysis-page.css"),await ht("/static/vendor/html2canvas.min.js"),await ht("/static/vendor/echarts.min.js")}const Yt=`

        <!-- Left Sidebar: Wizard Dashboard -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div v-if="sidebarView === 'wizard'" class="step-header-nav" style="margin:0; width:100%;">
                    <button v-if="step === 1" class="btn-text-back" @click="backToHome">← 返回主页</button>
                </div>

                <div v-if="sidebarView === 'history'" class="step-header-nav history-header-nav">
                    <div class="history-header-slot left">
                        <button class="btn-text-back"
                            @click="isSelectionMode ? toggleSelectionMode(false) : backToHome()" style="margin:0;">
                            {{ isSelectionMode ? '取消' : '← 返回主页' }}
                        </button>
                    </div>
                    <h3 class="history-header-title">历史记录</h3>
                    <div class="history-header-slot right" style="display:flex; align-items:center; justify-content:flex-end; gap:8px;">
                        <button v-if="!isSelectionMode" class="btn-text-back history-icon-btn"
                            :class="{ 'is-loading': historyLoading }"
                            @click="refreshHistoryList" :disabled="historyLoading" style="margin:0;"
                            title="刷新历史记录" aria-label="刷新历史记录">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M20 5v5h-5"></path>
                                <path d="M4 19v-5h5"></path>
                                <path d="M6.2 8.2A8 8 0 0 1 18 10"></path>
                                <path d="M17.8 15.8A8 8 0 0 1 6 14"></path>
                            </svg>
                        </button>
                        <button class="btn-text-back" @click="toggleSelectionMode(!isSelectionMode)" style="margin:0;">
                            {{ isSelectionMode ? '完成' : '管理' }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="sidebar-content">

                <!-- Start Screen -->
                <div v-show="sidebarView === 'start'" class="home-menu">
                    <div class="home-card" @click="confirmNavigation(() => resetAnalysis())">
                        <div class="home-icon">
                            <img src="/static/images/search.svg" alt="探索">
                        </div>
                        <div class="home-text">
                            <h3>实时探索</h3>
                            <p>Real-time Explore</p>
                            <p style="margin-top:4px; color:#999;">基于高德实时数据分析</p>
                        </div>
                    </div>

                    <div class="home-card"
                        @click="confirmNavigation(() => openHistoryView())">
                        <div class="home-icon">
                            <img src="/static/images/history.svg" alt="档案">
                        </div>
                        <div class="home-text">
                            <h3>本地档案</h3>
                            <p>Local Archives</p>
                            <p style="margin-top:4px; color:#999;">查看往期分析记录</p>
                        </div>
                    </div>
                </div>

                <!-- History View -->
                <div v-show="sidebarView === 'history'" class="history-list" style="padding-bottom: 80px;">
                    <div v-if="historyLoading && historyList.length === 0">
                        <div v-for="n in historySkeletonCount" :key="'history-skeleton-' + n" class="history-card history-skeleton-card">
                            <div style="flex:1;">
                                <div class="skeleton-line skeleton-line-title"></div>
                                <div class="skeleton-line skeleton-line-meta"></div>
                            </div>
                        </div>
                    </div>

                    <div v-for="item in historyList" :key="item.id" class="history-card"
                        @click="handleHistoryItemClick(item)"
                        :class="{'selection-mode': isSelectionMode, 'selected': selectedHistoryIds.includes(item.id)}">

                        <!-- Checkbox for Selection Mode -->
                        <div v-if="isSelectionMode" class="checkbox-wrapper">
                            <div class="custom-checkbox" :class="{checked: selectedHistoryIds.includes(item.id)}">
                                <svg v-if="selectedHistoryIds.includes(item.id)" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="3">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div style="flex:1;">
                            <div class="card-header">
                                <span class="card-title">{{ formatHistoryTitle(item.description) }}</span>
                            </div>
                            <div class="card-meta">
                                <div class="meta-row">
                                    <span class="meta-tag mode-tag">
                                        <span v-if="item.params && item.params.mode === 'driving'">
                                            <img src="/static/images/driving.svg"> 驾车
                                        </span>
                                        <span v-else-if="item.params && item.params.mode === 'bicycling'">
                                            <img src="/static/images/cycling.svg"> 骑行
                                        </span>
                                        <span v-else>
                                            <img src="/static/images/walking.svg"> 步行
                                        </span>
                                    </span>
                                    <span v-if="item.params && item.params.time_min" class="meta-tag time-tag">
                                        <img src="/static/images/time.svg"> {{ item.params.time_min }}分
                                    </span>
                                    <span class="meta-tag source-tag">
                                        数据源 {{ item._sourceLabel || '未标记' }}
                                    </span>
                                </div>
                                <span class="meta-date">
                                    {{ item._createdDateText || item.created_at }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Batch Delete Footer -->
                    <div v-if="isSelectionMode"
                        style="position:fixed; bottom:0; left:0; width:var(--sidebar-width); background:#fff; padding:15px; border-top:1px solid #eee; box-shadow:0 -2px 10px rgba(0,0,0,0.05); z-index:100; box-sizing:border-box; display:flex; gap:10px;">
                        <button class="btn-black" :disabled="selectedHistoryIds.length === 0"
                            @click="deleteSelectedHistory" style="background: #ff4d4f; border:none; width:100%;">
                            删除选中 ({{ selectedHistoryIds.length }})
                        </button>
                    </div>

                    <div v-if="!historyLoading && historyList.length === 0"
                        style="text-align:center; padding:40px 20px; color:#999; display:flex; flex-direction:column; align-items:center;">
                        <img src="/static/images/empty.svg"
                            style="width:48px; height:48px; opacity:0.3; margin-bottom:10px;">
                        <span>暂无历史记录</span>
                    </div>
                </div>

                <!-- Wizard View Wrapper -->
                <div v-show="sidebarView === 'wizard'" style="display:contents;">

                    <!-- Step 1: Location & Analysis -->
                    <div v-show="step === 1" class="wizard-step">
                        <div class="step-title">
                            <h3>1. 地点与范围</h3>
                        </div>

                        <div class="form-group">
                            <label>范围模式</label>
                            <div class="mode-select">
                                <div class="mode-select">
                                    <div class="mode-option" :class="{active: isochroneScopeMode==='point'}"
                                        @click="setIsochroneScopeMode('point')">点等时圈</div>
                                    <div class="mode-option" :class="{active: isochroneScopeMode==='area'}"
                                        @click="setIsochroneScopeMode('area')">面等时圈</div>
                                </div>
                            </div>
                        </div>

                        <div v-if="isochroneScopeMode === 'point'" class="form-group search-group">
                            <input type="text" id="keyword" class="minimal-input" placeholder="搜索地点..."
                                @keyup.enter="triggerSearch">
                            <button class="btn-icon" @click="triggerSearch">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                        </div>

                        <div class="form-group">
                            <div v-if="isochroneScopeMode === 'area' && hasDrawnScopePolygon()" class="status-badge success">
                                已绘制区域: {{ getDrawnScopePointCount() }} 个顶点
                            </div>
                            <div v-else-if="isochroneScopeMode === 'point' && selectedPoint" class="status-badge success">
                                已选: {{ selectedPoint.lng.toFixed(4) }}, {{ selectedPoint.lat.toFixed(4) }}
                            </div>
                            <div v-else-if="isochroneScopeMode === 'point'" class="status-badge warning">请在地图上点击/搜索选择起点</div>
                            <div v-else class="status-badge warning">请先绘制分析区域</div>
                        </div>

                        <div class="form-group">
                            <label>出行方式</label>
                            <div class="mode-select">
                                <div class="mode-select">
                                    <div class="mode-option" :class="{active: transportMode==='walking'}"
                                        @click="transportMode='walking'">步行 <img src="/static/images/walking.svg"></div>
                                    <div class="mode-option" :class="{active: transportMode==='bicycling'}"
                                        @click="transportMode='bicycling'">骑行 <img src="/static/images/cycling.svg">
                                    </div>
                                    <div class="mode-option" :class="{active: transportMode==='driving'}"
                                        @click="transportMode='driving'">驾车 <img src="/static/images/driving.svg"></div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>时间范围: {{ timeHorizon }} 分钟</label>
                            <input type="range" v-model.number="timeHorizon" class="minimal-range" min="5" max="60"
                                step="5">
                        </div>
                        <div class="form-group" style="display:flex; align-items:center; gap:8px;">
                            <label style="margin:0;">底图源</label>
                            <select v-model="basemapSource" @change="onBasemapSourceChange"
                                class="minimal-input" style="padding:4px 8px; max-width:180px;">
                                <option value="tianditu">天地图（国内科研）</option>
                                <option value="osm">OpenStreetMap（科研）</option>
                                <option value="amap">高德（业务）</option>
                            </select>
                        </div>

                        <button v-if="isochroneScopeMode === 'area'" class="btn-outline" style="margin-top:8px;" :disabled="isCalculating"
                            @click="toggleScopeDrawing">
                            {{ drawScopeActive ? '结束绘制' : '绘制区域（多边形）' }}
                        </button>
                        <button v-if="isochroneScopeMode === 'area'" class="btn-outline" style="margin-top:8px;"
                            :disabled="isCalculating || !hasDrawnScopePolygon()" @click="clearDrawnScopePolygon">
                            清除绘制区域
                        </button>
                        <button class="btn-black"
                            :disabled="(isochroneScopeMode === 'point' ? !selectedPoint : !hasDrawnScopePolygon()) || isCalculating || drawScopeActive"
                            @click="startAnalysis">
                            {{ isCalculating ? '处理中...' : (isochroneScopeMode === 'area' ? '下一步: 基于绘制范围生成等时圈' : '下一步: 生成等时圈') }}
                        </button>
                        <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>
                        <div v-if="basemapSource === 'tianditu' && tdtDiag && tdtDiag.ok === false"
                            style="margin-top:10px; padding:10px; border:1px solid #f1b0b7; border-radius:8px; background:#fff7f7;">
                            <div style="font-size:12px; font-weight:600; color:#9f1239; margin-bottom:6px;">天地图诊断信息</div>
                            <div style="font-size:11px; color:#6b7280; line-height:1.5; margin-bottom:6px;">
                                阶段={{ tdtDiag.phase || '-' }}；状态={{ tdtDiag.status === null || tdtDiag.status === undefined ? '-' : tdtDiag.status }}；内容类型={{ tdtDiag.contentType || '-' }}
                            </div>
                            <pre
                                style="margin:0; max-height:120px; overflow:auto; white-space:pre-wrap; word-break:break-all; font-size:11px; line-height:1.45; color:#4b5563; background:#fff; border:1px solid #e5e7eb; border-radius:6px; padding:8px;">{{ buildTdtDiagText() }}</pre>
                            <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                                <button type="button" class="btn-outline" style="margin-top:0; padding:6px 12px; width:auto;"
                                    @click="copyTdtDiag">
                                    复制诊断
                                </button>
                                <span style="font-size:11px; color:#6b7280;">{{ tdtDiagCopyStatus }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: POI Categories -->
                    <div v-show="step === 2" class="wizard-step">
                        <div class="step-header-nav">
                            <button class="btn-text-back" @click="goToStep(1)">← 返回</button>
                            <h3>2. 选择业态</h3>
                        </div>
                        <p class="step-desc">选择需要在等时圈内抓取的设施类型</p>

                        <div class="category-grid">
                            <div v-for="cat in poiCategories" :key="cat.id" class="cat-card" :class="{checked: cat.checked}">
                                <div class="cat-color" :style="{background: cat.color}"></div>
                                <div class="cat-texts">
                                    <div class="cat-header-row">
                                        <label class="cat-check" @click.stop>
                                            <input type="checkbox" :checked="cat.checked"
                                                @change="togglePoiCategory(cat, $event.target.checked)">
                                            <span class="cat-name">{{ cat.name }}</span>
                                        </label>
                                        <button v-if="getPoiSubItems(cat.id).length" type="button" class="cat-expand-btn"
                                            @click.stop="togglePoiCategoryExpand(cat.id)">
                                            {{ expandedPoiCategoryId === cat.id ? '收起' : '展开' }}
                                        </button>
                                    </div>
                                    <div class="cat-subtypes" v-if="getPoiSubItems(cat.id).length">
                                        已选 {{ getPoiSubSelectedCount(cat.id) }}/{{ getPoiSubItems(cat.id).length }} 个小类
                                    </div>
                                    <div class="cat-subitem-list" v-show="expandedPoiCategoryId === cat.id"
                                        v-if="getPoiSubItems(cat.id).length">
                                        <label v-for="item in getPoiSubItems(cat.id)" :key="\`step2-sub-\${cat.id}-\${item.id}\`"
                                            class="cat-subitem" @click.stop>
                                            <input type="checkbox" :checked="isPoiSubItemChecked(item.id)"
                                                @change="onPoiSubItemToggle(cat, item, $event.target.checked)">
                                            <span>{{ item.label }}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group" style="display:flex; align-items:center; gap:8px;">
                            <label style="margin:0;">数据来源</label>
                            <select v-model="poiDataSource" class="minimal-input"
                                style="padding:4px 8px; max-width:180px;">
                                <option value="local">本地源（2018年）</option>
                                <option value="gaode">高德源</option>
                            </select>
                        </div>

                        <button class="btn-black" :disabled="isFetchingPois" @click="fetchPois">
                            {{ isFetchingPois ? '数据抓取中 ' + fetchProgress + '%' : '下一步: 抓取数据' }}
                        </button>

                        <div v-if="isFetchingPois"
                            style="margin-top:10px; background:#f0f0f0; height:6px; border-radius:3px; overflow:hidden;">
                            <div
                                :style="{width: fetchProgress + '%', background:'#000', height:'100%', transition:'width 0.3s ease'}">
                            </div>
                        </div>
                        <div v-if="isFetchingPois && fetchSubtypeProgress.categoryName" class="fetch-subtype-progress">
                            <div class="line">
                                <span class="label">当前大类：</span>
                                <span>{{ fetchSubtypeProgress.categoryName }}</span>
                            </div>
                            <div class="line">
                                <span class="label">已命中小类：</span>
                                <template v-if="fetchSubtypeProgress.typeNamesPreview.length">
                                    <span>{{ fetchSubtypeProgress.typeNamesPreview.join('、') }}</span>
                                    <span v-if="fetchSubtypeProgress.hiddenTypeCount > 0">
                                         等{{ fetchSubtypeProgress.typeNamesFullCount }}个小类
                                    </span>
                                </template>
                                <template v-else>
                                    <span>暂无</span>
                                </template>
                            </div>
                        </div>

                        <div v-if="poiStatus" class="status-text">{{ poiStatus }}</div>
                    </div>

                    <!-- Step 3: Results & Filter -->
                    <div v-show="step === 3" class="wizard-step wizard-step-step3">
                        <div class="step-header-nav">
                            <h3>3. 结果分析</h3>
                            <span class="count-badge" style="margin-left:10px;">
                                数据源 {{ getPoiSourceLabel(resultDataSource) }}
                            </span>
                        </div>

                        <div class="step3-layout">
                            <div class="nav-rail">
                                <div v-for="(item, index) in step3NavItems" :key="item.id" class="nav-item" :class="{
                                        active: activeStep3Panel === item.id,
                                        dragging: dragIndex === index,
                                        'insert-before': isDraggingNav && dragOverIndex === index && dragInsertPosition === 'before',
                                        'insert-after': isDraggingNav && dragOverIndex === index && dragInsertPosition === 'after'
                                    }" :title="item.title" draggable="true" @click="selectStep3Panel(item.id)"
                                    @dragstart="onStep3DragStart(index, $event)"
                                    @dragover="onStep3DragOver(index, $event)" @drop="onStep3Drop(index)"
                                    @dragend="onStep3DragEnd">
                                    {{ item.label }}
                                </div>
                            </div>

                            <div class="panel-area panel-area-fill">
                                <div class="panel poi-panel" v-show="activeStep3Panel === 'poi'">
                                    <div class="poi-panel-topbar">
                                        <div class="h3-subtabs h3-stage-tabs poi-stage-tabs">
                                            <button type="button" class="h3-subtab-pill h3-stage-pill"
                                                :class="{ active: poiSubTab === 'category' }"
                                                @click="setPoiSubTab('category')">分类</button>
                                            <button type="button" class="h3-subtab-pill h3-stage-pill"
                                                :class="{ active: poiSubTab === 'analysis' }"
                                                @click="setPoiSubTab('analysis')">分析</button>
                                        </div>
                                        <div class="poi-panel-header">
                                            <div class="poi-panel-actions">
                                                <span id="poiTotalCount" class="count-badge">总数 0</span>
                                                <button v-show="poiSubTab === 'category'" id="toggleAllPoi" type="button"
                                                    class="btn-outline btn-compact">全部隐藏</button>
                                                <button v-show="poiSubTab === 'category'" id="toggleExpandAll" class="btn-outline btn-compact">全部展开</button>
                                            </div>
                                        </div>
                                        <div v-if="shouldShowPoiPanelStatus()" class="poi-panel-status" :class="{ 'is-loading': isHistoryPoiRestoring() }">
                                            <span v-if="isHistoryPoiRestoring()" class="poi-panel-status-dot"></span>
                                            <span>{{ getPoiPanelStatusText() }}</span>
                                        </div>
                                    </div>
                                    <div v-show="poiSubTab === 'category'" class="poi-subpanel">
                                        <div id="filtersContainer" class="poi-filters-wrapper"></div>
                                    </div>
                                    <div v-show="poiSubTab === 'analysis'" class="poi-subpanel poi-kde-panel">
                                        <div class="h3-subtabs poi-analysis-tabs">
                                            <button type="button" class="h3-subtab-pill"
                                                :class="{ active: poiAnalysisSubTab === 'kde' }"
                                                @click="setPoiAnalysisSubTab('kde')">核密度</button>
                                            <button type="button" class="h3-subtab-pill"
                                                :class="{ active: poiAnalysisSubTab === 'stats' }"
                                                @click="setPoiAnalysisSubTab('stats')">统计</button>
                                        </div>
                                        <div class="poi-kde-intro">
                                            <div class="poi-kde-title">{{ poiAnalysisSubTab === 'stats' ? '热点统计视图' : '核密度热力图' }}</div>
                                        </div>
                                        <div v-show="poiAnalysisSubTab === 'kde'" class="poi-kde-controls">
                                            <label class="poi-kde-range-field">
                                                <span>核密度半径</span>
                                                <input type="range" min="12" max="60" step="2"
                                                    v-model.number="poiKdeRadius"
                                                    @input="refreshPoiKdeOverlay">
                                                <strong>{{ poiKdeRadius }}</strong>
                                            </label>
                                        </div>
                                        <div v-show="poiAnalysisSubTab === 'kde'" class="poi-kde-gradient-card">
                                            <div class="poi-kde-gradient-head">
                                                <span>热力强度</span>
                                                <span>低 → 高</span>
                                            </div>
                                            <div class="poi-kde-gradient-bar"></div>
                                        </div>
                                        <div v-show="poiAnalysisSubTab === 'stats'" class="poi-kde-stat-grid">
                                            <div class="poi-kde-stat-card">
                                                <span class="poi-kde-stat-label">可见 POI</span>
                                                <strong>{{ poiKdeStats.visiblePointCount }}</strong>
                                            </div>
                                            <div class="poi-kde-stat-card">
                                                <span class="poi-kde-stat-label">热力上限</span>
                                                <strong>{{ poiKdeStats.maxIntensity }}</strong>
                                            </div>
                                            <div class="poi-kde-stat-card">
                                                <span class="poi-kde-stat-label">热点类别</span>
                                                <strong>{{ poiKdeStats.topCategoryRows.length }}</strong>
                                            </div>
                                        </div>
                                        <div v-show="poiAnalysisSubTab === 'stats'" class="poi-kde-chart-card">
                                            <div class="poi-kde-chart-head">
                                                <span>热点类别柱状图</span>
                                                <span>全部类别</span>
                                            </div>
                                            <div v-if="poiKdeStats.chartRows.length" class="poi-kde-bar-chart-scroll">
                                                <div class="poi-kde-bar-chart"
                                                    :style="{
                                                        gridTemplateColumns: \`repeat(\${Math.max(1, poiKdeStats.chartRows.length)}, minmax(34px, 1fr))\`,
                                                        minWidth: \`\${Math.max(360, poiKdeStats.chartRows.length * 48)}px\`
                                                    }">
                                                <div v-for="row in poiKdeStats.chartRows" :key="\`poi-kde-chart-\${row.id}\`" class="poi-kde-bar-col">
                                                    <div class="poi-kde-bar-wrap">
                                                        <div class="poi-kde-bar" :style="{ height: \`\${row.height}%\`, background: row.color }"></div>
                                                    </div>
                                                    <strong class="poi-kde-bar-value">{{ row.value }}</strong>
                                                    <div class="poi-kde-bar-label">{{ row.shortLabel }}</div>
                                                </div>
                                                </div>
                                            </div>
                                            <div v-else class="panel-placeholder">当前没有可用于统计的 POI。</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="panel" v-show="activeStep3Panel === 'h3'">
                                    <div class="h3-subtabs h3-stage-tabs">
                                        <button type="button" class="h3-subtab-pill h3-stage-pill"
                                            :class="{ active: h3MainStage === 'params' }"
                                            @click="onH3MainStageChange('params')">参数</button>
                                        <button type="button" class="h3-subtab-pill h3-stage-pill"
                                            :class="{ active: h3MainStage === 'analysis' }"
                                            @click="onH3MainStageChange('analysis')">分析</button>
                                        <button type="button" class="h3-subtab-pill h3-stage-pill"
                                            :class="{ active: h3MainStage === 'diagnosis' }"
                                            @click="onH3MainStageChange('diagnosis')">诊断</button>
                                        <button type="button" class="h3-subtab-pill h3-stage-pill"
                                            :class="{ active: h3MainStage === 'evaluate' }"
                                            @click="onH3MainStageChange('evaluate')">评估</button>
                                    </div>
                                    <div v-if="h3MainStage === 'params'" class="h3-params-card">
                                        <div class="h3-params-grid">
                                            <label class="h3-params-field">
                                                <span class="h3-params-label">网格级别</span>
                                                <select v-model.number="h3GridResolution" @change="onH3ResolutionChange" class="h3-params-select">
                                                    <option :value="8">8</option>
                                                    <option :value="9">9</option>
                                                    <option :value="10">10</option>
                                                    <option :value="11">11</option>
                                                </select>
                                            </label>
                                            <label class="h3-params-field">
                                                <span class="h3-params-label">邻域圈层</span>
                                                <select v-model.number="h3NeighborRing" class="h3-params-select">
                                                    <option :value="1">ring=1</option>
                                                    <option :value="2">ring=2</option>
                                                    <option :value="3">ring=3</option>
                                                </select>
                                            </label>
                                            <label class="h3-params-field h3-params-field-wide">
                                                <span class="h3-params-label">包含模式</span>
                                                <select v-model="h3GridIncludeMode" @change="onH3GridSettingsChange" class="h3-params-select">
                                                    <option value="intersects">相交优先（边缘保留）</option>
                                                    <option value="inside">完全包含（严格）</option>
                                                </select>
                                            </label>
                                            <div class="h3-params-field h3-params-field-wide">
                                                <span class="h3-params-label">最小重叠比例</span>
                                                <div class="h3-params-range-row">
                                                    <input type="range" min="0" max="0.9" step="0.05"
                                                        v-model.number="h3GridMinOverlapRatio" @change="onH3GridSettingsChange"
                                                        class="minimal-range h3-params-range">
                                                    <span class="range-value">{{ h3GridMinOverlapRatio.toFixed(2) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="h3-params-chips">
                                            <span class="count-badge">网格数 {{ h3GridCount }}</span>
                                        </div>
                                        <div class="h3-params-actions">
                                            <button class="h3-btn h3-btn-ghost"
                                                :disabled="h3GridCount === 0" @click="clearH3Grid">
                                                清空网络
                                            </button>
                                            <button class="h3-btn h3-btn-primary h3-params-compute-btn"
                                                :disabled="isComputingH3Analysis || isGeneratingH3ArcgisSnapshot || !lastIsochroneGeoJSON"
                                                @click="computeH3Analysis">
                                                {{ isComputingH3Analysis ? '分析中...' : '计算分析' }}
                                            </button>
                                        </div>
                                    </div>
                                    <div class="h3-subtabs"
                                        v-if="h3MainStage !== 'params' && h3AnalysisGridFeatures.length > 0 && getH3CurrentStageTabs().length > 1"
                                        style="margin-top:6px; grid-template-columns: repeat(2, minmax(0, 1fr));">
                                        <button type="button" class="h3-subtab-pill"
                                            v-for="tab in getH3CurrentStageTabs()"
                                            :key="\`h3-subtab-\${tab}\`"
                                            :class="{ active: h3SubTab === tab }"
                                            @click="onH3SubTabChange(tab)">
                                            {{ h3SubTabLabels[tab] || tab }}
                                        </button>
                                    </div>
                                    <div class="filter-section"
                                        v-if="h3AnalysisGridFeatures.length > 0 && h3MainStage === 'analysis' && h3SubTab === 'metric_map'"
                                        style="margin-top:8px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                        <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:#666;">
                                            地图指标
                                            <select v-model="h3MetricView" @change="onH3MetricViewChange"
                                                style="padding:4px 6px; border:1px solid #ddd; border-radius:6px; font-size:12px;">
                                                <option value="density">密度</option>
                                                <option value="entropy">局部熵</option>
                                                <option value="neighbor_delta">邻域差值（本格-邻域）</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div class="filter-section"
                                        v-if="h3AnalysisGridFeatures.length > 0 && h3MainStage === 'analysis' && h3SubTab === 'structure_map'"
                                        style="margin-top:8px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                        <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:#666;">
                                            结构图层
                                            <select v-model="h3StructureFillMode" @change="onH3StructureFillModeChange"
                                                style="padding:4px 6px; border:1px solid #ddd; border-radius:6px; font-size:12px;">
                                                <option value="gi_z">Gi*（Z-score 连续）</option>
                                                <option value="lisa_i">LISA（LMiIndex 连续）</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div class="filter-section h3-control-row h3-control-row-tight"
                                        v-if="h3AnalysisGridFeatures.length > 0 && (h3MainStage === 'diagnosis' || h3MainStage === 'evaluate')"
                                        style="margin-top:8px;">
                                        <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:#666;">
                                            TopN
                                            <input type="number" min="3" max="30" step="1"
                                                v-model.number="h3DecisionTopN" @change="onH3DecisionSettingsChange"
                                                style="width:68px; padding:4px 6px; border:1px solid #ddd; border-radius:6px; font-size:12px;">
                                        </label>
                                        <label v-if="h3SubTab === 'lq' || h3SubTab === 'gap'"
                                            style="display:flex; align-items:center; gap:6px; font-size:12px; color:#666;">
                                            目标业态
                                            <select v-model="h3TargetCategory" @change="onH3DecisionSettingsChange"
                                                style="padding:4px 6px; border:1px solid #ddd; border-radius:6px; font-size:12px;">
                                                <option v-for="item in h3CategoryMeta" :key="\`target-\${item.key}\`" :value="item.key">
                                                    {{ item.label }}
                                                </option>
                                            </select>
                                        </label>
                                        <label class="h3-check-chip h3-check-chip-compact">
                                            <input type="checkbox" v-model="h3OnlySignificant" @change="onH3DecisionSettingsChange">
                                            仅结构网格
                                        </label>
                                    </div>
                                    <div v-if="h3MainStage === 'analysis' && h3SubTab === 'metric_map' && h3AnalysisSummary"
                                        style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                        <div class="count-badge">POI总数 {{ h3AnalysisSummary.poi_count }}</div>
                                        <div class="count-badge">平均密度 {{ h3AnalysisSummary.avg_density_poi_per_km2.toFixed(2) }}</div>
                                        <div class="count-badge">平均熵 {{ h3AnalysisSummary.avg_local_entropy.toFixed(3) }}</div>
                                        <div class="count-badge">网格数 {{ h3AnalysisSummary.grid_count ?? h3GridCount }}</div>
                                        <div class="count-badge">Gi*有效格 {{ (h3AnalysisSummary.gi_z_stats && h3AnalysisSummary.gi_z_stats.count) ?? 0 }}</div>
                                        <div class="count-badge">LISA有效格 {{ (h3AnalysisSummary.lisa_i_stats && h3AnalysisSummary.lisa_i_stats.count) ?? 0 }}</div>
                                    </div>
                                    <div v-if="h3MainStage === 'analysis' && h3SubTab === 'metric_map' && h3AnalysisSummary" class="h3-analysis-hint">
                                        看密度、混合度和邻域差值，优先找“高密且邻域为正”的连续片区。
                                    </div>
                                    <div v-if="h3MainStage !== 'params' && h3Legend && h3Legend.items && h3Legend.items.length"
                                        style="margin-top:10px; border:1px solid #eef1f4; border-radius:8px; padding:8px 10px; background:#fafbfc;">
                                        <div style="font-size:12px; color:#374151; font-weight:600; margin-bottom:6px;">
                                            {{ h3Legend.title }}
                                            <span style="color:#6b7280; font-weight:400;">
                                                {{ h3Legend.unit ? \`（\${h3Legend.unit}）\` : '' }}
                                            </span>
                                        </div>
                                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px 10px;">
                                            <div v-for="(item, idx) in h3Legend.items" :key="\`legend-\${idx}\`"
                                                style="display:flex; align-items:center; gap:6px; font-size:11px; color:#4b5563;">
                                                <span :style="{display:'inline-block', width:'12px', height:'12px', borderRadius:'2px', background:item.color, border:'1px solid #d1d5db'}"></span>
                                                <span>{{ item.label }}</span>
                                            </div>
                                        </div>
                                        <div v-if="h3Legend.noDataLabel"
                                            style="margin-top:6px; font-size:11px; color:#6b7280; display:flex; align-items:center; gap:6px;">
                                            <span :style="{display:'inline-block', width:'12px', height:'12px', borderRadius:'2px', background:h3Legend.noDataColor || '#d1d5db', border:'1px solid #d1d5db'}"></span>
                                            <span>{{ h3Legend.noDataLabel }}</span>
                                        </div>
                                    </div>
                                    <div v-if="h3MainStage === 'analysis' && h3SubTab === 'metric_map' && h3AnalysisSummary" style="margin-top:10px;">
                                        <div id="h3CategoryChart" style="height:180px;"></div>
                                        <div id="h3DensityChart" style="height:180px; margin-top:8px;"></div>
                                    </div>
                                    <div v-if="h3MainStage === 'analysis' && h3SubTab === 'structure_map' && h3DerivedStats.structureSummary" style="margin-top:10px;">
                                        <div class="h3-analysis-hint">
                                            结构图口径：仅使用 ArcGIS 连续字段。Gi* 使用 GiZScore；LISA 使用 LMiIndex；网格边框统一蓝色。
                                        </div>
                                        <div v-if="h3AnalysisSummary"
                                            style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                            <div class="count-badge">莫兰指数 {{ h3AnalysisSummary.global_moran_i_density ?? 'N/A' }}</div>
                                            <div class="count-badge">莫兰z值 {{ h3AnalysisSummary.global_moran_z_score ?? 'N/A' }}</div>
                                            <div v-if="h3StructureFillMode === 'gi_z'" class="count-badge">
                                                Gi*有效格 {{ (h3AnalysisSummary.gi_z_stats && h3AnalysisSummary.gi_z_stats.count) ?? 0 }}
                                            </div>
                                            <div v-else class="count-badge">
                                                LISA有效格 {{ (h3AnalysisSummary.lisa_i_stats && h3AnalysisSummary.lisa_i_stats.count) ?? 0 }}
                                            </div>
                                            <div class="count-badge">引擎 {{ (h3AnalysisSummary.analysis_engine || 'pysal').toUpperCase() }}</div>
                                        </div>
                                        <div v-if="h3DerivedStats.structureSummary.lisaRenderMeta && h3DerivedStats.structureSummary.lisaRenderMeta.degraded"
                                            class="h3-analysis-hint" style="margin-top:8px;">
                                            {{ h3DerivedStats.structureSummary.lisaRenderMeta.message || 'LMiIndex方差不足' }}
                                        </div>
                                        <div v-if="h3AnalysisSummary && h3AnalysisSummary.arcgis_status"
                                            class="h3-analysis-hint" style="margin-top:8px;">
                                            {{ h3AnalysisSummary.arcgis_status }}
                                        </div>
                                        <div v-if="h3AnalysisSummary" style="margin-top:8px; display:flex; justify-content:flex-end;">
                                            <button
                                                type="button"
                                                class="btn-outline btn-compact"
                                                :disabled="isComputingH3Analysis || isGeneratingH3ArcgisSnapshot"
                                                @click="generateH3ArcgisSnapshot">
                                                {{ isGeneratingH3ArcgisSnapshot ? '生成快照中...' : '生成结构快照' }}
                                            </button>
                                        </div>
                                        <div v-if="h3AnalysisSummary && !getArcgisSnapshotUrl()"
                                            class="h3-analysis-hint" style="margin-top:8px;">
                                            当前未生成结构快照，可点击“生成结构快照”按需生成。
                                        </div>
                                        <div v-if="h3AnalysisSummary && getArcgisSnapshotUrl()"
                                            style="margin-top:10px; border:1px solid #eef1f4; border-radius:10px; padding:8px; background:#fafbfc;">
                                            <div style="font-size:12px; color:#374151; font-weight:600; margin-bottom:6px;">
                                                {{ getArcgisSnapshotTitle() }}
                                            </div>
                                            <img :src="getArcgisSnapshotSrc()"
                                                @load="h3ArcgisSnapshotLoadError = false"
                                                @error="h3ArcgisSnapshotLoadError = true"
                                                alt="ArcGIS结构图"
                                                style="width:100%; border-radius:8px; border:1px solid #dbe2ea;" />
                                            <div v-if="h3ArcgisSnapshotLoadError" class="h3-analysis-hint" style="margin-top:8px;">
                                                ArcGIS结构快照加载失败，请重算一次或切换结构图层后重试。
                                            </div>
                                        </div>
                                        <div class="h3-decision-cards">
                                            <div class="h3-decision-card">
                                                <div class="label">Gi* 均值</div>
                                                <div class="value">{{ h3DerivedStats.structureSummary.giZStats.mean === null ? '-' : h3DerivedStats.structureSummary.giZStats.mean.toFixed(2) }}</div>
                                            </div>
                                            <div class="h3-decision-card">
                                                <div class="label">Gi* 中位数</div>
                                                <div class="value">{{ h3DerivedStats.structureSummary.giZStats.p50 === null ? '-' : h3DerivedStats.structureSummary.giZStats.p50.toFixed(2) }}</div>
                                            </div>
                                            <div class="h3-decision-card">
                                                <div class="label">LISA 正值占比</div>
                                                <div class="value">{{ h3DerivedStats.structureSummary.lisaPositivePct === null ? '-' : \`\${(h3DerivedStats.structureSummary.lisaPositivePct * 100).toFixed(1)}%\` }}</div>
                                            </div>
                                            <div class="h3-decision-card">
                                                <div class="label">LISA 负值占比</div>
                                                <div class="value">{{ h3DerivedStats.structureSummary.lisaNegativePct === null ? '-' : \`\${(h3DerivedStats.structureSummary.lisaNegativePct * 100).toFixed(1)}%\` }}</div>
                                            </div>
                                        </div>
                                        <div id="h3StructureChart" style="height:180px;"></div>
                                        <table class="h3-mini-table" style="margin-top:8px;">
                                            <thead>
                                                <tr>
                                                    <th>H3</th><th>Gi*z</th><th>LISA I</th><th>结构信号</th><th>密度</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="row in h3DerivedStats.structureSummary.rows.slice(0, h3DecisionTopN)"
                                                    :key="\`structure-\${row.h3_id}\`"
                                                    :class="{ 'h3-row-active': row.h3_id === selectedH3Id }">
                                                    <td>
                                                        <button type="button" class="h3-id-btn" :title="row.h3_id"
                                                            @click="focusGridByH3Id(row.h3_id)">
                                                            {{ shortH3Id(row.h3_id) }}
                                                        </button>
                                                    </td>
                                                    <td>{{ row.gi_star_z_score === null ? '-' : row.gi_star_z_score.toFixed(2) }}</td>
                                                    <td>{{ row.lisa_i === null ? '-' : row.lisa_i.toFixed(2) }}</td>
                                                    <td>{{ Number.isFinite(row.structure_signal) ? row.structure_signal.toFixed(2) : '-' }}</td>
                                                    <td>{{ row.density === null ? '-' : row.density.toFixed(2) }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div v-if="h3MainStage === 'diagnosis' && h3SubTab === 'typing' && h3DerivedStats.typingSummary" style="margin-top:10px;">
                                        <div class="h3-analysis-hint">
                                            看四象限结构：高密高混合偏成熟，高密低混合偏单核，低密高混合偏潜力，低密低混合偏薄弱；同时参考可信度。
                                        </div>
                                        <div class="h3-decision-cards">
                                            <div class="h3-decision-card">
                                                <div class="label">机会网格数</div>
                                                <div class="value">{{ h3DerivedStats.typingSummary.opportunityCount }}</div>
                                            </div>
                                            <div class="h3-decision-card">
                                                <div class="label">最高密度</div>
                                                <div class="value">{{ h3DerivedStats.typingSummary.maxDensity.toFixed(2) }}</div>
                                            </div>
                                            <div class="h3-decision-card">
                                                <div class="label">建议动作</div>
                                                <div class="value small">{{ h3DerivedStats.typingSummary.recommendation }}</div>
                                            </div>
                                        </div>
                                        <table class="h3-mini-table">
                                            <thead>
                                                <tr>
                                                    <th>H3</th><th>POI</th><th>密度</th><th>熵</th><th>可信度</th><th>分型</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="row in h3DerivedStats.typingSummary.rows.slice(0, h3DecisionTopN)"
                                                    :key="\`typing-\${row.h3_id}\`"
                                                    :class="{ 'h3-row-active': row.h3_id === selectedH3Id }">
                                                    <td>
                                                        <button type="button" class="h3-id-btn" :title="row.h3_id"
                                                            @click="focusGridByH3Id(row.h3_id)">
                                                            {{ shortH3Id(row.h3_id) }}
                                                        </button>
                                                    </td>
                                                    <td>{{ row.poi_count }}</td>
                                                    <td>{{ row.density.toFixed(2) }}</td>
                                                    <td>{{ row.entropy_norm === null ? '-' : row.entropy_norm.toFixed(2) }}</td>
                                                    <td>{{ (row.confidence && row.confidence.label) || '低' }}</td>
                                                    <td>{{ row.type_label }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div v-if="h3MainStage === 'diagnosis' && h3SubTab === 'lq' && h3DerivedStats.lqSummary" style="margin-top:10px;">
                                        <div class="h3-analysis-hint">
                                            看目标业态相对本分析区是否更强：大于1偏强，小于1偏弱；已做小样本平滑。
                                        </div>
                                        <div class="h3-decision-cards">
                                            <div class="h3-decision-card">
                                                <div class="label">优势网格数</div>
                                                <div class="value">{{ h3DerivedStats.lqSummary.opportunityCount }}</div>
                                            </div>
                                            <div class="h3-decision-card">
                                                <div class="label">最高优势值</div>
                                                <div class="value">{{ h3DerivedStats.lqSummary.maxLq.toFixed(2) }}</div>
                                            </div>
                                            <div class="h3-decision-card">
                                                <div class="label">建议业态</div>
                                                <div class="value small">{{ h3DerivedStats.lqSummary.recommendation }}</div>
                                            </div>
                                        </div>
                                        <div id="h3LqChart" style="height:180px;"></div>
                                        <table class="h3-mini-table" style="margin-top:8px;">
                                            <thead>
                                                <tr>
                                                    <th>H3</th><th>POI</th><th>密度</th><th>熵</th><th>可信度</th><th>结构参考</th><th>优势值</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="row in h3DerivedStats.lqSummary.rows.slice(0, h3DecisionTopN)"
                                                    :key="\`lq-\${row.h3_id}\`"
                                                    :class="{ 'h3-row-active': row.h3_id === selectedH3Id }">
                                                    <td>
                                                        <button type="button" class="h3-id-btn" :title="row.h3_id"
                                                            @click="focusGridByH3Id(row.h3_id)">
                                                            {{ shortH3Id(row.h3_id) }}
                                                        </button>
                                                    </td>
                                                    <td>{{ row.poi_count }}</td>
                                                    <td>{{ row.density.toFixed(2) }}</td>
                                                    <td>{{ row.entropy_norm === null ? '-' : row.entropy_norm.toFixed(2) }}</td>
                                                    <td>{{ (row.confidence && row.confidence.label) || '低' }}</td>
                                                    <td>{{ Number.isFinite(row.structure_signal) ? row.structure_signal.toFixed(2) : '-' }}</td>
                                                    <td>{{ row.lq_target === null ? '-' : row.lq_target.toFixed(2) }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div v-if="h3MainStage === 'evaluate' && h3SubTab === 'gap' && h3DerivedStats.gapSummary" style="margin-top:10px;">
                                        <div class="h3-analysis-hint">
                                            先看“需求分位”和“供给分位”，再看两者差值；需求高且供给低的网格优先补位。
                                        </div>
                                        <div v-if="h3DerivedStats.gapSummary.mappingWarning" class="panel-placeholder"
                                            style="margin-top:8px; border-color:#fde68a; background:#fffbeb; color:#92400e;">
                                            {{ h3DerivedStats.gapSummary.mappingWarning }}
                                        </div>
                                        <div class="h3-decision-cards">
                                            <div class="h3-decision-card">
                                                <div class="label">高缺口网格</div>
                                                <div class="value">{{ h3DerivedStats.gapSummary.opportunityCount }}</div>
                                            </div>
                                            <div class="h3-decision-card">
                                                <div class="label">最高缺口分</div>
                                                <div class="value">{{ h3DerivedStats.gapSummary.maxGap.toFixed(2) }}</div>
                                            </div>
                                            <div class="h3-decision-card">
                                                <div class="label">建议优先区</div>
                                                <div class="value small">{{ h3DerivedStats.gapSummary.recommendation }}</div>
                                            </div>
                                        </div>
                                        <div class="panel-placeholder" style="margin-top:8px;">
                                            {{ h3DerivedStats.gapSummary.insight || '缺口分 = 需求百分位 - 目标业态供给百分位（越高越可能供给偏弱）' }}
                                        </div>
                                        <div id="h3GapChart" style="height:180px; margin-top:8px;"></div>
                                        <table class="h3-mini-table" style="margin-top:8px;">
                                            <thead>
                                                <tr>
                                                    <th>H3</th><th>需求分位</th><th>供给分位</th><th>缺口分</th><th>可信度</th><th>结论</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="row in h3DerivedStats.gapSummary.rows.slice(0, h3DecisionTopN)"
                                                    :key="\`gap-\${row.h3_id}\`"
                                                    :class="{ 'h3-row-active': row.h3_id === selectedH3Id }">
                                                    <td>
                                                        <button type="button" class="h3-id-btn" :title="row.h3_id"
                                                            @click="focusGridByH3Id(row.h3_id)">
                                                            {{ shortH3Id(row.h3_id) }}
                                                        </button>
                                                    </td>
                                                    <td>{{ Math.round((row.demand_pct || 0) * 100) }}</td>
                                                    <td>{{ Math.round((row.supply_pct || 0) * 100) }}</td>
                                                    <td>{{ row.gap_score === null ? '-' : row.gap_score.toFixed(2) }}</td>
                                                    <td>{{ (row.confidence && row.confidence.label) || '低' }}</td>
                                                    <td>{{ row.gap_zone_label || '-' }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div v-if="h3GridStatus" class="status-text"
                                        style="margin-top:10px; display:flex; align-items:center; gap:8px; justify-content:flex-start;">
                                        <span>{{ h3GridStatus }}</span>
                                        <button v-if="selectedH3Id" type="button"
                                            style="border:1px solid #d9dee7; background:#fff; color:#4b5563; border-radius:999px; padding:2px 8px; font-size:11px; cursor:pointer;"
                                            @click="clearGridLock">
                                            取消锁定
                                        </button>
                                    </div>
                                </div>

                                <div class="panel" v-show="activeStep3Panel === 'syntax'">
                                    <h4>路网分析</h4>
                                    <div class="h3-subtabs" style="margin-top:8px;">
                                        <button type="button"
                                            class="h3-subtab-pill"
                                            v-for="tab in roadSyntaxTabs"
                                            :key="\`road-syntax-tab-\${tab.value}\`"
                                            :class="{ active: roadSyntaxMainTab === tab.value }"
                                            :disabled="tab.value !== 'params' && !canActivateRoadSyntaxTab(tab.value)"
                                            @click="setRoadSyntaxMainTab(tab.value)">
                                            {{ tab.label }}
                                        </button>
                                    </div>

                                    <div v-if="roadSyntaxMainTab === 'params'" class="h3-params-card" style="margin-top:10px;">
                                        <div class="h3-params-grid">
                                            <label class="h3-params-field">
                                                <span class="h3-params-label">指标预设</span>
                                                <select v-model="roadSyntaxLastMetricTab" class="h3-params-select">
                                                    <option v-for="tab in roadSyntaxMetricTabs()" :key="\`road-syntax-pref-\${tab.value}\`" :value="tab.value">
                                                        {{ tab.label }}
                                                    </option>
                                                </select>
                                            </label>
                                            <label class="h3-params-field">
                                                <span class="h3-params-label">图模型</span>
                                                <select v-model="roadSyntaxGraphModel" class="h3-params-select">
                                                    <option value="segment">线段图（Segment）</option>
                                                    <option value="axial">轴线图（Axial）</option>
                                                </select>
                                            </label>
                                            <label class="h3-params-field">
                                                <span class="h3-params-label">官方色带</span>
                                                <select v-model="roadSyntaxDepthmapColorScale" class="h3-params-select">
                                                    <option v-for="opt in roadSyntaxDepthmapColorScaleOptions()"
                                                        :key="\`road-syntax-color-scale-\${opt.value}\`"
                                                        :value="opt.value">
                                                        {{ opt.label }}
                                                    </option>
                                                </select>
                                            </label>
                                            <label class="h3-params-field">
                                                <span class="h3-params-label">Blue 阈值</span>
                                                <input
                                                    v-model.number="roadSyntaxDisplayBlue"
                                                    type="number"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    class="h3-params-select"
                                                    @change="onRoadSyntaxDisplayRangeChange">
                                            </label>
                                            <label class="h3-params-field">
                                                <span class="h3-params-label">Red 阈值</span>
                                                <input
                                                    v-model.number="roadSyntaxDisplayRed"
                                                    type="number"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    class="h3-params-select"
                                                    @change="onRoadSyntaxDisplayRangeChange">
                                            </label>
                                        </div>
                                        <div class="h3-params-chips">
                                            <span class="count-badge">渲染档位 {{ roadSyntaxPerformanceProfile }}</span>
                                            <span class="count-badge">边段上限 {{ roadSyntaxActiveEdgeCap == null ? '无限制' : roadSyntaxActiveEdgeCap }}</span>
                                        </div>
                                        <div class="h3-params-actions">
                                            <button class="h3-btn h3-btn-primary h3-params-compute-btn"
                                                :disabled="isComputingRoadSyntax || !lastIsochroneGeoJSON"
                                                @click="computeRoadSyntax">
                                                {{ isComputingRoadSyntax ? '计算中...' : '计算路网指标' }}
                                            </button>
                                        </div>
                                    </div>

                                    <div v-else style="margin-top:10px;">
                                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                            <label v-if="roadSyntaxMetric !== 'intelligibility'" style="display:flex; align-items:center; gap:6px; font-size:12px; color:#666;">
                                                色带
                                                <select v-model="roadSyntaxDepthmapColorScale" @change="refreshRoadSyntaxOverlay"
                                                    style="padding:4px 6px; border:1px solid #ddd; border-radius:6px; font-size:12px;">
                                                    <option v-for="opt in roadSyntaxDepthmapColorScaleOptions()"
                                                        :key="\`road-syntax-color-scale-inline-\${opt.value}\`"
                                                        :value="opt.value">
                                                        {{ opt.label }}
                                                    </option>
                                                </select>
                                            </label>
                                            <label v-if="roadSyntaxMetric !== 'intelligibility'" style="display:flex; align-items:center; gap:6px; font-size:12px; color:#666;">
                                                Blue
                                                <input
                                                    v-model.number="roadSyntaxDisplayBlue"
                                                    type="number"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    @change="onRoadSyntaxDisplayRangeChange"
                                                    style="width:64px; padding:4px 6px; border:1px solid #ddd; border-radius:6px; font-size:12px;">
                                            </label>
                                            <label v-if="roadSyntaxMetric !== 'intelligibility'" style="display:flex; align-items:center; gap:6px; font-size:12px; color:#666;">
                                                Red
                                                <input
                                                    v-model.number="roadSyntaxDisplayRed"
                                                    type="number"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    @change="onRoadSyntaxDisplayRangeChange"
                                                    style="width:64px; padding:4px 6px; border:1px solid #ddd; border-radius:6px; font-size:12px;">
                                            </label>
                                            <label v-if="roadSyntaxMetricUsesRadius(roadSyntaxMetric)" style="display:flex; align-items:center; gap:6px; font-size:12px; color:#666;">
                                                半径
                                                <div style="display:inline-flex; border:1px solid #d1d5db; border-radius:8px; overflow:hidden;">
                                                    <button
                                                        type="button"
                                                        @click="setRoadSyntaxRadiusLabel('global')"
                                                        :disabled="isComputingRoadSyntax"
                                                        :style="{
                                                            border:'0',
                                                            padding:'4px 10px',
                                                            fontSize:'12px',
                                                            cursor: isComputingRoadSyntax ? 'not-allowed' : 'pointer',
                                                            color: roadSyntaxRadiusLabel === 'global' ? '#fff' : '#374151',
                                                            background: roadSyntaxRadiusLabel === 'global' ? '#2563eb' : '#fff',
                                                            opacity: isComputingRoadSyntax ? 0.45 : 1
                                                        }">等时圈内</button>
                                                    <button
                                                        type="button"
                                                        @click="setRoadSyntaxRadiusLabel('r600')"
                                                        :disabled="isComputingRoadSyntax || !roadSyntaxHasRadiusLabel('r600')"
                                                        :style="{
                                                            border:'0',
                                                            borderLeft:'1px solid #d1d5db',
                                                            padding:'4px 10px',
                                                            fontSize:'12px',
                                                            cursor: (isComputingRoadSyntax || !roadSyntaxHasRadiusLabel('r600')) ? 'not-allowed' : 'pointer',
                                                            color: roadSyntaxRadiusLabel === 'r600' ? '#fff' : '#374151',
                                                            background: roadSyntaxRadiusLabel === 'r600' ? '#2563eb' : '#fff',
                                                            opacity: (isComputingRoadSyntax || !roadSyntaxHasRadiusLabel('r600')) ? 0.45 : 1
                                                        }">600m</button>
                                                    <button
                                                        type="button"
                                                        @click="setRoadSyntaxRadiusLabel('r800')"
                                                        :disabled="isComputingRoadSyntax || !roadSyntaxHasRadiusLabel('r800')"
                                                        :style="{
                                                            border:'0',
                                                            borderLeft:'1px solid #d1d5db',
                                                            padding:'4px 10px',
                                                            fontSize:'12px',
                                                            cursor: (isComputingRoadSyntax || !roadSyntaxHasRadiusLabel('r800')) ? 'not-allowed' : 'pointer',
                                                            color: roadSyntaxRadiusLabel === 'r800' ? '#fff' : '#374151',
                                                            background: roadSyntaxRadiusLabel === 'r800' ? '#2563eb' : '#fff',
                                                            opacity: (isComputingRoadSyntax || !roadSyntaxHasRadiusLabel('r800')) ? 0.45 : 1
                                                        }">800m</button>
                                                </div>
                                            </label>
                                            <label v-if="roadSyntaxSupportsSkeleton(roadSyntaxMetric)" class="h3-check-chip h3-check-chip-compact">
                                                <input type="checkbox"
                                                    v-model="roadSyntaxSkeletonOnly"
                                                    :disabled="!canToggleRoadSyntaxSkeleton()"
                                                    @change="refreshRoadSyntaxOverlay">
                                                骨架优先
                                            </label>
                                            <span class="count-badge">当前指标 {{ roadSyntaxLabelByMetric(roadSyntaxMetric) }}</span>
                                            <span class="count-badge">值 {{ formatRoadSyntaxMetricValue(roadSyntaxMetric) }}</span>
                                            <span v-if="roadSyntaxMetric === 'intelligibility'" class="count-badge">
                                                R² {{ roadSyntaxRegressionView().r2 }}
                                            </span>
                                        </div>

                                        <div v-if="roadSyntaxLegendModel && roadSyntaxLegendModel.items && roadSyntaxLegendModel.items.length"
                                            style="margin-top:10px; border:1px solid #eef1f4; border-radius:8px; padding:8px 10px; background:#fafbfc;">
                                            <div style="font-size:12px; color:#374151; font-weight:600; margin-bottom:6px;">
                                                {{ roadSyntaxLegendModel.title }}
                                            </div>
                                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px 10px;">
                                                <div v-for="(item, idx) in roadSyntaxLegendModel.items"
                                                    :key="\`road-syntax-legend-\${idx}\`"
                                                    style="display:flex; align-items:center; gap:6px; font-size:11px; color:#4b5563;">
                                                    <span :style="{display:'inline-block', width:'12px', height:'12px', borderRadius:'2px', background:item.color, border:'1px solid #d1d5db'}"></span>
                                                    <span>{{ item.label }}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-if="roadSyntaxMainTab === 'intelligibility'" id="roadSyntaxScatterChart"
                                            style="height:220px; margin-top:10px;"></div>
                                    </div>

                                    <div v-if="roadSyntaxSwitchStatsText" class="status-text" style="margin-top:10px;">
                                        {{ roadSyntaxSwitchStatsText }}
                                    </div>
                                    <div v-if="roadSyntaxStatus"
                                        class="status-text"
                                        style="margin-top:10px; display:flex; align-items:center; gap:8px; justify-content:flex-start;">
                                        <span>{{ roadSyntaxStatus }}</span>
                                        <span v-if="isComputingRoadSyntax && Number(roadSyntaxProgressElapsedSec || 0) > 0"
                                            class="count-badge">
                                            {{ \`计时 \${Math.floor(Number(roadSyntaxProgressElapsedSec || 0))}s\` }}
                                        </span>
                                        <span v-if="isComputingRoadSyntax && Number(roadSyntaxProgressStep || 0) > 0 && Number(roadSyntaxProgressTotal || 0) > 0"
                                            class="count-badge">
                                            {{ \`进度 \${roadSyntaxProgressStep}/\${roadSyntaxProgressTotal}\` }}
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div> <!-- End Wizard View Wrapper -->

            </div> <!-- End of sidebar-content -->

            <!-- Fixed History Footer -->
            <!-- Sidebar Footer (Only in Wizard Mode) -->
            <div v-if="sidebarView === 'wizard'" class="sidebar-footer"
                style="padding: 20px; border-top: 1px solid #f0f0f0; background: #fff; display: flex; flex-direction: column; gap: 10px;">
                <button class="btn-outline"
                    style="margin-top:0; border:1px solid #eee; display:flex; justify-content:center; align-items:center;"
                    @click="openHistoryView()">
                    <img src="/static/images/history.svg" class="icon-svg-small" style="margin-right:8px;"> 查看历史记录 ({{
                    historyList.length }})
                </button>
            </div>
        </aside>`,Zt=`

        <!-- Middle: Map -->
        <main class="main-content">
            <div v-if="sidebarView === 'wizard' && step === 3" class="h3-map-toolbar">
                <button type="button" class="h3-map-tool-btn h3-map-save-btn" @click="saveAndRestart" title="保存并开启新分析">
                    <svg class="h3-map-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h10.2l4.3 4.3V18.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5z"></path>
                        <path d="M8 4.5v5h7v-5"></path>
                        <path d="M8 20v-5h8v5"></path>
                    </svg>
                    <span class="h3-map-tool-text">保存并新建</span>
                </button>

                <div class="h3-simplify-wrap">
                    <button type="button" class="h3-map-tool-btn h3-map-simplify-btn"
                        :class="{ active: h3SimplifyMenuOpen }"
                        @click.stop="toggleSimplifyMenu"
                        title="简化配置">
                        <svg class="h3-map-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7h16"></path>
                            <path d="M4 12h16"></path>
                            <path d="M4 17h16"></path>
                        </svg>
                        <span class="h3-map-tool-text">简化</span>
                        <svg class="h3-map-tool-caret" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>
                    <div v-if="h3SimplifyMenuOpen" class="h3-simplify-menu">
                        <label v-for="option in getVisibleSimplifyOptions()" :key="'simplify-' + option.value"
                            class="h3-simplify-check">
                            <input type="checkbox"
                                :checked="h3SimplifyTargets.includes(option.value)"
                                @change="onSimplifyTargetToggle(option.value, $event.target.checked)">
                            <span v-text="option.label"></span>
                        </label>
                    </div>
                </div>

                <div class="h3-export-wrap">
                    <button type="button" class="h3-map-tool-btn h3-map-export-btn"
                        :class="{ active: h3ExportMenuOpen }"
                        @click.stop="toggleH3ExportMenu"
                        title="导出">
                        <svg class="h3-map-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 4v10"></path>
                            <path d="M8.5 10.5 12 14l3.5-3.5"></path>
                            <path d="M5 18h14"></path>
                        </svg>
                        <span class="h3-map-tool-text">导出</span>
                        <svg class="h3-map-tool-caret" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>
                    <div v-if="h3ExportMenuOpen" class="h3-export-menu">
                        <div class="h3-export-head">
                            <div class="h3-export-field-label">导出内容</div>
                            <button
                                type="button"
                                class="h3-export-icon-btn"
                                :class="{ 'is-active': isAllAvailableExportPartsSelected() }"
                                :disabled="isExportingBundle || !getSelectableExportParts().length"
                                :title="isAllAvailableExportPartsSelected() ? '取消全选可导出项' : '一键全选可导出项'"
                                @click="toggleSelectAllExportParts">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <rect x="4" y="5" width="4" height="4" rx="1.2"></rect>
                                    <rect x="4" y="10" width="4" height="4" rx="1.2"></rect>
                                    <rect x="4" y="15" width="4" height="4" rx="1.2"></rect>
                                    <path d="M11 7h8"></path>
                                    <path d="M11 12h8"></path>
                                    <path d="M11 17h8"></path>
                                    <path d="m5.2 12 1.3 1.3 2.1-2.3"></path>
                                    <path d="m5.2 17 1.3 1.3 2.1-2.3"></path>
                                </svg>
                            </button>
                        </div>
                        <div v-for="group in exportBundleGroups" :key="\`bundle-group-\${group.group_key}\`" class="h3-export-group">
                            <div class="h3-export-group-head">
                                <input
                                    type="checkbox"
                                    class="h3-export-group-checkbox"
                                    :checked="isExportBundleGroupAllSelected(group.group_key)"
                                    :indeterminate.prop="isExportBundleGroupPartiallySelected(group.group_key)"
                                    :disabled="isExportingBundle || !getSelectableExportPartsByGroup(group.group_key).length"
                                    @change="toggleExportBundleGroupSelection(group.group_key)">
                                <button
                                    type="button"
                                    class="h3-export-group-title"
                                    @click="toggleExportBundleGroupExpanded(group.group_key)">
                                    <span>{{ group.group_label }}</span>
                                    <svg viewBox="0 0 24 24" aria-hidden="true" :class="{ 'is-open': isExportBundleGroupExpanded(group.group_key) }">
                                        <path d="m6 9 6 6 6-6"></path>
                                    </svg>
                                </button>
                            </div>
                            <div v-if="isExportBundleGroupExpanded(group.group_key)" class="h3-export-group-body">
                                <label v-for="item in group.children" :key="\`bundle-item-\${group.group_key}-\${item.value}\`" class="h3-export-check h3-export-check-child">
                                    <input
                                        type="checkbox"
                                        :value="item.value"
                                        v-model="exportBundleParts"
                                        :disabled="isExportBundlePartDisabled(item.value)"
                                        :title="getExportBundlePartDisabledReason(item.value)">
                                    <span>{{ item.label }}</span>
                                </label>
                            </div>
                        </div>

                        <button type="button" class="h3-export-item"
                            :disabled="isExportingBundle || !exportBundleParts.length"
                            @click="exportAnalysisBundle()">
                            {{ isExportingBundle ? '导出中...' : '导出 ZIP' }}
                        </button>
                    </div>
                </div>

                <div class="h3-task-wrap">
                    <button type="button" class="h3-map-tool-btn h3-map-task-btn"
                        :class="{ active: h3ExportTasksOpen }"
                        @click="toggleH3ExportTasks"
                        title="导出任务">
                        <svg class="h3-map-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="4" y="5" width="16" height="14" rx="2"></rect>
                            <path d="M8 10h8"></path>
                            <path d="M8 14h6"></path>
                        </svg>
                        <span class="h3-map-tool-text">任务</span>
                        <span v-if="getH3PendingTaskCount() > 0" class="h3-task-count">{{ getH3PendingTaskCount() }}</span>
                    </button>
                </div>

                <button
                    type="button"
                    class="h3-map-tool-btn h3-map-debug-btn"
                    :class="{ active: isochroneDebugOpen }"
                    :disabled="isLoadingIsochroneDebug || (!isochroneDebugOpen && !isIsochroneDebugAvailable())"
                    :title="getIsochroneDebugButtonTitle()"
                    @click="toggleIsochroneDebug">
                    <svg class="h3-map-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2.8v4.2"></path>
                        <path d="M12 17v4.2"></path>
                        <path d="M2.8 12H7"></path>
                        <path d="M17 12h4.2"></path>
                        <circle cx="12" cy="12" r="5.2"></circle>
                        <circle cx="12" cy="12" r="1.4"></circle>
                    </svg>
                    <span class="h3-map-tool-text">{{ isLoadingIsochroneDebug ? '调试中...' : '调试' }}</span>
                </button>
            </div>

            <div v-if="sidebarView === 'wizard' && step === 3 && h3ExportTasksOpen" class="h3-export-task-panel">
                <div class="h3-export-task-panel-header">
                    <span>导出任务</span>
                    <button type="button" class="h3-export-task-close" @click="closeH3ExportTasks">关闭</button>
                </div>
                <div v-if="!h3ExportTasks.length" class="h3-export-task-empty">暂无任务</div>
                <template v-else>
                    <div v-for="task in h3ExportTasks" :key="task.id" class="h3-export-task-item">
                        <div class="h3-export-task-row">
                            <div class="h3-export-task-name">{{ task.title }}</div>
                            <span class="h3-export-task-state"
                                :class="{
                                    'is-running': task.status === 'running',
                                    'is-success': task.status === 'success',
                                    'is-failed': task.status === 'failed'
                                }">
                                {{ task.status_label }}
                            </span>
                        </div>
                        <div class="h3-export-task-progress">
                            <div class="h3-export-task-progress-bar" :style="{ width: \`\${Math.max(0, Math.min(100, Number(task.progress_pct || 0)))}%\` }"></div>
                        </div>
                        <div class="h3-export-task-meta">
                            {{ task.scope_label }} · {{ task.created_at_text }}
                        </div>
                        <div v-if="task.progress_label" class="h3-export-task-meta">
                            {{ task.progress_label }}
                        </div>
                        <div v-if="task.filename" class="h3-export-task-meta">
                            文件：{{ task.filename }}
                        </div>
                        <div v-if="task.error" class="h3-export-task-error">{{ task.error }}</div>
                    </div>
                    <div class="h3-export-task-actions">
                        <button type="button" class="h3-export-task-clear" @click="clearH3CompletedTasks">清理已完成</button>
                    </div>
                </template>
            </div>

            <div v-if="sidebarView === 'wizard' && step === 3 && h3Toast.message"
                class="h3-export-toast"
                :class="{
                    'is-success': h3Toast.type === 'success',
                    'is-error': h3Toast.type === 'error',
                    'is-warning': h3Toast.type === 'warning'
                }">
                {{ h3Toast.message }}
            </div>

            <button
                v-if="sidebarView === 'wizard'"
                type="button"
                class="map-recenter-btn"
                title="回到中心"
                aria-label="回到中心"
                :disabled="!mapCore || !mapCore.map"
                @click="goMapBackToCenter">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3.2"></circle>
                    <path d="M12 2.8v3.4"></path>
                    <path d="M12 17.8v3.4"></path>
                    <path d="M2.8 12h3.4"></path>
                    <path d="M17.8 12h3.4"></path>
                </svg>
            </button>

            <div id="tianditu-container" aria-hidden="true"></div>
            <div id="container"></div>
            <div v-if="basemapSource === 'osm'" style="position:absolute; right:8px; bottom:6px; z-index:2; background:rgba(255,255,255,0.9); border:1px solid #e5e7eb; border-radius:6px; padding:2px 6px; font-size:10px; color:#4b5563;">
                © OpenStreetMap contributors
            </div>
            <div v-else-if="basemapSource === 'tianditu'" style="position:absolute; right:8px; bottom:6px; z-index:2; background:rgba(255,255,255,0.9); border:1px solid #e5e7eb; border-radius:6px; padding:2px 6px; font-size:10px; color:#4b5563;">
                © 天地图
            </div>
        </main>`,Qt=`${Yt}${Zt}`,O=Object.freeze({POI:"poi",H3:"h3",H3_SETTINGS:"h3_settings",SYNTAX:"syntax"});function Jt(){return{normalizeStep3PanelId(r=""){const o=String(r||"");return o===O.H3_SETTINGS?O.H3:o},shouldShowPoiOnCurrentPanel(){return String(this.activeStep3Panel||"")===O.POI&&!this.poiSystemSuspendedForSyntax&&String(this.poiSubTab||"category")!=="analysis"},shouldShowPoiKdeOnCurrentPanel(){return String(this.activeStep3Panel||"")===O.POI&&!this.poiSystemSuspendedForSyntax&&String(this.poiSubTab||"")==="analysis"&&!!this.poiKdeEnabled},applyPoiFilterPanel(r=""){const o=this.filterPanel;if(!o||typeof o.applyFilters!="function")return Promise.resolve({ok:!1,skipped:!0,reason:"filter_panel_unavailable:"+String(r||"")});try{const l=o.applyFilters();return l&&typeof l.then=="function"?l:Promise.resolve({ok:!0,reason:"filter_panel_sync:"+String(r||"")})}catch(l){return Promise.resolve({ok:!1,reason:"filter_panel_exception:"+String(r||""),error:l&&l.message?l.message:String(l)})}},applySimplifyPointVisibility(){const r=this.shouldShowPoiOnCurrentPanel();typeof this.applyPoiVisualState=="function"&&this.applyPoiVisualState({shouldShowPoi:r}),!this.markerManager&&r&&Array.isArray(this.allPoisDetails)&&this.allPoisDetails.length>0&&this.rebuildPoiRuntimeSystem(this.allPoisDetails)},selectStep3Panel(r){if(this.isDraggingNav)return;const o=this.normalizeStep3PanelId(r);if(o===O.SYNTAX&&!this.roadSyntaxModulesReady){this.roadSyntaxSetStatus("路网模块未完整加载："+(this.roadSyntaxModuleMissing||[]).join(", "));return}if(!this.isStep3PanelVisible(o))return;const l=this.activeStep3Panel;if(this.activeStep3Panel=o,l===O.SYNTAX&&o!==O.SYNTAX&&this.suspendRoadSyntaxDisplay(),o!==O.H3&&(this.h3ExportMenuOpen=!1,this.h3ExportTasksOpen=!1),o===O.POI){this.applySimplifyPointVisibility(),this.$nextTick(()=>{String(this.poiSubTab||"category")==="analysis"?this.refreshPoiKdeOverlay():(this.updatePoiCharts(),setTimeout(()=>this.resizePoiChart(),0))});return}if(o===O.H3){this.syncH3PoiFilterSelection(!1),this.ensureH3PanelEntryState(),this.restoreH3GridDisplayOnEnter(),this.$nextTick(()=>{typeof this.updateH3Charts=="function"&&this.updateH3Charts(),typeof this.updateDecisionCards=="function"&&this.updateDecisionCards()}),this.applySimplifyPointVisibility();return}o===O.SYNTAX&&(this.setRoadSyntaxMainTab("params",{refresh:!1,syncMetric:!1}),this.resumeRoadSyntaxDisplay()),this.applySimplifyPointVisibility()},suspendPoiSystemForSyntax(){this.poiSystemSuspendedForSyntax||(this.clearPoiOverlayLayers({reason:"suspend_for_syntax",clearManager:!0,clearSimpleMarkers:!0,resetFilterPanel:!0,immediate:!0}),this.poiSystemSuspendedForSyntax=!0)},resumePoiSystemAfterSyntax(){this.poiSystemSuspendedForSyntax&&(this.poiSystemSuspendedForSyntax=!1,!this.markerManager&&Array.isArray(this.allPoisDetails)&&this.allPoisDetails.length&&this.rebuildPoiRuntimeSystem(this.allPoisDetails))},onStep3DragStart(r,o){this.dragIndex=r,this.dragOverIndex=r,this.dragInsertPosition="before",this.isDraggingNav=!0,o&&o.dataTransfer&&(o.dataTransfer.effectAllowed="move")},onStep3DragOver(r,o){o&&o.preventDefault(),this.dragOverIndex=r;const l=o.currentTarget.getBoundingClientRect(),h=l.top+l.height/2;this.dragInsertPosition=o.clientY<h?"before":"after"},onStep3Drop(r){if(this.dragIndex===null){this.dragOverIndex=null,this.dragInsertPosition=null;return}const o=this.step3NavItems.slice(),l=o.splice(this.dragIndex,1)[0];let h=r;this.dragInsertPosition==="after"&&(h=r+1),this.dragIndex<h&&(h-=1),o.splice(h,0,l),this.step3NavItems=o,this.dragIndex=null,this.dragOverIndex=null,this.dragInsertPosition=null,this.isDraggingNav=!1},onStep3DragEnd(){this.dragIndex=null,this.dragOverIndex=null,this.dragInsertPosition=null,this.isDraggingNav=!1},goToStep(r){this.confirmNavigation(()=>{r<this.step&&(typeof this.cancelHistoryDetailLoading=="function"&&this.cancelHistoryDetailLoading(),this.step===3&&r<=2&&(this.clearPoiOverlayLayers({reason:"go_to_step_back_to_step2",clearManager:!0,clearSimpleMarkers:!0,resetFilterPanel:!0}),this.resetRoadSyntaxState(),this.poiStatus="",this.clearH3Grid()),this.step>=2&&r<=1&&(typeof this.clearScopePolygonsFromMap=="function"&&this.clearScopePolygonsFromMap(),this.resetRoadSyntaxState(),this.lastIsochroneGeoJSON=null,this.clearH3Grid())),this.step=r})},confirmNavigation(r){this.isFetchingPois?confirm("数据抓取正在进行中，离开将取消未完成的任务。确定要离开吗？")&&(this.cancelFetch(),r()):r()},cancelFetch(){this.abortController&&(this.abortController.abort(),this.abortController=null),this.isFetchingPois=!1,this.poiStatus="任务已取消",this.resetFetchSubtypeProgress()},backToHome(){this.confirmNavigation(()=>{this.destroyPlaceSearch(),this.clearAnalysisLayers(),this.sidebarView="start",this.step=1,this.selectedPoint=null,typeof this.clearCenterMarkerOverlay=="function"&&this.clearCenterMarkerOverlay(),this.errorMessage=""})}}}function Xt(){return{clearAnalysisLayers(){this.abortController&&(this.abortController.abort(),this.abortController=null),this.cancelHistoryDetailLoading(),this.isFetchingPois=!1,this.fetchProgress=0,this.poiStatus="",this.roadSyntaxStatus="",this.resetFetchSubtypeProgress(),this.allPoisDetails=[],this.poiSubTab="category",this.poiAnalysisSubTab="kde",this.poiKdeEnabled=!1,this.poiKdeStats=this.createEmptyPoiKdeStats(),this.scopeSource="",this.drawnScopePolygon=[],this.lastIsochroneGeoJSON=null,this.h3GridStatus="",this.h3GridCount=0,this.h3GridFeatures=[],this.isGeneratingGrid=!1,this.resetH3AnalysisState(),this.clearIsochroneDebugState(),this.clearPoiOverlayLayers({reason:"clear_analysis_layers",clearManager:!0,clearSimpleMarkers:!0,resetFilterPanel:!0}),this.clearPoiKdeOverlay(),this.resetRoadSyntaxState(),this.mapCore&&(this.mapCore.clearGridPolygons&&this.mapCore.clearGridPolygons(),this.mapCore.setRadius(0)),this.clearScopeOutlineDisplay(),this.stopScopeDrawing(),this.disposePoiChart()},resetAnalysis(){this.destroyPlaceSearch(),this.step=1,this.isochroneScopeMode="point",this.h3SimplifyMenuOpen=!1,this.h3SimplifyTargets=[],this.clearIsochroneDebugState(),this.sidebarView="wizard",this.selectedPoint=null,this.errorMessage="",this.marker&&(this.safeMapSet(this.marker,null),this.marker=null),this.clearAnalysisLayers(),this.mapCore&&this.mapCore.map&&this.mapCore.map.setFitView(),this.applySimplifyConfig()},saveAndRestart(){this.destroyPlaceSearch(),this.stopScopeDrawing(),this.cancelHistoryDetailLoading(),this.clearIsochroneDebugState(),this.step=1,this.activeStep3Panel="poi",this.isochroneScopeMode="point",this.h3SimplifyMenuOpen=!1,this.h3SimplifyTargets=[],this.poiSystemSuspendedForSyntax=!1,this.selectedPoint=null,this.errorMessage="",this.poiStatus="",this.allPoisDetails=[],this.poiSubTab="category",this.poiAnalysisSubTab="kde",this.poiKdeEnabled=!1,this.poiKdeStats=this.createEmptyPoiKdeStats(),this.resultDataSource=this.normalizePoiSource(this.poiDataSource,"local"),this.scopeSource="",this.drawnScopePolygon=[],this.lastIsochroneGeoJSON=null,this.h3ExportMenuOpen=!1,this.h3ToastTimer&&(clearTimeout(this.h3ToastTimer),this.h3ToastTimer=null),this.h3Toast={message:"",type:"info"},this.clearPoiOverlayLayers({reason:"save_and_restart",clearManager:!0,clearSimpleMarkers:!0,clearCenterMarker:!0,resetFilterPanel:!0}),this.clearPoiKdeOverlay(),this.clearH3Grid(),this.clearScopeOutlineDisplay(),this.disposePoiChart(),this.applySimplifyConfig()}}}function te(r,o=[]){return(Array.isArray(o)?o:[]).reduce((l,h)=>{const c=String(h||"").trim();return c&&(l[c]={get(){return r[c]},set(g){r[c]=g}}),l},{})}function ee(r=[]){return(Array.isArray(r)?r:[]).reduce((o,l)=>{if(!l||typeof l!="object")return o;const h=l.store,c=l.fieldKeys;return h?Object.assign(o,te(h,c)):o},{})}function ae(){return{clearScopePolygonsFromMap(){this.mapCore&&typeof this.mapCore.clearCustomPolygons=="function"&&this.mapCore.clearCustomPolygons()},clearCenterMarkerOverlay(){this.marker&&(this.safeMapSet(this.marker,null),this.marker=null)},applyPoiVisualState(r={}){const o=!!r.shouldShowPoi,l=!o;if(this.markerManager&&typeof this.markerManager.setHideAllPoints=="function"&&(this.pointLayersSuspendedForSyntax=!o,l&&typeof this.markerManager.destroyClusterers=="function"&&this.markerManager.destroyClusterers({immediate:!0}),typeof this.markerManager.setShowMarkers=="function"&&this.markerManager.setShowMarkers(o),this.markerManager.setHideAllPoints(l),this.applyPoiFilterPanel("simplify_visibility")),this.marker&&(l?this.safeMapSet(this.marker,null):this.selectedPoint&&this.mapCore&&this.mapCore.map&&this.safeMapSet(this.marker,this.mapCore.map)),Array.isArray(this.poiMarkers)&&this.poiMarkers.length>0){const h=this.poiMarkers.slice();this.poiMarkers=[],this.enqueuePoiMapWrite(()=>(h.forEach(c=>this.safeMapSet(c,null)),{ok:!0,hidden:h.length}),{key:"clear_stale_simple_markers",replaceExisting:!0,meta:{reason:"clear_stale_simple_markers",marker_count:h.length}})}}}}function ne(){return{attachAmapRuntimeErrorProbe(){if(this.amapRuntimeErrorListener||this.amapRuntimeRejectionListener)return;const r=(l={})=>{const h=this.markerManager,c=h&&h.typeClusterers&&typeof h.typeClusterers=="object"?Object.keys(h.typeClusterers).length:0,g=h&&Array.isArray(h.markers)?h.markers.length:0;return Object.assign({step:Number(this.step||0),panel:String(this.activeStep3Panel||""),poi_suspended_for_syntax:!!this.poiSystemSuspendedForSyntax,marker_manager_alive:!!h,marker_count:g,clusterer_count:c,road_active_layer:String(this.roadSyntaxActiveLayerKey||""),road_switch_in_progress:!!this.roadSyntaxSwitchInProgress,road_pool_ready:!!this.roadSyntaxPoolReady,road_map_write_queue_pending:Number(this.roadSyntaxMapWriteQueuePending||0)},l||{})},o=(l="",h="")=>{const c=String(l||"");return String(h||"").indexOf("maps?v=")>=0||c.indexOf("split")>=0||c.indexOf("Ud")>=0||c.indexOf("Pixel(NaN")>=0};this.amapRuntimeErrorListener=l=>{const h=l&&l.message?String(l.message):"",c=l&&l.filename?String(l.filename):"";o(h,c)&&console.error("[diag] amap runtime error",r({message:h,filename:c,lineno:Number(l&&l.lineno||0),colno:Number(l&&l.colno||0)}))},this.amapRuntimeRejectionListener=l=>{const h=l&&l.reason||"",c=h&&h.message?String(h.message):String(h||"");o(c,"")&&console.error("[diag] amap runtime rejection",r({reason:c}))},window.addEventListener("error",this.amapRuntimeErrorListener),window.addEventListener("unhandledrejection",this.amapRuntimeRejectionListener)},detachAmapRuntimeErrorProbe(){this.amapRuntimeErrorListener&&window.removeEventListener("error",this.amapRuntimeErrorListener),this.amapRuntimeRejectionListener&&window.removeEventListener("unhandledrejection",this.amapRuntimeRejectionListener),this.amapRuntimeErrorListener=null,this.amapRuntimeRejectionListener=null},async onBasemapSourceChange(){let o=["amap","osm","tianditu"].includes(this.basemapSource)?this.basemapSource:"amap";if(o==="tianditu"?await this.validateTiandituSource()||(this.tdtDiagCopyStatus=""):(this.tdtDiag=null,this.tdtDiagCopyStatus="",this.errorMessage&&this.errorMessage.indexOf("天地图")>=0&&(this.errorMessage="")),this.basemapSource=o,this.mapCore&&this.mapCore.setBasemapSource){const l=this.mapCore.setBasemapSource(o);o==="tianditu"&&l&&l.ok===!1?(this.tdtDiag={ok:!1,phase:"map-init",status:null,contentType:"",bodySnippet:l.message||"",reason:l.code||"wmts-layer-init-failed"},this.errorMessage="天地图 WMTS 图层初始化失败，请检查：Key 类型=Web JS，白名单包含 localhost/127.0.0.1（及端口）。"):o==="tianditu"&&l&&l.ok===!0&&this.errorMessage&&this.errorMessage.indexOf("天地图")>=0&&(this.errorMessage="")}this.applySimplifyConfig()},_toNumber(r,o=0){const l=Number(r);return Number.isFinite(l)?l:o},loadAMapScript(r,o){return new Promise((l,h)=>{if(window.AMap&&window.AMap.Map){l();return}window._AMapSecurityConfig={securityJsCode:o};const c=document.createElement("script");c.src=`https://webapi.amap.com/maps?v=1.4.15&key=${r}`,c.onload=l,c.onerror=h,document.head.appendChild(c)})},async probeTiandituTile(r=4500){const o=(this.config&&this.config.tianditu_key?String(this.config.tianditu_key):"").trim();if(!o)return{ok:!1,phase:"wmts-probe",status:null,contentType:"",bodySnippet:"",reason:"missing-key",url:""};const l=`https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=7&TILEROW=53&TILECOL=107&tk=${encodeURIComponent(o)}&_ts=${Date.now()}`,h=new AbortController,c=window.setTimeout(()=>h.abort(),r);try{const g=await fetch(l,{method:"GET",cache:"no-store",signal:h.signal}),M=String(g.headers.get("content-type")||"").toLowerCase(),b=this.isImageContentType(M);let w="";if(!b)try{w=this._trimText(await g.text(),300)}catch{w=""}const N=g.status,C=g.ok&&b;let D="ok";return C||(N===418?D="http-418":N>=500?D="http-5xx":N>=400?D="http-4xx":g.ok?D="non-image-response":D="http-error"),{ok:C,phase:"wmts-probe",status:N,contentType:M,bodySnippet:w,reason:D,url:l}}catch(g){return g&&g.name==="AbortError"?{ok:!1,phase:"wmts-probe",status:null,contentType:"",bodySnippet:"",reason:"timeout",url:l}:{ok:!1,phase:"wmts-probe",status:null,contentType:"",bodySnippet:this._trimText(g&&g.message?g.message:String(g),300),reason:"network-error",url:l}}finally{window.clearTimeout(c)}},async validateTiandituSource(){const r=await this.probeTiandituTile();return this.tdtDiag=r,this.tdtDiagCopyStatus="",r.ok?(this.errorMessage&&this.errorMessage.indexOf("天地图")>=0&&(this.errorMessage=""),!0):(r.reason==="missing-key"?this.errorMessage="未配置天地图 Key（TIANDITU_KEY）。":r.reason==="timeout"?this.errorMessage="天地图 WMTS 探测超时，请稍后重试（配置修改可能需要 5-10 分钟生效）。":r.reason==="http-418"?this.errorMessage="天地图 WMTS 探测被拦截（HTTP 418），请检查 Key 类型=Web JS，白名单包含 localhost/127.0.0.1（及端口）。":this.errorMessage=`天地图 WMTS 探测失败（${r.status||"NO_STATUS"}），请检查 Key 与白名单。`,!1)},isImageContentType(r){const o=String(r||"").toLowerCase();return o.indexOf("image/")>=0||o.indexOf("application/octet-stream")>=0},_trimText(r,o=300){const l=String(r||"");return l.length<=o?l:l.slice(0,o)+"..."},buildTdtDiagText(){if(!this.tdtDiag)return"";const r=[`ok=${this.tdtDiag.ok}`,`phase=${this.tdtDiag.phase||"-"}`,`reason=${this.tdtDiag.reason||"-"}`,`status=${this.tdtDiag.status===null||this.tdtDiag.status===void 0?"-":this.tdtDiag.status}`,`contentType=${this.tdtDiag.contentType||"-"}`];return this.tdtDiag.url&&r.push(`url=${this.tdtDiag.url}`),this.tdtDiag.bodySnippet&&r.push(`body=${this.tdtDiag.bodySnippet}`),r.join(`
`)},async copyTdtDiag(){const r=this.buildTdtDiagText();if(!r){this.tdtDiagCopyStatus="无可复制内容";return}try{await navigator.clipboard.writeText(r),this.tdtDiagCopyStatus="已复制"}catch(o){console.error(o),this.tdtDiagCopyStatus="复制失败，请手动复制"}},roadSyntaxAttachMapListeners(){const r=this.mapCore&&this.mapCore.map?this.mapCore.map:null;r&&(this.roadSyntaxDetachMapListeners(),this.roadSyntaxZoomStartListener=()=>{this.roadSyntaxMapInteracting=!0,this.isRoadSyntaxMetricViewActive()&&this.roadSyntaxEnterLowFidelityMode()},this.roadSyntaxMoveStartListener=()=>{this.roadSyntaxMapInteracting=!0,this.isRoadSyntaxMetricViewActive()&&this.roadSyntaxEnterLowFidelityMode()},this.roadSyntaxMoveEndListener=()=>{this.roadSyntaxMapInteracting=!1,this.isRoadSyntaxMetricViewActive()&&(this.scheduleRoadSyntaxViewportRefresh("moveend"),this.roadSyntaxLogOverlayHealth("moveend")),this.markerManager&&typeof this.markerManager.logCoordinateHealth=="function"&&this.markerManager.logCoordinateHealth("road-syntax:moveend")},this.roadSyntaxZoomListener=()=>{this.roadSyntaxMapInteracting=!1,this.isRoadSyntaxMetricViewActive()&&(this.scheduleRoadSyntaxViewportRefresh("zoomend"),this.roadSyntaxLogOverlayHealth("zoomend")),this.markerManager&&typeof this.markerManager.logCoordinateHealth=="function"&&this.markerManager.logCoordinateHealth("road-syntax:zoomend")},r.on("zoomstart",this.roadSyntaxZoomStartListener),r.on("movestart",this.roadSyntaxMoveStartListener),r.on("moveend",this.roadSyntaxMoveEndListener),r.on("zoomend",this.roadSyntaxZoomListener))},roadSyntaxDetachMapListeners(){const r=this.mapCore&&this.mapCore.map?this.mapCore.map:null;if(r&&this.roadSyntaxZoomListener)try{r.off("zoomend",this.roadSyntaxZoomListener)}catch{}if(r&&this.roadSyntaxZoomStartListener)try{r.off("zoomstart",this.roadSyntaxZoomStartListener)}catch{}if(r&&this.roadSyntaxMoveStartListener)try{r.off("movestart",this.roadSyntaxMoveStartListener)}catch{}if(r&&this.roadSyntaxMoveEndListener)try{r.off("moveend",this.roadSyntaxMoveEndListener)}catch{}this.roadSyntaxZoomListener=null,this.roadSyntaxZoomStartListener=null,this.roadSyntaxMoveStartListener=null,this.roadSyntaxMoveEndListener=null},initMap(){const r=new At("container",{center:{lng:112.9388,lat:28.2282},zoom:13,zooms:[3,20],mapData:{},basemapSource:this.basemapSource,basemapMuted:!1,tiandituKey:this.config?this.config.tianditu_key:"",tiandituContainerId:"tianditu-container",onGridFeatureClick:o=>this.onH3GridFeatureClick(o)});r.initMap(),this.mapCore=it(r),this.applySimplifyConfig(),this.basemapSource==="tianditu"&&r.lastBasemapError&&(this.tdtDiag={ok:!1,phase:"map-init",status:null,contentType:"",bodySnippet:r.lastBasemapError.message||"",reason:r.lastBasemapError.code||"wmts-layer-init-failed"},this.errorMessage="天地图 WMTS 图层初始化失败，请检查：Key 类型=Web JS，白名单包含 localhost/127.0.0.1（及端口）。"),r.map.on("click",o=>{this.sidebarView!=="wizard"||this.step!==1||this.isochroneScopeMode==="point"&&(this.drawScopeActive||this.setSelectedPoint(o.lnglat))}),this.roadSyntaxAttachMapListeners()}}}function ie(){return{cancelHistoryDetailLoading(){if(this.historyDetailAbortController){try{this.historyDetailAbortController.abort()}catch(r){console.warn("history detail abort failed",r)}this.historyDetailAbortController=null}this.historyDetailLoadToken+=1},saveAnalysisHistoryAsync(r,o,l){if(!this.selectedPoint||!Array.isArray(l)||l.length===0)return;const h=(o||[]).map(b=>b.name).join(","),c=this.isochroneScopeMode==="area"&&Array.isArray(this.drawnScopePolygon)&&this.drawnScopePolygon.length>=3?this._closePolygonRing(this.normalizePath(this.drawnScopePolygon,3,"history.drawn_polygon")):null,g=l.map(b=>({id:b&&b.id?String(b.id):"",name:b&&b.name?String(b.name):"未命名",location:Array.isArray(b&&b.location)?[b.location[0],b.location[1]]:null,address:b&&b.address?String(b.address):"",type:b&&b.type?String(b.type):"",adname:b&&b.adname?String(b.adname):"",lines:Array.isArray(b&&b.lines)?b.lines:[]})).filter(b=>Array.isArray(b.location)&&b.location.length===2),M={center:[this.selectedPoint.lng,this.selectedPoint.lat],polygon:this.getIsochronePolygonPayload(),drawn_polygon:Array.isArray(c)&&c.length>=4?c:null,pois:g,keywords:h,location_name:this.selectedPoint.lng.toFixed(4)+","+this.selectedPoint.lat.toFixed(4),mode:this.transportMode,time_min:parseInt(this.timeHorizon),source:this.normalizePoiSource(this.resultDataSource||this.poiDataSource,"local")};setTimeout(()=>{fetch("/api/v1/analysis/history/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(M)}).then(async b=>{if(!b.ok){let w="";try{w=await b.text()||""}catch{}throw new Error(`HTTP ${b.status}${w?`: ${w.slice(0,200)}`:""}`)}return b.json().catch(()=>({}))}).then(()=>{}).catch(b=>{console.warn("Failed to save history",b),this.poiStatus=`抓取完成，但历史保存失败：${b&&b.message?b.message:String(b)}`})},0)}}}function se(){return{}}function re(){return{async fetchPois(){if(this.lastIsochroneGeoJSON){this.isFetchingPois=!0,this.fetchProgress=0,this.poiStatus="准备抓取...",this.resetRoadSyntaxState(),this.resetFetchSubtypeProgress(),this.clearPoiOverlayLayers({reason:"fetch_pois_start",clearManager:!0,clearSimpleMarkers:!0,resetFilterPanel:!0}),this.allPoisDetails=[];try{const r=this.getIsochronePolygonPayload(),o=this.buildSelectedCategoryBuckets();if(o.length===0){alert("请至少选择一个分类"),this.isFetchingPois=!1;return}let l=0;const h=o.length,c=[];o[0]&&this.updateFetchSubtypeProgressDisplay(o[0]),this.abortController=new AbortController;const g=4,M=this.getPoiSourceLabel(this.poiDataSource);this.poiStatus=`正在并行抓取 ${h} 个分类（每批 ${g} 个，${M}）...`,this.resultDataSource=this.normalizePoiSource(this.poiDataSource,"local");const b=async w=>{const N={polygon:r,keywords:"",types:String(w.types||""),source:this.poiDataSource,save_history:!1,center:[this.selectedPoint.lng,this.selectedPoint.lat],time_min:parseInt(this.timeHorizon),mode:this.transportMode,location_name:this.selectedPoint.name||this.selectedPoint.lng.toFixed(4)+","+this.selectedPoint.lat.toFixed(4)};try{const C=await fetch("/api/v1/analysis/pois",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(N),signal:this.abortController.signal});if(!C.ok){let I="";try{I=await C.text()}catch{}return{list:[],error:`HTTP ${C.status}${I?` ${I.slice(0,240)}`:""}`}}return{list:(await C.json()).pois||[],error:""}}catch(C){return C.name!=="AbortError"&&console.warn(`Failed to fetch category ${w.name}`,C),{list:[],error:C&&C.message?String(C.message):String(C)}}};for(let w=0;w<o.length;w+=g){if(this.abortController.signal.aborted)return;const N=o.slice(w,w+g);(await Promise.all(N.map(b))).forEach((I,$)=>{const E=Array.isArray(I&&I.list)?I.list:[];E&&E.length&&this.allPoisDetails.push(...E);const F=N[$];F&&I&&I.error&&c.push({category:F.name||F.id||`cat_${w+$+1}`,error:I.error}),F&&this.accumulateFetchSubtypeHits(F,E||[])}),l=this.allPoisDetails.length;const D=Math.min(w+N.length,h);this.fetchProgress=Math.round(D/h*100),this.poiStatus=`已完成 ${D}/${h} 分类，累计 ${l} 个结果`}if(this.abortController.signal.aborted)return;if(this.allPoisDetails=this.deduplicateFetchedPois(this.allPoisDetails),l=this.allPoisDetails.length,this.fetchProgress=100,l===0&&c.length>0){const w=c[0];throw new Error(`本地源请求失败（${c.length}/${h} 分类）。示例：${w.category} -> ${w.error}`)}this.poiStatus=`完成！共找到 ${l} 个结果`,c.length>0&&(console.warn("[poi-fetch] partial category failures",c),this.poiStatus+=`（${c.length} 个分类失败，已输出到控制台）`),this.rebuildPoiRuntimeSystem(this.allPoisDetails),setTimeout(()=>{this.step=3,this.activeStep3Panel="poi",this.updatePoiCharts(),this.resizePoiChart()},120),this.saveAnalysisHistoryAsync(r,o,this.allPoisDetails)}catch(r){r.name!=="AbortError"&&(console.error(r),this.poiStatus=`失败: ${r.message}`)}finally{this.isFetchingPois=!1,this.abortController=null,this.resetFetchSubtypeProgress()}}},computePoiStats(r){const o=this.poiCategories.map(g=>g.name),l=this.poiCategories.map(g=>g.color||"#888"),h=this.poiCategories.map(()=>0),c={};return this.poiCategories.forEach((g,M)=>{c[g.id]=M}),(r||[]).forEach(g=>{const M=this.resolvePoiCategoryId(g&&g.type);if(!M)return;const b=c[M];Number.isInteger(b)&&b>=0&&(h[b]+=1)}),{labels:o,colors:l,values:h}},getPoiCategoryChartStats(){const r=Array.isArray(this.allPoisDetails)&&this.allPoisDetails.length?this.allPoisDetails:this.markerManager&&typeof this.markerManager.getVisiblePoints=="function"?this.markerManager.getVisiblePoints():[];return this.computePoiStats(r)},updatePoiCharts(){if(!Array.isArray(this.allPoisDetails)||!this.allPoisDetails.length)return;if(this.activeStep3Panel==="poi"&&this.poiSubTab!=="category"){this.refreshPoiKdeOverlay();return}const r=document.getElementById("poiChart");if(!r||!window.echarts)return;const o=echarts.getInstanceByDom(r);if(o&&r.clientWidth>0){this.poiChart=o;const l=this.getPoiCategoryChartStats(),h=l.values.map(g=>Number.isFinite(g)?g:0),c={yAxis:{type:"category",inverse:!0,data:l.labels},series:[{data:h,itemStyle:{color:g=>l.colors[g.dataIndex]||"#888"}}]};o.setOption(c,!1),this.refreshPoiKdeOverlay();return}setTimeout(()=>{const l=this.initPoiChart();if(!l)return;const h=this.getPoiCategoryChartStats(),c=h.values.map(M=>Number.isFinite(M)?M:0),g={grid:{left:50,right:20,top:10,bottom:10,containLabel:!0},xAxis:{type:"value",axisLine:{show:!1},axisTick:{show:!1},splitLine:{lineStyle:{color:"#eee"}}},yAxis:{type:"category",inverse:!0,data:h.labels,axisLine:{show:!1},axisTick:{show:!1}},series:[{type:"bar",data:c,barWidth:12,itemStyle:{color:M=>h.colors[M.dataIndex]||"#888"}}]};try{l.setOption(g,!0),l.resize()}catch(M){console.error("ECharts setOption error:",M)}this.refreshPoiKdeOverlay()},100)}}}function oe(){return Object.freeze({SWITCH_TARGET_MS:120,PREBUILD_DEADLINE_MS:12e4,CONNECTIVITY_NODE_MIN_ZOOM:15,SWITCH_SAMPLE_LIMIT:40,BUILD_BUDGET_MS:Object.freeze({interacting:.8,init:6,steady:4,lineFallbackSmall:12,lineFallbackLarge:8,node:6.5})})}function le(r={}){const o=r&&r.typeMapConfig||{groups:[]},l=oe(),h=Jt(),c=Xt(),g=St(),M=()=>bt(),b=()=>mt(),w=xt(),N=gt(),C=()=>Mt(),D=()=>Rt(),I=vt(),$=ft(),E=()=>Pt(),F=kt(),H=()=>_t(),j=wt(),V=st(l),q=lt(),K=rt(l),U=Ct(),Y=()=>ot(l),Z=ne(),Q=ie(),J=se(),W=re(),X=ae(),t=Object.freeze({queue:typeof Lt=="function",overlayCommit:typeof lt=="function",state:typeof ot=="function",controller:typeof rt=="function",ui:typeof st=="function"}),e=Object.keys(t).filter(x=>!t[x]),n=e.length===0;n||console.error("[road-syntax] module wiring incomplete",{missing:e.slice(),static_version:"frontend-build"});const a=pt(),i=Tt(a,{typeMapConfig:o,roadSyntaxModulesReady:n,roadSyntaxModuleMissing:e.slice(),buildAnalysisPoiRuntimeInitialState:b,buildAnalysisPoiInitialState:M,buildAnalysisHistoryListInitialState:C,buildAnalysisHistoryInitialState:D,buildAnalysisH3InitialState:E,buildAnalysisExportInitialState:H,buildRoadSyntaxInitialState:Y}),s=Nt(a),d=It(a),u=Dt(a),y=Ot(a),S=Ft(a),p=ee([{store:s,fieldKeys:Et},{store:d,fieldKeys:$t},{store:u,fieldKeys:Bt},{store:y,fieldKeys:Wt},{store:S,fieldKeys:zt}]);return{pinia:a,initialState:i,storeBackedComputed:p,roadSyntaxModulesReady:n,roadSyntaxModuleMissing:e,methods:{analysisWorkbenchMethods:h,analysisWorkbenchSessionMethods:c,isochroneMethods:g,poiPanelMethods:w,poiRuntimeMethods:N,historyListMethods:I,historyMethods:$,h3Methods:F,exportMethods:j,roadSyntaxOverlayCommitMethods:q,roadSyntaxControllerCoreMethods:K,roadSyntaxWebglMethods:U,roadSyntaxUiMethods:V,mapOrchestratorMethods:Z,historyOrchestratorMethods:Q,exportOrchestratorMethods:J,poiFlowOrchestratorMethods:W,poiMapVisibilityAdapterMethods:X}}}function de({app:r,pinia:o,target:l="#analysis-app-root"}){if(!r||typeof r.use!="function"||typeof r.mount!="function")throw new Error("invalid app instance for runtime mount");if(!o)throw new Error("pinia instance is required for runtime mount");r.use(o),r.mount(l)}function ce(r={}){const o=!!r.roadSyntaxModulesReady,l=Array.isArray(r.roadSyntaxModuleMissing)?r.roadSyntaxModuleMissing:[];return{async mounted(){try{this.config=window.__ANALYSIS_BOOTSTRAP__&&window.__ANALYSIS_BOOTSTRAP__.config?window.__ANALYSIS_BOOTSTRAP__.config:{amap_js_api_key:"",amap_js_security_code:"",tianditu_key:""},this.initializePoiCategoriesFromTypeMap(),this.basemapSource==="tianditu"&&(await this.validateTiandituSource()||(this.tdtDiagCopyStatus=""));const h=8e3;await Promise.race([this.loadAMapScript(this.config.amap_js_api_key,this.config.amap_js_security_code),new Promise((c,g)=>setTimeout(()=>g(new Error("AMap 加载超时，请检查网络或 Key")),h))]),this.initMap()}catch(h){console.error("Initialization Failed:",h),this.errorMessage="系统初始化失败: "+h.message}finally{this.preloadHistoryListInBackground(),o||this.roadSyntaxSetStatus(`路网模块未完整加载：${l.join(", ")}`),this.attachAmapRuntimeErrorProbe(),document.addEventListener("click",this.handleGlobalClick,!0),this.loadingConfig=!1;const h=document.getElementById("loading-overlay");h&&(h.style.display="none")}},beforeUnmount(){document.removeEventListener("click",this.handleGlobalClick,!0),this.detachAmapRuntimeErrorProbe(),this.destroyPlaceSearch(),this.stopScopeDrawing({destroyTool:!0}),this.clearPoiOverlayLayers({reason:"before_unmount",clearManager:!0,clearSimpleMarkers:!0,clearCenterMarker:!0,resetFilterPanel:!0,immediate:!0}),this.clearPoiKdeOverlay(),this.roadSyntaxDetachMapListeners(),typeof this.cancelRoadSyntaxRequest=="function"&&this.cancelRoadSyntaxRequest("before_unmount"),this.invalidateRoadSyntaxCache("unmount",{resetData:!0}),this.h3ToastTimer&&(clearTimeout(this.h3ToastTimer),this.h3ToastTimer=null),this.cancelHistoryLoading(),this.cancelHistoryDetailLoading(),this.disposePoiChart(),this.disposeH3Charts()},watch:{step(h,c){c===1&&h!==1&&(this.destroyPlaceSearch(),this.stopScopeDrawing())},sidebarView(h,c){c==="history"&&h!=="history"&&this.cancelHistoryLoading(),c==="wizard"&&h!=="wizard"&&this.stopScopeDrawing()},activeStep3Panel(h,c){h!==c&&(h==="syntax"?typeof this.resumeRoadSyntaxDisplay=="function"&&this.resumeRoadSyntaxDisplay():typeof this.suspendRoadSyntaxDisplay=="function"&&this.suspendRoadSyntaxDisplay(),h==="syntax"?this.suspendPoiSystemForSyntax():c==="syntax"&&this.resumePoiSystemAfterSyntax(),c==="h3"&&h!=="h3"&&this.clearH3GridDisplayOnLeave(),h==="h3"&&this.restoreH3GridDisplayOnEnter(),this.$nextTick(()=>{this.refreshPoiKdeOverlay()}))},roadSyntaxGraphModel(h,c){const g=String(h||"").trim().toLowerCase(),M=String(c||"").trim().toLowerCase();!M||g===M||this.roadSyntaxSetStatus(`图模型已切换为${this.roadSyntaxGraphModelLabel(g)}，请重新计算路网指标`)}}}}function he(){const r=window.__ANALYSIS_BOOTSTRAP__&&window.__ANALYSIS_BOOTSTRAP__.typeMapConfig||{groups:[]},o=le({typeMapConfig:r}),{pinia:l,initialState:h,storeBackedComputed:c,roadSyntaxModulesReady:g,roadSyntaxModuleMissing:M,methods:b}=o,{analysisWorkbenchMethods:w,analysisWorkbenchSessionMethods:N,isochroneMethods:C,poiPanelMethods:D,poiRuntimeMethods:I,historyListMethods:$,historyMethods:E,h3Methods:F,exportMethods:H,roadSyntaxOverlayCommitMethods:j,roadSyntaxControllerCoreMethods:V,roadSyntaxWebglMethods:q,roadSyntaxUiMethods:K,mapOrchestratorMethods:U,historyOrchestratorMethods:Y,exportOrchestratorMethods:Z,poiFlowOrchestratorMethods:Q,poiMapVisibilityAdapterMethods:J}=b,W=ce({roadSyntaxModulesReady:g,roadSyntaxModuleMissing:M}),X=yt({data(){return{loadingConfig:!0,config:null,...h,placeSearch:null,placeSearchErrorListener:null,placeSearchLoadingPromise:null,placeSearchBuildToken:0,drawScopeMouseTool:null,drawScopeDrawHandler:null,drawScopeActive:!1,amapRuntimeErrorListener:null,amapRuntimeRejectionListener:null}},computed:c,mounted:W.mounted,beforeUnmount:W.beforeUnmount,watch:W.watch,methods:{...w,...N,...C,...D,...I,...$,...E,...F,...H,...J,...U,...Y,...Z,...Q,...j,...V,...q,...K,async generateH3Grid(){if(!(!this.getIsochronePolygonRing()||this.isGeneratingGrid||this.isComputingH3Analysis)){this.isGeneratingGrid=!0,this.resetH3AnalysisState(),this.h3GridStatus="正在生成网络...";try{const e=this.getIsochronePolygonPayload(),n=await fetch("/api/v1/analysis/h3-grid",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({polygon:e,resolution:this.h3GridResolution,coord_type:"gcj02",include_mode:this.h3GridIncludeMode,min_overlap_ratio:this.h3GridIncludeMode==="intersects"?this.h3GridMinOverlapRatio:0})});if(!n.ok){let s="";try{s=await n.text()}catch{}throw new Error(s||"网络生成失败")}const a=await n.json();this.h3GridFeatures=a.features||[],this.h3GridCount=Number.isFinite(a.count)?a.count:this.h3GridFeatures.length,this.isH3PanelActive()&&this.mapCore&&this.mapCore.setGridFeatures?this.mapCore.setGridFeatures(this.h3GridFeatures,{strokeColor:"#2c6ecb",strokeWeight:1.1,fillOpacity:0,webglBatch:!0}):this.clearH3GridDisplayOnLeave();const i=this.h3GridCount>0?`已生成 ${this.h3GridCount} 个 H3 网格`:"已生成网络，但当前范围无可用网格";this.h3GridStatus=this.isH3PanelActive()?i:`${i}（已就绪，切换到“网格”查看）`}catch(e){console.error(e),this.h3GridStatus="网络生成失败: "+e.message}finally{this.isGeneratingGrid=!1}}},isRoadSyntaxPanelActive(){return this.activeStep3Panel==="syntax"},isRoadSyntaxMetricViewActive(){return this.isRoadSyntaxPanelActive()&&this.roadSyntaxMainTab!=="params"},roadSyntaxMap(){return this.mapCore&&this.mapCore.map?this.mapCore.map:null},roadSyntaxQuantizeChannel(t,e=24){const n=Number.isFinite(Number(t))?Number(t):0,a=Math.max(1,Number(e)||1);return Math.max(0,Math.min(255,Math.round(n/a)*a))},roadSyntaxQuantizeHexColor(t="",e=24){const n=String(t||"").trim(),a=n.startsWith("#")?n.slice(1):n;if(!/^[0-9a-fA-F]{6}$/.test(a))return"#9ca3af";const i=this.roadSyntaxQuantizeChannel(parseInt(a.slice(0,2),16),e),s=this.roadSyntaxQuantizeChannel(parseInt(a.slice(2,4),16),e),d=this.roadSyntaxQuantizeChannel(parseInt(a.slice(4,6),16),e);return`#${i.toString(16).padStart(2,"0")}${s.toString(16).padStart(2,"0")}${d.toString(16).padStart(2,"0")}`},roadSyntaxNormalizeLayerStyleForBucket(t=null){const e=t||{},n=Math.max(1,Number(this.roadSyntaxStyleBucketColorStep||24)),a=Math.max(.1,Number(this.roadSyntaxStyleBucketWeightStep||.5)),i=Math.max(.02,Number(this.roadSyntaxStyleBucketOpacityStep||.08)),s=Number(e.strokeWeight),d=Number(e.strokeOpacity),u=Number(e.zIndex);return{strokeColor:this.roadSyntaxQuantizeHexColor(e.strokeColor||"#9ca3af",n),strokeWeight:Math.max(1,Math.round((Number.isFinite(s)?s:1.8)/a)*a),strokeOpacity:Math.max(.08,Math.min(1,Math.round((Number.isFinite(d)?d:.32)/i)*i)),zIndex:Number.isFinite(u)?Math.round(u):90}},roadSyntaxBuildLayerStyleBucketKey(t=null){const e=this.roadSyntaxNormalizeLayerStyleForBucket(t);return`${e.strokeColor}|${e.strokeWeight}|${e.strokeOpacity}|${e.zIndex}`},roadSyntaxCloneIndexSet(t=null){const e={};return Object.keys(t&&typeof t=="object"?t:{}).forEach(a=>{const i=Number(a);!Number.isFinite(i)||i<0||(e[i]=!0)}),e},roadSyntaxBuildLayerLodIndexSet(t=""){const e=String(t||""),n=Object.assign({},this.roadSyntaxLayerLodIndexCache||{});if(n[e])return this.roadSyntaxCloneIndexSet(n[e]);const a=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems:[];if(!a.length)return{};const i=this.parseRoadSyntaxLayerKey(e),s=i.metric||this.resolveRoadSyntaxActiveMetric(),d=i.radiusLabel||"global",u=this.resolveRoadSyntaxMetricField(s,d),y=this.resolveRoadSyntaxFallbackField(s),S=this.resolveRoadSyntaxRankField(s),p=[];for(let k=0;k<a.length;k+=1){const v=a[k]||{};if((Array.isArray(v.coords)?v.coords:[]).length<2)continue;const _=v.props||{},A=Number(S?_[S]:NaN),P=Number(_[u]),L=Number(_[y]),T=Number.isFinite(A)?this.clamp01(A):Number.isFinite(P)?this.clamp01(P):Number.isFinite(L)?this.clamp01(L):0;p.push({idx:k,score:T})}if(!p.length)return{};p.sort((k,v)=>v.score-k.score||k.idx-v.idx);const x=Math.max(80,Math.floor(Number(this.roadSyntaxLayerLodCap||180))),m=[];if(p.length<=x)p.forEach(k=>m.push(k.idx));else{const k=Math.max(1,Math.min(x,Math.floor(x*.75)));for(let f=0;f<k;f+=1)m.push(p[f].idx);const v=x-m.length;if(v>0){const f=p.slice(k),_=f.length/v;for(let A=0;A<v;A+=1){const P=Math.min(f.length-1,Math.floor(A*_));m.push(f[P].idx)}}}const R={};return m.forEach(k=>{const v=Number(k);!Number.isFinite(v)||v<0||(R[v]=!0)}),n[e]=R,this.roadSyntaxLayerLodIndexCache=n,this.roadSyntaxCloneIndexSet(R)},roadSyntaxResolveDesiredLayerVariant(){const t=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems.length:0;if(!t||typeof this.roadSyntaxResolveLodPolicy!="function")return"full";const e=this.roadSyntaxResolveLodPolicy(t);return e&&e.backboneOnly?"lod":"full"},roadSyntaxResolveLayerRuntimeEntry(t=null,e="full"){const n=String(e||"full"),a=t&&typeof t=="object"?t:null;return a?n==="lod"&&a.lodLayer&&Array.isArray(a.lodLayer.overlays)&&a.lodLayer.overlays.length?a.lodLayer:a:null},roadSyntaxApplyVisibleIndexSet(t={},e=""){const n=this.roadSyntaxCloneIndexSet(t);this.roadSyntaxTargetVisibleLineSet=Object.assign({},n),this.roadSyntaxAppliedVisibleLineSet=Object.assign({},n),this.roadSyntaxOverlayCommitToken=Number(this.roadSyntaxOverlayCommitToken||0)+1,this.roadSyntaxOverlayLastCommitPath="pool_state_apply",this.roadSyntaxOverlayLastCommitReason=String(e||"switch")},roadSyntaxDisposeLayerEntry(t=null,e=null){if(!t)return;const n=e||this.roadSyntaxMap();t.overlayGroup&&this.roadSyntaxSetOverlayGroupVisible(t.overlayGroup,!1,n);const a=Array.isArray(t.overlays)?t.overlays:[];a.length&&this.roadSyntaxSetLinesVisible(a,!1,n,{preferBatch:!0}),t.lodLayer&&this.roadSyntaxDisposeLayerEntry(t.lodLayer,n)},roadSyntaxBuildLayerFromStyles(t="",e=[],n={}){const a=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems:[],i=n&&n.includeIndexSet&&typeof n.includeIndexSet=="object"?n.includeIndexSet:null,s=String(n&&n.variant||"full"),d=Number(n&&n.zIndexBoost||0),u=Object.create(null);let y=0;const S={};let p=0,x=0;const m=[];for(let f=0;f<a.length;f+=1){if(i&&!i[f])continue;const _=a[f]||{},A=Array.isArray(_.coords)?_.coords:[];if(A.length<2)continue;y+=1,S[f]=!0;const P=this.roadSyntaxNormalizeLayerStyleForBucket(e[f]||null),L=d?Object.assign({},P,{zIndex:(Number(P.zIndex)||90)+d}):P,T=this.roadSyntaxBuildLayerStyleBucketKey(L);u[T]||(u[T]={style:L,paths:[]}),u[T].paths.push(A)}const R=[],k=Object.values(u);k.forEach(f=>{const _=f.style||{},A=Array.isArray(f.paths)?f.paths:[];if(!A.length||!window.AMap)return;const P=[];A.forEach((L,T)=>{const z=this.normalizePath(L,2,"road_syntax.layer_build.path");if(!z.length){p+=1,m.length<5&&m.push({layer_key:String(t||""),variant:String(s||""),path_index:T,sample:this.roadSyntaxSummarizeCoordInput(Array.isArray(L)?L[0]:L)});return}P.push(z)}),P.length&&P.forEach(L=>{try{const T=it(new AMap.Polyline({path:L,strokeColor:_.strokeColor||"#9ca3af",strokeWeight:Number(_.strokeWeight)||1.8,strokeOpacity:Number(_.strokeOpacity)||.32,zIndex:Number(_.zIndex)||90,bubble:!0,clickable:!1,cursor:"default"}));R.push(T)}catch{x+=1}})}),(p>0||x>0)&&console.warn("[road-syntax] layer build skipped invalid paths",{layer_key:String(t||""),variant:String(s||""),invalid_path_count:p,polyline_create_error_count:x,sample_paths:m});let v=null;try{window.AMap&&typeof AMap.OverlayGroup=="function"&&R.length&&(v=it(new AMap.OverlayGroup(R)))}catch{v=null}return{layerKey:String(t||""),mode:"bucket_pool",variant:s,overlays:R,overlayGroup:v,bucketCount:k.length,featureCount:y,indexSet:S}},roadSyntaxGetLayer(t=""){const e=this.roadSyntaxLayerPool||{},n=String(t||"");return n&&e[n]||null},roadSyntaxSetStatus(t=""){this.roadSyntaxStatus=String(t||"")},cancelRoadSyntaxRequest(t=""){const e=this.roadSyntaxFetchAbortController;if(!e)return!1;try{e.abort()}catch{}return this.roadSyntaxFetchAbortController=null,t&&console.info("[road-syntax] request aborted",{reason:String(t||"")}),!0},roadSyntaxCreateRunId(){const t=Math.random().toString(36).slice(2,10);return`rs_${Date.now()}_${t}`},roadSyntaxStopProgressTracking(){this.roadSyntaxProgressPollTimer&&(window.clearInterval(this.roadSyntaxProgressPollTimer),this.roadSyntaxProgressPollTimer=null),this.roadSyntaxProgressTickTimer&&(window.clearInterval(this.roadSyntaxProgressTickTimer),this.roadSyntaxProgressTickTimer=null),this.roadSyntaxProgressPolling=!1},roadSyntaxResetProgressState(){this.roadSyntaxStopProgressTracking(),this.roadSyntaxProgressRunId="",this.roadSyntaxProgressStage="",this.roadSyntaxProgressMessage="",this.roadSyntaxProgressStep=0,this.roadSyntaxProgressTotal=0,this.roadSyntaxProgressElapsedSec=0,this.roadSyntaxProgressStartedAtMs=0},async roadSyntaxPollProgressOnce(t=null){const e=String(this.roadSyntaxProgressRunId||"").trim();if(e&&!this.roadSyntaxProgressPolling&&!(t!==null&&t!==this.roadSyntaxRequestToken)){this.roadSyntaxProgressPolling=!0;try{const n=await fetch(`/api/v1/analysis/road-syntax/progress?run_id=${encodeURIComponent(e)}`,{cache:"no-store"});if(!n.ok)return;const a=await n.json(),i=String(a&&a.stage||""),s=String(a&&a.message||""),d=String(a&&a.status||"running"),u=Number(a&&a.step),y=Number(a&&a.total),S=Number(a&&a.elapsed_sec);if(this.roadSyntaxProgressStage=i,this.roadSyntaxProgressMessage=s,this.roadSyntaxProgressStep=Number.isFinite(u)?Math.max(0,Math.floor(u)):0,this.roadSyntaxProgressTotal=Number.isFinite(y)?Math.max(0,Math.floor(y)):0,Number.isFinite(S)&&S>=0&&(this.roadSyntaxProgressElapsedSec=S),s){const x=this.roadSyntaxProgressStep>0&&this.roadSyntaxProgressTotal>0?`进度 ${this.roadSyntaxProgressStep}/${this.roadSyntaxProgressTotal}：${s}`:s;this.roadSyntaxSetStatus(x)}d!=="running"&&this.roadSyntaxStopProgressTracking()}catch{}finally{this.roadSyntaxProgressPolling=!1}}},roadSyntaxStartProgressTracking(t,e=null,n="已提交计算请求"){this.roadSyntaxStopProgressTracking(),this.roadSyntaxProgressRunId=String(t||"").trim(),this.roadSyntaxProgressStage="queued",this.roadSyntaxProgressMessage=String(n||""),this.roadSyntaxProgressStep=0,this.roadSyntaxProgressTotal=9,this.roadSyntaxProgressStartedAtMs=Date.now(),this.roadSyntaxProgressElapsedSec=0,n&&this.roadSyntaxSetStatus(n),this.roadSyntaxProgressRunId&&(this.roadSyntaxProgressTickTimer=window.setInterval(()=>{if(!this.isComputingRoadSyntax||!this.roadSyntaxProgressStartedAtMs)return;const a=Math.max(0,Math.floor((Date.now()-this.roadSyntaxProgressStartedAtMs)/1e3));this.roadSyntaxProgressElapsedSec=a},1e3),this.roadSyntaxProgressPollTimer=window.setInterval(()=>{this.roadSyntaxPollProgressOnce(e)},1e3),this.roadSyntaxPollProgressOnce(e))},roadSyntaxUseLegacyPoolStatus(){return!1},roadSyntaxLogOverlayHealth(t="",e={}){const n=!!(e&&e.force),a=Math.max(0,Number(e&&e.throttleMs||1200)),i=this.roadSyntaxNow(),s=Number(this._roadSyntaxOverlayHealthLastAt||0);if(!n&&i-s<a)return null;if(this._roadSyntaxOverlayHealthLastAt=i,this.roadSyntaxUseArcgisWebgl&&this.roadSyntaxWebglActive&&this.roadSyntaxWebglPayload){const m=Number(((this.roadSyntaxWebglPayload||{}).roads||{}).count||0);return(n||m<=0)&&console.info("[road-syntax] overlay pool health",{reason:String(t||""),active_layer:String(this.roadSyntaxActiveLayerKey||""),visible_lines:m,applied_visible_lines:m,target_visible_lines:m,total_lines:m,mode:"arcgis_webgl"}),{inspectedLines:m,visibleLines:m,invalid:{path:0,endpoint:0,line:0},totalLines:m}}const d=this.roadSyntaxAppliedVisibleLineSet&&typeof this.roadSyntaxAppliedVisibleLineSet=="object"?this.roadSyntaxAppliedVisibleLineSet:{},u=this.roadSyntaxTargetVisibleLineSet&&typeof this.roadSyntaxTargetVisibleLineSet=="object"?this.roadSyntaxTargetVisibleLineSet:{},y=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems.length:0,S=Object.keys(d).length,p=Object.keys(u).length,x=S>0?S:this.roadSyntaxActiveLayerKey?y:0;return(n||x<=0)&&console.info("[road-syntax] overlay pool health",{reason:String(t||""),active_layer:String(this.roadSyntaxActiveLayerKey||""),visible_lines:x,applied_visible_lines:S,target_visible_lines:p,total_lines:y,mode:"bucket_pool"}),{inspectedLines:x,visibleLines:x,invalid:{path:0,endpoint:0,line:0},totalLines:y}},invalidateRoadSyntaxCache(t="manual",e={}){const n=!!(e&&e.resetData),a=!!(e&&e.resetPerf);if(typeof this.roadSyntaxClearMapWriteQueue=="function"&&this.roadSyntaxClearMapWriteQueue({dispose:t==="unmount"}),this.roadSyntaxStyleUpdateToken+=1,this.roadSyntaxPoolWarmToken+=1,this.roadSyntaxLayerBuildToken+=1,this.roadSyntaxLayerSwitchToken+=1,this.roadSyntaxPrewarmToken+=1,this.roadSyntaxStyleApplyToken+=1,this.roadSyntaxSwitchInProgress=!1,this.roadSyntaxSwitchQueuedLayerKey="",this.roadSyntaxSwitchLastAt=0,this.roadSyntaxClearSwitchThrottleTimer(),this.roadSyntaxClearViewportRefreshHandles(),this.roadSyntaxClearNodeRefreshTimer(),this.roadSyntaxBumpViewportRefreshToken(),this._roadSyntaxPinnedAttachKey="",this._roadSyntaxViewportToggleDisabledLogged=!1,this.roadSyntaxOverlayCommitToken=0,this.roadSyntaxOverlayLastCommitPath="",this.roadSyntaxOverlayLastCommitReason="",this.roadSyntaxInteractionLowFidelity=!1,this.roadSyntaxDisplaySuspended=!1,this.clearRoadSyntaxLayerPool(),this.roadSyntaxPolylines=[],this.roadSyntaxPolylineItems=[],this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxResetLodScoreCache(),this.roadSyntaxResetSpatialIndex(),this.roadSyntaxSourceFingerprint="",this.roadSyntaxPoolRadiusLabel="",this.roadSyntaxLastStyleKey="",this.roadSyntaxConnectivityReuseLayerKey="",this.roadSyntaxNodeBuildToken+=1,this.roadSyntaxNodeBuildRunning=!1,this.roadSyntaxNodeSourceFingerprint="",this.clearRoadSyntaxNodeMarkers({immediate:!0}),this.disposeRoadSyntaxScatterChart(),this.roadSyntaxWebglPayload=null,this.roadSyntaxWebglStatus="",this.roadSyntaxWebglRadiusFilterCache=null,typeof this.clearRoadSyntaxArcgisWebgl=="function"&&this.clearRoadSyntaxArcgisWebgl({dispose:t==="unmount"}),n){this.roadSyntaxStatus="",this.roadSyntaxSummary=null,this.roadSyntaxRoadFeatures=[],this.roadSyntaxNodes=[],this.roadSyntaxDiagnostics=null,this.roadSyntaxScatterPointsCache=[],this.roadSyntaxLegendModel=null,this.roadSyntaxSkeletonOnly=!1,this.roadSyntaxMainTab="params";const i=this.roadSyntaxDefaultMetric();this.roadSyntaxMetric=i,this.roadSyntaxLastMetricTab=i,this.roadSyntaxRadiusLabel="global"}a&&(this.roadSyntaxSwitchSamples=[],this.roadSyntaxSwitchLastMs=0,this.roadSyntaxSwitchP50Ms=0,this.roadSyntaxSwitchP95Ms=0,this.roadSyntaxSwitchStatsText="",this.roadSyntaxSwitchPath=""),t==="unmount"&&(this.roadSyntaxStatus="")},resetRoadSyntaxState(){this.roadSyntaxRequestToken+=1,this.isComputingRoadSyntax=!1,this.roadSyntaxResetProgressState(),this.invalidateRoadSyntaxCache("reset-state",{resetData:!0,resetPerf:!0})},clearRoadSyntaxOverlays(){this.invalidateRoadSyntaxCache("clear-overlays",{resetData:!1,resetPerf:!1})},suspendRoadSyntaxDisplay(){const t=this.roadSyntaxMap();if(!t)return;this.roadSyntaxDisplaySuspended=!0,this.roadSyntaxLayerSwitchToken+=1,this.roadSyntaxClearViewportRefreshHandles(),this.roadSyntaxClearNodeRefreshTimer(),this.roadSyntaxBumpViewportRefreshToken(),this._roadSyntaxPinnedAttachKey="",this.roadSyntaxInteractionLowFidelity=!1;const e=this.roadSyntaxGetLayer(this.roadSyntaxActiveLayerKey||""),n=this.roadSyntaxResolveLayerRuntimeEntry(e,this.roadSyntaxActiveLayerVariant||"full");n&&(n.overlayGroup?this.roadSyntaxSetOverlayGroupVisible(n.overlayGroup,!1,t):Array.isArray(n.overlays)&&n.overlays.length&&this.roadSyntaxSetLinesVisible(n.overlays,!1,t,{preferBatch:!0})),this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxCurrentStride=1,typeof this.setRoadSyntaxArcgisWebglVisible=="function"&&this.setRoadSyntaxArcgisWebglVisible(!1),this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1),this.disposeRoadSyntaxScatterChart()},resumeRoadSyntaxDisplay(){if(!this.roadSyntaxSummary||!Array.isArray(this.roadSyntaxRoadFeatures)||!this.roadSyntaxRoadFeatures.length){this.roadSyntaxDisplaySuspended=!1;return}if(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload)){this.roadSyntaxDisplaySuspended=!1,this.renderRoadSyntaxByMetric(this.resolveRoadSyntaxActiveMetric());return}if(this.roadSyntaxStrictWebglOnly){this.roadSyntaxDisplaySuspended=!1,this.roadSyntaxSetStatus(this.buildRoadSyntaxWebglUnavailableMessage(this.roadSyntaxWebglPayload));return}this._roadSyntaxPinnedAttachKey="",this.roadSyntaxDisplaySuspended=!0,this.renderRoadSyntaxOverlays({type:"FeatureCollection",features:this.roadSyntaxRoadFeatures},{forceRebuild:!1,displayActive:!0})},clearRoadSyntaxLayerPool(){const t=this.roadSyntaxMap(),e=Array.isArray(this.roadSyntaxPolylines)?this.roadSyntaxPolylines:[];this.roadSyntaxSetLinesVisible(e,!1,t,{preferBatch:!0}),this.roadSyntaxClearViewportRefreshHandles(),this.roadSyntaxClearNodeRefreshTimer();const n=this.roadSyntaxLayerPool||{};Object.keys(n).forEach(a=>{this.roadSyntaxDisposeLayerEntry(n[a],t)}),this.roadSyntaxLayerPool={},this.roadSyntaxLayerStyleCache={},this.roadSyntaxLayerLodIndexCache={},this.roadSyntaxPolylines=[],this.roadSyntaxTargetVisibleLineSet={},this.roadSyntaxAppliedVisibleLineSet={},this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxResetLodScoreCache(),this.roadSyntaxResetSpatialIndex(),this.roadSyntaxBumpViewportRefreshToken(),this.roadSyntaxInteractionLowFidelity=!1,this.roadSyntaxCurrentStride=1,this.roadSyntaxActiveLayerKey="",this.roadSyntaxActiveLayerVariant="full",this.roadSyntaxPendingLayerKey="",this.roadSyntaxLayerBuildState={},this.roadSyntaxLayerBuildQueue=[],this.roadSyntaxLayerBuildRunning=!1,this.roadSyntaxPoolInitRunning=!1,this.roadSyntaxPoolReady=!1,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitTotal=0,this.roadSyntaxPoolInitDone=0,this.roadSyntaxLayerReadyMap={},this.roadSyntaxConnectivityReuseLayerKey=""},refreshRoadSyntaxLayerReadyMap(){const t=this.roadSyntaxLayerKeysForPrebuild(),e=this.roadSyntaxLayerBuildState||{},n=this.roadSyntaxLayerStyleCache||{},a={};return t.forEach(i=>{a[i]=!!n[i]&&e[i]==="ready"}),this.roadSyntaxLayerReadyMap=a,this.roadSyntaxPoolInitTotal=t.length,this.roadSyntaxPoolInitDone=Object.values(a).filter(i=>!!i).length,a},isRoadSyntaxMetricReady(t=null,e={}){if(!this.roadSyntaxSummary)return!1;const n=String(t||this.resolveRoadSyntaxActiveMetric()||this.roadSyntaxDefaultMetric());if(this.roadSyntaxStrictWebglOnly)return!!(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload));if(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload))return!0;const a=e&&Object.prototype.hasOwnProperty.call(e,"radiusLabel")?String(e.radiusLabel||"global"):this.roadSyntaxMetricUsesRadius(n)?String(this.roadSyntaxRadiusLabel||"global"):"global",i=e&&Object.prototype.hasOwnProperty.call(e,"skeletonOnly")?!!e.skeletonOnly:!1,s=this.resolveRoadSyntaxLayerKey(n,{radiusLabel:a,skeletonOnly:i});return this.isRoadSyntaxLayerReady(s)},canActivateRoadSyntaxTab(t){const e=String(t||"").trim();return e==="params"?!0:this.roadSyntaxSummary?this.isRoadSyntaxMetricReady(e):!1},canToggleRoadSyntaxSkeleton(){const t=this.resolveRoadSyntaxActiveMetric();return!this.roadSyntaxSupportsSkeleton(t)||!this.roadSyntaxSummary||this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload)?!1:this.roadSyntaxSkeletonOnly?this.isRoadSyntaxMetricReady(t,{skeletonOnly:!1}):this.isRoadSyntaxMetricReady(t,{skeletonOnly:!0})},cancelRoadSyntaxNodeBuild(){this.roadSyntaxNodeBuildToken+=1,this.roadSyntaxNodeBuildRunning=!1},shouldRenderRoadSyntaxConnectivityNodes(){if(!this.mapCore||!this.mapCore.map)return!1;const t=Number(this.roadSyntaxConnectivityNodeMinZoom||15),e=Number(this.mapCore.map.getZoom?this.mapCore.map.getZoom():NaN);return Number.isFinite(e)?e>=t:!0},setRoadSyntaxNodeMarkersVisible(t){if(!Array.isArray(this.roadSyntaxNodeMarkers)||!this.roadSyntaxNodeMarkers.length)return;t&&!this.shouldRenderRoadSyntaxConnectivityNodes()&&(t=!1);const e=this.roadSyntaxNodeMarkers.slice(),n=t&&this.mapCore&&this.mapCore.map?this.mapCore.map:null;this.roadSyntaxEnqueueMapWrite(()=>(e.forEach(a=>this.safeMapSet(a,n)),{ok:!0,marker_count:e.length,visible:!!n}),{key:"road_syntax_node_visibility",replaceExisting:!0,meta:{reason:"road_syntax_node_visibility",marker_count:e.length,visible:!!n}})},clearRoadSyntaxNodeMarkers(t={}){if(this.cancelRoadSyntaxNodeBuild(),!Array.isArray(this.roadSyntaxNodeMarkers)){this.roadSyntaxNodeMarkers=[];return}const e=!!(t&&t.immediate),n=this.roadSyntaxNodeMarkers.slice();if(this.roadSyntaxNodeMarkers=[],!!n.length){if(e){n.forEach(a=>this.safeMapSet(a,null));return}this.roadSyntaxEnqueueMapWrite(()=>(n.forEach(a=>this.safeMapSet(a,null)),{ok:!0,marker_count:n.length}),{key:"road_syntax_node_clear",replaceExisting:!1,meta:{reason:"road_syntax_node_clear",marker_count:n.length}})}},disposeRoadSyntaxScatterChart(){this.clearRoadSyntaxScatterRenderTimer();const t=this.roadSyntaxScatterChart;t&&typeof t.dispose=="function"&&t.dispose(),this.roadSyntaxScatterChart=null},clearRoadSyntaxScatterRenderTimer(){this.roadSyntaxScatterRenderTimer&&(window.clearTimeout(this.roadSyntaxScatterRenderTimer),this.roadSyntaxScatterRenderTimer=null)},scheduleRoadSyntaxScatterRender(t=0){if(this.roadSyntaxMainTab!=="intelligibility")return;const e=Math.max(0,Number(t)||0),n=8;this.clearRoadSyntaxScatterRenderTimer();const a=e===0?0:Math.min(180,40+e*20);this.roadSyntaxScatterRenderTimer=window.setTimeout(()=>{this.roadSyntaxScatterRenderTimer=null,!this.renderRoadSyntaxScatterChart()&&e<n&&this.roadSyntaxMainTab==="intelligibility"&&this.scheduleRoadSyntaxScatterRender(e+1)},a)},setRoadSyntaxMainTab(t,e={}){const n=String(t||"").trim();if(!(this.roadSyntaxTabs||[]).map(y=>y.value).includes(n))return;if(n!=="params"&&this.roadSyntaxPoolInitRunning&&this.roadSyntaxUseLegacyPoolStatus()){this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载中",this.roadSyntaxPoolInitDone,this.roadSyntaxPoolInitTotal||0));return}const i=e.syncMetric!==!1,s=e.refresh!==!1,d=this.roadSyntaxMainTab,u=this.roadSyntaxMetric;if(this.roadSyntaxMainTab=n,n==="params"){this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1),this.disposeRoadSyntaxScatterChart(),this.mapCore&&typeof this.mapCore.setRadius=="function"&&this.mapCore.setRadius(0);return}if(!this.isRoadSyntaxMetricReady(n)){if(this.roadSyntaxStrictWebglOnly)this.roadSyntaxSetStatus(`指标“${this.roadSyntaxLabelByMetric(n)}”对应 ArcGIS-WebGL 数据未就绪`);else{const y=this.roadSyntaxLayerReadyCounts();this.roadSyntaxPoolDegraded?this.roadSyntaxSetStatus(`图层预处理已降级，指标“${this.roadSyntaxLabelByMetric(n)}”仍未就绪（${y.ready}/${y.total||0}）`):this.roadSyntaxSetStatus(`指标“${this.roadSyntaxLabelByMetric(n)}”仍在预处理（${y.ready}/${y.total||0}）`)}return}i&&(this.roadSyntaxMetric=n,this.roadSyntaxLastMetricTab=n),this.roadSyntaxMetricUsesRadius(n)?this.roadSyntaxHasRadiusLabel(this.roadSyntaxRadiusLabel)||(this.roadSyntaxRadiusLabel="global"):this.roadSyntaxRadiusLabel="global",this.roadSyntaxApplyRadiusCircle(n),!(d===n&&u===this.roadSyntaxMetric)&&s&&this.refreshRoadSyntaxOverlay()},roadSyntaxMetricTabs(){return(this.roadSyntaxTabs||[]).filter(t=>t.value!=="params")},roadSyntaxDefaultMetric(){const t=this.roadSyntaxMetricTabs();return t.length?String(t[0]&&t[0].value||"connectivity"):"connectivity"},roadSyntaxMetricDataCount(t=null){const e=String(t||this.resolveRoadSyntaxActiveMetric()||this.roadSyntaxDefaultMetric()),n=this.roadSyntaxSummary||{};return Number(e==="control"?n.control_valid_count||0:e==="depth"?n.depth_valid_count||0:n.edge_count||0)},isRoadSyntaxMetricAvailable(t=null){const e=String(t||this.resolveRoadSyntaxActiveMetric()||this.roadSyntaxDefaultMetric());return e!=="control"&&e!=="depth"?!0:this.roadSyntaxMetricDataCount(e)>0},roadSyntaxLabelByMetric(t){const e=String(t||"").trim(),n=this.roadSyntaxMetricTabs().find(a=>a.value===e);return n?n.label:e},roadSyntaxMetricUsesRadius(t=null){const e=t||this.roadSyntaxMetric||this.roadSyntaxDefaultMetric();return e==="choice"||e==="integration"},roadSyntaxSupportsSkeleton(t=null){return!1},onRoadSyntaxMetricChange(t){this.setRoadSyntaxMainTab(t)},formatRoadSyntaxMetricValue(t){const e=this.roadSyntaxSummary||{},n=t||this.roadSyntaxDefaultMetric();if(!this.isRoadSyntaxMetricAvailable(n))return"--";let a=NaN;if(n==="accessibility")a=Number(e.avg_accessibility_global??e.avg_closeness);else if(n==="connectivity")a=Number(e.avg_connectivity??e.avg_degree);else if(n==="control")a=Number(e.avg_control);else if(n==="depth")a=Number(e.avg_depth);else if(n==="choice"){const i=this.roadSyntaxNormalizeRadiusLabel(this.roadSyntaxRadiusLabel,n),s=e.avg_choice_by_radius&&typeof e.avg_choice_by_radius=="object"?e.avg_choice_by_radius:{};a=Number(i==="global"?e.avg_choice_global:s[i]),Number.isFinite(a)||(a=Number(e.avg_choice_global))}else if(n==="integration"){const i=this.roadSyntaxNormalizeRadiusLabel(this.roadSyntaxRadiusLabel,n),s=e.avg_integration_by_radius&&typeof e.avg_integration_by_radius=="object"?e.avg_integration_by_radius:{};a=Number(i==="global"?e.avg_integration_global:s[i]),Number.isFinite(a)||(a=Number(e.avg_integration_global))}else n==="intelligibility"&&(a=Number(e.avg_intelligibility));return Number.isFinite(a)?n==="connectivity"?a.toFixed(2):n==="intelligibility"?a.toFixed(4):a.toFixed(6):"--"},roadSyntaxRadiusOptions(){const e=(this.roadSyntaxSummary&&Array.isArray(this.roadSyntaxSummary.radius_labels)?this.roadSyntaxSummary.radius_labels:[]).map(a=>String(a||"").trim().toLowerCase()),n=[{value:"global",label:"等时圈内"}];return e.includes("r600")&&n.push({value:"r600",label:"600m"}),e.includes("r800")&&n.push({value:"r800",label:"800m"}),n},roadSyntaxHasRadiusLabel(t){const e=String(t||"").trim().toLowerCase();return e?this.roadSyntaxRadiusOptions().some(n=>String(n.value)===e):!1},roadSyntaxNormalizeRadiusLabel(t,e=null){const n=e||this.resolveRoadSyntaxActiveMetric(),a=String(t||"global").trim().toLowerCase();return this.roadSyntaxMetricUsesRadius(n)&&this.roadSyntaxHasRadiusLabel(a)?a:"global"},roadSyntaxRadiusMeters(t=null,e=null){const n=this.roadSyntaxNormalizeRadiusLabel(t??this.roadSyntaxRadiusLabel,e);return n==="r600"?600:n==="r800"?800:0},roadSyntaxApplyRadiusCircle(t=null){const e=t||this.resolveRoadSyntaxActiveMetric();let n=0;this.roadSyntaxMetricUsesRadius(e)&&(n=this.roadSyntaxRadiusMeters(this.roadSyntaxRadiusLabel,e));const a=!!(this.selectedPoint&&Number.isFinite(Number(this.selectedPoint.lng))&&Number.isFinite(Number(this.selectedPoint.lat)));this.mapCore&&typeof this.mapCore.setRadius=="function"&&this.mapCore.setRadius(n>0&&a?n:0)},setRoadSyntaxRadiusLabel(t){const e=this.resolveRoadSyntaxActiveMetric();if(!this.roadSyntaxMetricUsesRadius(e))return;const n=this.roadSyntaxNormalizeRadiusLabel(t,e);if(this.roadSyntaxHasRadiusLabel(n)){if(n===String(this.roadSyntaxRadiusLabel||"global")){this.roadSyntaxApplyRadiusCircle(e);return}this.roadSyntaxRadiusLabel=n,this.roadSyntaxApplyRadiusCircle(e),this.refreshRoadSyntaxOverlay()}},normalizeRoadSyntaxGraphModel(t=null){return String(t??this.roadSyntaxGraphModel).trim().toLowerCase()==="axial"?"axial":"segment"},roadSyntaxGraphModelLabel(t=null){return this.normalizeRoadSyntaxGraphModel(t)==="axial"?"轴线图":"线段图"},async fetchRoadSyntaxApi(t,e={}){const n=e&&e.signal?e.signal:void 0,a=await fetch("/api/v1/analysis/road-syntax",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t),signal:n});if(!a.ok){let i="";try{const s=await a.json();s&&typeof s=="object"&&(typeof s.detail=="string"&&s.detail.trim()?i=s.detail.trim():i=JSON.stringify(s))}catch{try{i=await a.text()}catch{}}throw new Error(i||"路网分析失败")}return await a.json()},async applyRoadSyntaxDataset(t,e="connectivity"){if(this.invalidateRoadSyntaxCache("switch-road-syntax-scope",{resetData:!1,resetPerf:!1}),this.applyRoadSyntaxResponseData(t,e),!this.roadSyntaxSummary)return;const n=this.roadSyntaxLastMetricTab||this.roadSyntaxMetric||this.roadSyntaxDefaultMetric();this.setRoadSyntaxMainTab(n,{refresh:!1,syncMetric:!0}),this.activeStep3Panel==="syntax"&&await this.renderRoadSyntaxByMetric(n)},resolveRoadSyntaxRequestMetric(){return this.roadSyntaxMetric==="choice"?"choice":"integration"},clamp01(t){return Math.max(0,Math.min(1,Number(t)||0))},blendTwoColor(t,e,n){const a=Array.isArray(t)?t:[0,0,0],i=Array.isArray(e)?e:[0,0,0],s=this.clamp01(n),d=Math.round(a[0]+(i[0]-a[0])*s),u=Math.round(a[1]+(i[1]-a[1])*s),y=Math.round(a[2]+(i[2]-a[2])*s),S=p=>{const x=Math.max(0,Math.min(255,p)).toString(16);return x.length===1?"0"+x:x};return`#${S(d)}${S(u)}${S(y)}`},blendPaletteColor(t,e){const n=Array.isArray(t)&&t.length?t:[[0,0,0],[255,255,255]],a=this.clamp01(e),i=S=>{const p=Math.max(0,Math.min(255,S)).toString(16);return p.length===1?"0"+p:p};if(n.length===1){const S=n[0];return`#${i(S[0])}${i(S[1])}${i(S[2])}`}const s=Math.min(n.length-2,Math.floor(a*(n.length-1))),d=s/(n.length-1),u=(s+1)/(n.length-1),y=(a-d)/Math.max(1e-9,u-d);return this.blendTwoColor(n[s],n[s+1],y)},onRoadSyntaxDisplayRangeChange(){const t=this.clamp01(Number(this.roadSyntaxDisplayBlue)),e=this.clamp01(Number(this.roadSyntaxDisplayRed));this.roadSyntaxDisplayBlue=Number.isFinite(t)?t:0,this.roadSyntaxDisplayRed=Number.isFinite(e)?e:1,this.roadSyntaxMainTab!=="params"&&this.refreshRoadSyntaxOverlay()},roadSyntaxDepthmapColorSchemes(){return{axmanesque:["#3333dd","#3388dd","#22ccdd","#22ccbb","#22dd88","#88dd22","#bbcc22","#ddcc22","#dd8833","#dd3333"],hueonlyaxmanesque:["#3333dd","#3377dd","#33bbdd","#33ddbb","#33dd55","#55dd33","#bbdd33","#ddbb33","#dd7733","#dd3333"],bluered:["#4575b4","#91bfdb","#e0f3f8","#ffffbf","#fee090","#fc8d59","#d73027"],purpleorange:["#542788","#998ec3","#d8daeb","#f7f7f7","#fee0b6","#f1a340","#b35806"],greyscale:["#000000","#444444","#777777","#aaaaaa","#cccccc","#eeeeee","#ffffff"],monochrome:["#000000","#444444","#777777","#aaaaaa","#cccccc","#eeeeee","#ffffff"]}},roadSyntaxDepthmapColorScaleOptions(){return[{value:"axmanesque",label:"Equal Ranges (3-Colour)"},{value:"bluered",label:"Equal Ranges (Blue-Red)"},{value:"purpleorange",label:"Equal Ranges (Purple-Orange)"},{value:"depthmapclassic",label:"depthmapX Classic"},{value:"greyscale",label:"Equal Ranges (Greyscale)"},{value:"monochrome",label:"Equal Ranges (Monochrome)"},{value:"hueonlyaxmanesque",label:"Equal Ranges (3-Colour Hue Only)"}]},roadSyntaxDepthmapColorScaleLabel(){const t=String(this.roadSyntaxDepthmapColorScale||"axmanesque"),n=this.roadSyntaxDepthmapColorScaleOptions().find(a=>String(a.value)===t);return n?n.label:"Equal Ranges (3-Colour)"},roadSyntaxDepthmapDisplayParams(){const t=this.clamp01(Number(this.roadSyntaxDisplayBlue)),e=this.clamp01(Number(this.roadSyntaxDisplayRed));let n=t,a=e,i=!1;return n>a&&(i=!0,n=1-t,a=1-e),{rawBlue:t,rawRed:e,blue:this.clamp01(n),red:this.clamp01(a),inverted:i}},roadSyntaxDepthmapPalette(){const t=this.roadSyntaxDepthmapColorSchemes(),e=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase();return Array.isArray(t[e])&&t[e].length?t[e]:t.axmanesque},roadSyntaxDepthmapClassIndex(t,e){const n=Math.max(1,Number(e)||1),a=this.clamp01(t),i=Math.floor((a-1e-9)*n);return Math.max(0,Math.min(n-1,i))},roadSyntaxDepthmapScaledField(t){if(!Number.isFinite(Number(t)))return NaN;const e=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase(),n=this.roadSyntaxDepthmapDisplayParams();let a=this.clamp01(Number(t));if(n.inverted&&(a=1-a),e==="depthmapclassic")return a;const i=n.red-n.blue;if(!(i>1e-9))return .5;const s=(a-n.blue)/i;return Number.isFinite(s)?this.clamp01(s):.5},roadSyntaxNormalizeScoreByRange(t,e,n){const a=Number(t),i=Number(e),s=Number(n);return Number.isFinite(a)?!Number.isFinite(i)||!Number.isFinite(s)||s<=i?this.clamp01(a):this.clamp01((a-i)/Math.max(1e-9,s-i)):0},roadSyntaxDepthmapClassicByte(t){const e=this.clamp01(t),n=Math.floor((e+.0333)*15);return Math.max(0,Math.min(255,n*17))},roadSyntaxDepthmapClassicColor(t,e=null,n=null){const a=this.clamp01(t),i=this.roadSyntaxDepthmapDisplayParams(),s=Number.isFinite(Number(e))?this.clamp01(Number(e)):i.blue,d=Number.isFinite(Number(n))?this.clamp01(Number(n)):i.red,u=s+(d-s)/10;let y=0,S=0,p=0;a>=0&&a<s?(y=this.roadSyntaxDepthmapClassicByte(.5*(s-a)/Math.max(1e-9,s)),p=255):a>=s&&a<(u+s)/2?(p=255,S=this.roadSyntaxDepthmapClassicByte(2*(a-s)/Math.max(1e-9,u-s))):a>=(u+s)/2&&a<u?(p=this.roadSyntaxDepthmapClassicByte(2*(u-a)/Math.max(1e-9,u-s)),S=255):a>=u&&a<(u+d)/2?(S=255,y=this.roadSyntaxDepthmapClassicByte(2*(a-u)/Math.max(1e-9,d-u))):a>=(u+d)/2&&a<d?(S=this.roadSyntaxDepthmapClassicByte(2*(d-a)/Math.max(1e-9,d-u)),y=255):(y=255,p=this.roadSyntaxDepthmapClassicByte(.5*(a-d)/Math.max(1e-9,1-d)));const x=m=>{const R=Math.max(0,Math.min(255,Number(m)||0)).toString(16);return R.length===1?`0${R}`:R};return`#${x(y)}${x(S)}${x(p)}`},roadSyntaxDepthmapClassColor(t,e=null){const n=Array.isArray(e)&&e.length?e:this.roadSyntaxDepthmapPalette(),a=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase();if(!Number.isFinite(Number(t)))return a==="monochrome"||a==="greyscale"?"rgba(0,0,0,0)":"#7f7f7f";const i=this.roadSyntaxDepthmapScaledField(t);if(a==="depthmapclassic"){const d=this.roadSyntaxDepthmapDisplayParams();return this.roadSyntaxDepthmapClassicColor(i,d.blue,d.red)}const s=this.roadSyntaxDepthmapClassIndex(i,n.length);return String(n[s]||"#3333dd")},roadSyntaxEqualRangeLegendItems(t,e=null){const n=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase(),a=Array.isArray(e)&&e.length?e:this.roadSyntaxDepthmapPalette(),i=n==="depthmapclassic"?new Array(10).fill(0).map((x,m)=>this.roadSyntaxDepthmapClassColor((m+.5)/10,a)):a,s=(Array.isArray(t)?t:[]).map(x=>Number(x)).filter(x=>Number.isFinite(x)).sort((x,m)=>x-m);if(!s.length)return i.map((x,m)=>({color:x,label:`等级 ${m+1}`}));const d=s[0],u=s[s.length-1];if(!(u>d))return i.map((x,m)=>({color:x,label:m===0?`${d.toFixed(2)}`:"-"}));const y=u-d,S=i,p=this.roadSyntaxDepthmapDisplayParams();return S.map((x,m)=>{let R=m/S.length,k=(m+1)/S.length;n!=="depthmapclassic"&&(R=p.blue+(p.red-p.blue)*R,k=p.blue+(p.red-p.blue)*k);const v=d+y*this.clamp01(R),f=d+y*this.clamp01(k);return{color:x,label:`${v.toFixed(2)} - ${f.toFixed(2)}`}})},roadSyntaxSummarizeCoordInput(t){if(t===null)return{type:"null"};if(typeof t>"u")return{type:"undefined"};if(typeof t=="string")return{type:"string",value:String(t).slice(0,80)};if(Array.isArray(t))return{type:"array",length:t.length,head:t.slice(0,2)};if(typeof t=="object"){const e={type:"object"};return Object.prototype.hasOwnProperty.call(t,"lng")&&(e.lng=t.lng),Object.prototype.hasOwnProperty.call(t,"lat")&&(e.lat=t.lat),Object.prototype.hasOwnProperty.call(t,"lon")&&(e.lon=t.lon),typeof t.getLng=="function"&&(e.getLng=!0),typeof t.getLat=="function"&&(e.getLat=!0),e}return{type:typeof t,value:t}},roadSyntaxLogInvalidCoordInput(t="",e=null){const n=String(t||"unknown");this._roadSyntaxInvalidCoordStats||(this._roadSyntaxInvalidCoordStats=Object.create(null));const a=this._roadSyntaxInvalidCoordStats;a[n]||(a[n]={count:0}),a[n].count+=1;const i=a[n].count;i<=5?console.warn("[road-syntax] invalid coordinate input",{source:n,count:i,sample:this.roadSyntaxSummarizeCoordInput(e)}):i%100===0&&console.warn("[road-syntax] invalid coordinate input aggregated",{source:n,count:i})},normalizeLngLat(t,e=""){let n=NaN,a=NaN;if(Array.isArray(t)&&t.length>=2)n=Number(t[0]),a=Number(t[1]);else if(t&&typeof t=="object")typeof t.getLng=="function"&&typeof t.getLat=="function"?(n=Number(t.getLng()),a=Number(t.getLat())):Object.prototype.hasOwnProperty.call(t,"lng")&&Object.prototype.hasOwnProperty.call(t,"lat")?(n=Number(t.lng),a=Number(t.lat)):Object.prototype.hasOwnProperty.call(t,"lon")&&Object.prototype.hasOwnProperty.call(t,"lat")&&(n=Number(t.lon),a=Number(t.lat));else if(typeof t=="string"){const i=t.split(",");i.length>=2&&(n=Number(i[0].trim()),a=Number(i[1].trim()))}return!Number.isFinite(n)||!Number.isFinite(a)?(this.roadSyntaxLogInvalidCoordInput(e||"normalize_lnglat",t),null):n<-180||n>180||a<-90||a>90?(this.roadSyntaxLogInvalidCoordInput(e||"normalize_lnglat_range",{input:this.roadSyntaxSummarizeCoordInput(t),lng:n,lat:a}),null):[n,a]},normalizePath(t,e=2,n=""){const a=Array.isArray(t)?t:[],i=[];return a.forEach(s=>{const d=this.normalizeLngLat(s,n||"normalize_path");d&&i.push(d)}),i.length>=e?i:[]},resolveRoadSyntaxActiveMetric(){const t=this.roadSyntaxDefaultMetric(),e=this.roadSyntaxMetricTabs().map(s=>String(s.value||"")),n=this.roadSyntaxMainTab==="params"?this.roadSyntaxLastMetricTab||this.roadSyntaxMetric:this.roadSyntaxMetric,a=String(n||"").trim();if(e.includes(a))return a;const i=String(this.roadSyntaxMetric||"").trim();return e.includes(i)?i:t},resolveRoadSyntaxMetricField(t=null,e=null){const n=t||this.resolveRoadSyntaxActiveMetric(),a=this.roadSyntaxNormalizeRadiusLabel(e??this.roadSyntaxRadiusLabel,n);return n==="connectivity"?"connectivity_score":n==="control"?"control_score":n==="depth"?"depth_score":n==="intelligibility"?"intelligibility_score":n==="choice"?a==="global"?"choice_global":`choice_${a}`:n==="integration"?a==="global"?"integration_global":`integration_${a}`:"connectivity_score"},resolveRoadSyntaxLayerKey(t=null,e={}){const n=t||this.resolveRoadSyntaxActiveMetric(),a=e&&Object.prototype.hasOwnProperty.call(e,"skeletonOnly")?!!e.skeletonOnly:!!this.roadSyntaxSkeletonOnly,i=e&&Object.prototype.hasOwnProperty.call(e,"radiusLabel")?String(e.radiusLabel||"global"):this.roadSyntaxMetricUsesRadius(n)?String(this.roadSyntaxRadiusLabel||"global"):"global",s=this.roadSyntaxNormalizeRadiusLabel(i,n),u=(typeof this.roadSyntaxSupportsSkeleton=="function"?!!this.roadSyntaxSupportsSkeleton(n):n==="choice"||n==="integration")?a:!1,y=this.roadSyntaxMetricUsesRadius(n)?s:"global";return`${n}|${y}|${u?1:0}`},parseRoadSyntaxLayerKey(t){const e=String(t||"").split("|"),n=e[0]||this.roadSyntaxDefaultMetric(),a=e[1]||"global",i=e[2]==="1";return{metric:n,radiusLabel:a,skeletonOnly:i}},roadSyntaxLayerKeysForPrebuild(){const t=this.roadSyntaxRadiusOptions().map(a=>String(a.value||"global")),e=t.map(a=>this.resolveRoadSyntaxLayerKey("choice",{radiusLabel:a,skeletonOnly:!1})),n=t.map(a=>this.resolveRoadSyntaxLayerKey("integration",{radiusLabel:a,skeletonOnly:!1}));return[this.resolveRoadSyntaxLayerKey("connectivity",{radiusLabel:"global",skeletonOnly:!1}),this.resolveRoadSyntaxLayerKey("control",{radiusLabel:"global",skeletonOnly:!1}),this.resolveRoadSyntaxLayerKey("depth",{radiusLabel:"global",skeletonOnly:!1}),...e,...n,this.resolveRoadSyntaxLayerKey("intelligibility",{radiusLabel:"global",skeletonOnly:!1})]},resolveRoadSyntaxRankField(t){return t==="choice"?"rank_quantile_choice":t==="integration"?"rank_quantile_integration":t==="accessibility"?"rank_quantile_accessibility":""},roadSyntaxScoreFromProps(t,e,n){const a=d=>{if(!t||typeof t!="object")return NaN;if(!Object.prototype.hasOwnProperty.call(t,d))return NaN;const u=t[d];if(u===null||typeof u>"u"||u==="")return NaN;const y=Number(u);return Number.isFinite(y)?y:NaN},i=a(e),s=a(n);return Number.isFinite(i)?this.clamp01(i):Number.isFinite(s)?this.clamp01(s):NaN},roadSyntaxQuantileBreakLabels(t){const e=(Array.isArray(t)?t:[]).map(a=>Number(a)).filter(a=>Number.isFinite(a)).sort((a,i)=>a-i);if(!e.length)return["P10 --","P30 --","P70 --","P90 --"];const n=a=>{const i=Math.max(0,Math.min(1,a));if(e.length===1)return e[0];const s=i*(e.length-1),d=Math.floor(s),u=Math.min(e.length-1,d+1),y=s-d;return e[d]+(e[u]-e[d])*y};return[`P10 ${n(.1).toFixed(2)}`,`P30 ${n(.3).toFixed(2)}`,`P70 ${n(.7).toFixed(2)}`,`P90 ${n(.9).toFixed(2)}`]},buildRoadSyntaxLegendModel(t){const e=t||this.resolveRoadSyntaxActiveMetric(),n=this.resolveRoadSyntaxMetricField(e),a=this.resolveRoadSyntaxFallbackField(e),i=this.roadSyntaxDepthmapPalette(),s=this.roadSyntaxDepthmapColorScaleLabel();let u=(Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems:[]).map(y=>this.roadSyntaxScoreFromProps(y&&y.props||{},n,a));return u.length||(u=(Array.isArray(this.roadSyntaxRoadFeatures)?this.roadSyntaxRoadFeatures:[]).map(S=>this.roadSyntaxScoreFromProps(S&&S.properties||{},n,a))),e==="accessibility"?{type:"discrete",title:`可达性（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,i)}:e==="integration"?{type:"discrete",title:`整合度（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,i)}:e==="choice"?{type:"discrete",title:`选择度（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,i)}:e==="connectivity"?{type:"discrete",title:`连接度（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,i)}:e==="control"?{type:"discrete",title:`控制值（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,i)}:e==="depth"?{type:"discrete",title:`深度值（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,i)}:{type:"discrete",title:"可理解度（散点回归）",items:[{label:"样本点",color:"#2563eb"},{label:"回归线",color:"#dc2626"}]}},roadSyntaxFootnoteByMetric(t=null){const e=t||this.resolveRoadSyntaxActiveMetric(),n=this.roadSyntaxDepthmapColorScaleLabel(),a=this.roadSyntaxDepthmapDisplayParams(),i=`(Blue=${a.rawBlue.toFixed(2)}, Red=${a.rawRed.toFixed(2)})`;if(e==="connectivity")return`连接度采用 depthmapX ${n} ${i} 的线段着色图表达，不启用节点点层。`;if(e==="control"){const s=String(this.roadSyntaxSummary&&this.roadSyntaxSummary.control_source_column||"");return this.isRoadSyntaxMetricAvailable("control")?s==="topology_fallback"?"控制值当前采用拓扑回退计算（depthmap 控制列不可用或近常量），用于保障稳定显示。":`控制值采用 depthmapX ${n} ${i} 的线段着色表达。`:`控制值当前无有效样本${s?`（列：${s}）`:""}，请检查 depthmap 输出列与分析参数。`}if(e==="depth"){if(!this.isRoadSyntaxMetricAvailable("depth")){const s=String(this.roadSyntaxSummary&&this.roadSyntaxSummary.depth_source_column||"");return`深度值当前无有效样本${s?`（列：${s}）`:""}，请检查 depthmap 输出列与分析参数。`}return`深度值采用 depthmapX ${n} ${i} 的线段着色表达。`}return e==="choice"?`选择度采用 depthmapX ${n} ${i} 的线段着色表达。`:e==="integration"?`整合度采用 depthmapX ${n} ${i} 的线段着色表达网络中心性。`:e==="intelligibility"?"可理解度主表达为散点回归图（x=连接度，y=整合度）；地图蓝线为网络参考层。":`连接度采用 depthmapX ${n} ${i} 的线段着色表达。`},roadSyntaxRegressionView(){const t=this.roadSyntaxDiagnostics||{},e=t.regression||{},n=this.roadSyntaxSummary||{},a=Number(e.r),i=Number(e.r2),s=Number(e.n),d=Number(n.avg_intelligibility),u=Number(n.avg_intelligibility_r2);return{r:Number.isFinite(a)?a.toFixed(4):Number.isFinite(d)?d.toFixed(4):"--",r2:Number.isFinite(i)?i.toFixed(4):Number.isFinite(u)?u.toFixed(4):"--",n:Number.isFinite(s)?String(Math.round(s)):String((t.intelligibility_scatter||[]).length||0),slope:Number.isFinite(Number(e.slope))?Number(e.slope):0,intercept:Number.isFinite(Number(e.intercept))?Number(e.intercept):0}},buildRoadSyntaxStyleForMetric(t,e,n,a,i=null){const s=this.roadSyntaxScoreFromProps(t,e,n),d=a||this.resolveRoadSyntaxActiveMetric(),y=(typeof this.roadSyntaxSupportsSkeleton=="function"?!!this.roadSyntaxSupportsSkeleton(d):d==="choice"||d==="integration")&&(i===null?!!this.roadSyntaxSkeletonOnly:!!i),S=this.roadSyntaxDepthmapPalette(),p=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase(),x=this.roadSyntaxDepthmapClassColor(s,S),m=2.1,v=!Number.isFinite(Number(s))&&(p==="monochrome"||p==="greyscale")?0:.88;if(d==="accessibility")return{strokeColor:x,strokeWeight:m,strokeOpacity:v,zIndex:90};if(d==="integration"){const f=!!(t&&t.is_skeleton_integration_top20);return y&&!f?{strokeColor:"#a1a1aa",strokeWeight:1.5,strokeOpacity:.15,zIndex:82}:{strokeColor:x,strokeWeight:m,strokeOpacity:v,zIndex:91}}if(d==="choice"){const f=!!(t&&t.is_skeleton_choice_top20);return y&&!f?{strokeColor:"#9ca3af",strokeWeight:1.5,strokeOpacity:.15,zIndex:82}:{strokeColor:x,strokeWeight:m,strokeOpacity:v,zIndex:92}}return d==="connectivity"?{strokeColor:x,strokeWeight:m,strokeOpacity:v,zIndex:80}:d==="control"?{strokeColor:x,strokeWeight:m,strokeOpacity:v,zIndex:81}:d==="depth"?{strokeColor:x,strokeWeight:m,strokeOpacity:v,zIndex:81}:d==="intelligibility"?{strokeColor:"#2563eb",strokeWeight:2.2,strokeOpacity:.62,zIndex:79}:{strokeColor:"#9ca3af",strokeWeight:1.4,strokeOpacity:.22,zIndex:79}},refreshRoadSyntaxOverlay(){if(this.roadSyntaxMainTab==="params")return;const t=this.resolveRoadSyntaxActiveMetric();if(t==="intelligibility"){const i=this.parseRoadSyntaxLayerKey(this.roadSyntaxActiveLayerKey||""),s=String(i&&i.metric||"");if((typeof this.roadSyntaxIsArcgisWebglActive=="function"?this.roadSyntaxIsArcgisWebglActive():!!this.roadSyntaxWebglActive)&&s==="intelligibility"){this.roadSyntaxLegendModel=this.buildRoadSyntaxLegendModel(t),this.$nextTick(()=>this.scheduleRoadSyntaxScatterRender(0));return}}const e=this.roadSyntaxSupportsSkeleton(t),n=e?!!this.roadSyntaxSkeletonOnly:!1;if(!e&&this.roadSyntaxSkeletonOnly&&(this.roadSyntaxSkeletonOnly=!1),!this.isRoadSyntaxMetricReady(t,{skeletonOnly:n})){if(this.roadSyntaxStrictWebglOnly)this.roadSyntaxSetStatus(this.buildRoadSyntaxWebglUnavailableMessage(this.roadSyntaxWebglPayload));else{const i=this.roadSyntaxLayerReadyCounts();this.roadSyntaxSetStatus(`目标图层仍在预处理（${i.ready}/${i.total||0}）`)}return}this.renderRoadSyntaxByMetric(this.resolveRoadSyntaxActiveMetric())},async renderRoadSyntaxByMetric(t=null){const e=t||this.resolveRoadSyntaxActiveMetric();this.roadSyntaxApplyRadiusCircle(e);const n=this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload);if(n&&typeof this.renderRoadSyntaxArcgisWebgl=="function"){let a=!1;try{a=await this.renderRoadSyntaxArcgisWebgl(this.roadSyntaxWebglPayload,{hideWhenSuspended:!0})}catch(i){a=!1,console.warn("[road-syntax] arcgis webgl render failed",i)}if(a){this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1),e==="intelligibility"?this.$nextTick(()=>this.scheduleRoadSyntaxScatterRender(0)):this.disposeRoadSyntaxScatterChart(),this.roadSyntaxLegendModel=this.buildRoadSyntaxLegendModel(e);return}}if(this.clearRoadSyntaxOverlays(),this.roadSyntaxLegendModel=null,this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1),this.disposeRoadSyntaxScatterChart(),n){const a=String(this.roadSyntaxWebglStatus||"").trim();this.roadSyntaxSetStatus(a?`ArcGIS-WebGL 渲染失败（已禁用旧版回退）: ${a}`:"ArcGIS-WebGL 渲染失败（已禁用旧版回退）")}else this.roadSyntaxSetStatus(this.buildRoadSyntaxWebglUnavailableMessage(this.roadSyntaxWebglPayload))},resolveRoadSyntaxFallbackField(t){let e="connectivity_score";return t==="choice"?e="choice_score":t==="integration"?e="integration_score":t==="connectivity"?e="degree_score":t==="control"?e="control_score":t==="depth"?e="depth_score":t==="intelligibility"&&(e="intelligibility_score"),e},renderRoadSyntaxNodeMarkers(t={}){if(!this.mapCore||!this.mapCore.map||!window.AMap)return;const e=!!(t&&t.forceRebuild);if(!this.shouldRenderRoadSyntaxConnectivityNodes()){this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1);return}let n=Array.isArray(this.roadSyntaxNodes)?this.roadSyntaxNodes:[];if(!n.length){const m={};(this.roadSyntaxPolylineItems||[]).forEach(R=>{const k=Array.isArray(R&&R.coords)?R.coords:[],v=R&&R.props||{},f=this.clamp01(Number(v.degree_score));[k[0],k[k.length-1]].forEach(A=>{const P=this.normalizeLngLat(A,"road_syntax.node_fallback.endpoint");if(!P)return;const L=`${P[0].toFixed(6)},${P[1].toFixed(6)}`,T=m[L];(!T||f>T.score)&&(m[L]={loc:P,score:f})})}),n=Object.keys(m).map(R=>({geometry:{coordinates:m[R].loc},properties:{degree_score:m[R].score,degree:Math.round(m[R].score*10),integration_global:0}}))}if(!n.length){this.clearRoadSyntaxNodeMarkers({immediate:!0});return}const a=Number(this.mapCore.map.getZoom?this.mapCore.map.getZoom():NaN);let i=n;if(Number.isFinite(a)&&a<16&&n.length>2200){const m=Math.max(1,Math.ceil(n.length/1800));i=n.filter((R,k)=>k%m===0)}const s=this.normalizeLngLat(((i[0]||{}).geometry||{}).coordinates||[],"road_syntax.node_fingerprint.first")||[0,0],d=this.normalizeLngLat(((i[i.length-1]||{}).geometry||{}).coordinates||[],"road_syntax.node_fingerprint.last")||[0,0],u=`${i.length}|${s[0].toFixed(6)},${s[1].toFixed(6)}|${d[0].toFixed(6)},${d[1].toFixed(6)}`;if(!e&&u===this.roadSyntaxNodeSourceFingerprint&&Array.isArray(this.roadSyntaxNodeMarkers)&&this.roadSyntaxNodeMarkers.length){this.setRoadSyntaxNodeMarkersVisible(!0);return}this.clearRoadSyntaxNodeMarkers({immediate:!0});const y=this.roadSyntaxNodeBuildToken+1;this.roadSyntaxNodeBuildToken=y,this.roadSyntaxNodeBuildRunning=!0;const S=[];let p=0;const x=()=>{if(y!==this.roadSyntaxNodeBuildToken){this.roadSyntaxEnqueueMapWrite(()=>(S.forEach(f=>this.safeMapSet(f,null)),{ok:!0,marker_count:S.length}),{key:`road_syntax_node_build_abort:${y}`,replaceExisting:!1,meta:{reason:"road_syntax_node_build_abort",marker_count:S.length}});return}if(!this.shouldRenderRoadSyntaxConnectivityNodes()){this.roadSyntaxEnqueueMapWrite(()=>(S.forEach(f=>this.safeMapSet(f,null)),{ok:!0,marker_count:S.length}),{key:`road_syntax_node_build_hidden:${y}`,replaceExisting:!1,meta:{reason:"road_syntax_node_build_hidden",marker_count:S.length}}),this.roadSyntaxNodeBuildRunning=!1;return}const m=window.performance&&typeof window.performance.now=="function"?()=>window.performance.now():()=>Date.now(),R=m(),k=this.roadSyntaxResolveFrameBudget("node"),v=[];for(;p<i.length;){const f=i[p]||{};p+=1;const _=this.normalizeLngLat(((f||{}).geometry||{}).coordinates||[],"road_syntax.node_marker.center");if(!_)continue;const A=f&&f.properties||{},P=this.clamp01(Number(A.degree_score)),L=new AMap.CircleMarker({center:_,radius:3+P*7,strokeColor:"#ffffff",strokeWeight:1,fillColor:this.blendTwoColor([203,213,225],[153,27,27],P),fillOpacity:.88,zIndex:115,bubble:!0,clickable:!1,cursor:"default"});if(S.push(L),v.push(L),m()-R>=k)break}if(v.length){const f=v.length,_=p;this.roadSyntaxEnqueueMapWrite(()=>{if(y!==this.roadSyntaxNodeBuildToken)return v.forEach(P=>this.safeMapSet(P,null)),{ok:!1,skipped:!0,reason:"stale_node_build_chunk"};const A=this.mapCore&&this.mapCore.map&&this.shouldRenderRoadSyntaxConnectivityNodes()?this.mapCore.map:null;return v.forEach(P=>this.safeMapSet(P,A)),{ok:!0,marker_count:f,visible:!!A}},{key:`road_syntax_node_build_chunk:${y}:${_}`,replaceExisting:!1,meta:{reason:"road_syntax_node_build_chunk",marker_count:f}})}if(this.roadSyntaxNodeMarkers=S,p<i.length){window.requestAnimationFrame(x);return}this.roadSyntaxNodeBuildRunning=!1,this.roadSyntaxNodeSourceFingerprint=u,this.setRoadSyntaxNodeMarkersVisible(!0)};window.requestAnimationFrame(x)},renderRoadSyntaxScatterChart(){if(this.roadSyntaxMainTab!=="intelligibility")return this.disposeRoadSyntaxScatterChart(),!1;if(!window.echarts)return this.roadSyntaxSetStatus("可理解度图表库未加载（echarts）"),!1;const t=document.getElementById("roadSyntaxScatterChart");if(!t||t.clientWidth===0||t.clientHeight===0)return!1;const e=this.roadSyntaxDiagnostics||{};let n=this.normalizeRoadSyntaxScatterPoints(e.intelligibility_scatter);if(!n.length&&Array.isArray(this.roadSyntaxScatterPointsCache)&&this.roadSyntaxScatterPointsCache.length&&(n=this.normalizeRoadSyntaxScatterPoints(this.roadSyntaxScatterPointsCache)),n.length||(n=this.buildRoadSyntaxScatterFallbackPoints()),n.length&&(this.roadSyntaxScatterPointsCache=n.slice()),!n.length){this.roadSyntaxSetStatus("可理解度样本为空（暂无可回归数据）");let y=this.roadSyntaxScatterChart;return(!y||y.isDisposed())&&(y=echarts.getInstanceByDom(t)||echarts.init(t),this.roadSyntaxScatterChart=y),y.setOption({animation:!1,xAxis:{show:!1,min:0,max:1},yAxis:{show:!1,min:0,max:1},series:[],graphic:[{type:"text",left:"center",top:"middle",style:{text:"暂无可理解度样本点",fill:"#6b7280",fontSize:13}}]},!0),y.resize(),!0}let a=this.roadSyntaxScatterChart;(!a||a.isDisposed())&&(a=echarts.getInstanceByDom(t)||echarts.init(t),this.roadSyntaxScatterChart=a);const i=this.roadSyntaxRegressionView(),s=Math.min(...n.map(y=>y[0])),d=Math.max(...n.map(y=>y[0])),u=Number.isFinite(i.slope)&&Number.isFinite(i.intercept)?[[s,i.slope*s+i.intercept],[d,i.slope*d+i.intercept]]:[];try{a.setOption({animation:!1,grid:{left:42,right:16,top:20,bottom:34},xAxis:{type:"value",name:"连接度",nameLocation:"middle",nameGap:26,splitLine:{lineStyle:{color:"#eef2f7"}}},yAxis:{type:"value",name:"整合度",nameGap:14,splitLine:{lineStyle:{color:"#eef2f7"}}},series:[{type:"scatter",data:n,symbolSize:6,z:3,itemStyle:{color:"#2563eb",opacity:.82,borderColor:"#ffffff",borderWidth:.8},emphasis:{scale:!1}},{type:"line",data:u,showSymbol:!1,z:2,lineStyle:{width:2,color:"#dc2626",opacity:u.length?.9:0}}],graphic:[]},!0)}catch(y){console.warn("[road-syntax] scatter setOption failed, retry with simplified series",y),a.clear(),a.setOption({animation:!1,grid:{left:42,right:16,top:20,bottom:34},xAxis:{type:"value",name:"连接度",nameLocation:"middle",nameGap:26},yAxis:{type:"value",name:"整合度",nameGap:14},series:[{type:"scatter",data:n,symbolSize:6,itemStyle:{color:"#2563eb",opacity:.85},emphasis:{scale:!1}}],graphic:[]},!0)}return a.resize(),String(this.roadSyntaxStatus||"").indexOf("可理解度样本为空")>=0&&this.roadSyntaxSetStatus(""),!0},normalizeRoadSyntaxScatterPoints(t){const e=Array.isArray(t)?t:[],n=[];if(e.forEach(a=>{let i=NaN,s=NaN;Array.isArray(a)?(i=Number(a[0]),s=Number(a[1])):a&&typeof a=="object"&&(i=Number(a.x),Number.isFinite(i)||(i=Number(a.connectivity_score??a.connectivity??a.degree_score??a.degree)),s=Number(a.y),Number.isFinite(s)||(s=Number(a.integration_global??a.integration_score??a.integration))),Number.isFinite(i)&&Number.isFinite(s)&&n.push([i,s])}),n.length>8e3){const a=Math.max(1,Math.ceil(n.length/8e3));return n.filter((i,s)=>s%a===0)}return n},buildRoadSyntaxScatterFallbackPoints(){let t=[];const e=Array.isArray(this.roadSyntaxNodes)?this.roadSyntaxNodes:[];if(e.length&&(t=e.map(n=>{const a=n&&n.properties||{};return[Number.isFinite(Number(a.degree_score))?Number(a.degree_score):Number(a.degree),Number(a.integration_global)]}).filter(n=>Number.isFinite(n[0])&&Number.isFinite(n[1]))),t.length||(t=(Array.isArray(this.roadSyntaxRoadFeatures)?this.roadSyntaxRoadFeatures:[]).map(a=>{const i=a&&a.properties||{};return[Number(i.connectivity_score),Number(i.integration_global)]}).filter(a=>Number.isFinite(a[0])&&Number.isFinite(a[1]))),t.length>8e3){const n=Math.max(1,Math.ceil(t.length/8e3));t=t.filter((a,i)=>i%n===0)}return t},buildRoadSyntaxRenderItems(t){const e=[];let n=0;const a=[];return(Array.isArray(t)?t:[]).forEach((i,s)=>{const d=this.normalizePath(((i||{}).geometry||{}).coordinates||[],2,"road_syntax.render_items.path");if(!d.length){if(n+=1,a.length<5){const u=(i||{}).properties||{};a.push({idx:s,id:u.edge_id||u.id||"",name:u.name||""})}return}e.push({coords:d,boundsRect:this.buildRoadSyntaxBoundsRect(d),props:(i||{}).properties||{}})}),n>0&&console.warn("[road-syntax] skipped invalid road geometries",{invalid_count:n,total_features:Array.isArray(t)?t.length:0,samples:a}),e},buildRoadSyntaxRenderFingerprint(t){const e=Array.isArray(t)?t:[];if(!e.length)return"0";const n=e[0]||{},a=e[e.length-1]||{},i=this.normalizeLngLat((n.coords||[])[0],"road_syntax.render_fingerprint.first")||[0,0],s=a.coords||[],d=this.normalizeLngLat(s[s.length-1],"road_syntax.render_fingerprint.last")||[0,0];return`${e.length}|${i[0].toFixed(6)},${i[1].toFixed(6)}|${d[0].toFixed(6)},${d[1].toFixed(6)}`},rebuildRoadSyntaxBasePolylines(){return this.roadSyntaxPolylines=[],this.roadSyntaxLayerLodIndexCache={},this.roadSyntaxTargetVisibleLineSet={},this.roadSyntaxAppliedVisibleLineSet={},this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxResetLodScoreCache(),this.roadSyntaxResetSpatialIndex(),[]},isRoadSyntaxLayerReady(t){if(this.roadSyntaxStrictWebglOnly)return!!(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload));if(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload))return!0;const e=this.roadSyntaxLayerBuildState||{};return!!(this.roadSyntaxLayerStyleCache||{})[t]&&e[t]==="ready"},enqueueRoadSyntaxLayerBuild(t,e={}){if(this.roadSyntaxStrictWebglOnly||!this.roadSyntaxMap()||!window.AMap||!Array.isArray(this.roadSyntaxPolylineItems)||!this.roadSyntaxPolylineItems.length)return;const n=!!(e&&e.priority),a=!!(e&&e.switchOnReady),i=Object.assign({},this.roadSyntaxLayerBuildState||{}),s=Array.isArray(this.roadSyntaxLayerBuildQueue)?this.roadSyntaxLayerBuildQueue.slice():[],d=i[t];if(d==="ready"){a&&(this.roadSyntaxPendingLayerKey=t,this.switchRoadSyntaxLayerByKey(t));return}if(d==="building"||d==="queued"){a&&(this.roadSyntaxPendingLayerKey=t);return}i[t]="queued",n?s.unshift(t):s.push(t),a&&(this.roadSyntaxPendingLayerKey=t),this.roadSyntaxLayerBuildState=i,this.roadSyntaxLayerBuildQueue=s,this.scheduleRoadSyntaxLayerBuilder()},scheduleRoadSyntaxLayerBuilder(){if(this.roadSyntaxLayerBuildRunning)return;const t=Array.isArray(this.roadSyntaxLayerBuildQueue)?this.roadSyntaxLayerBuildQueue:[];if(!t.length)return;const e=t.shift();this.roadSyntaxLayerBuildQueue=t;const n=Object.assign({},this.roadSyntaxLayerBuildState||{});n[e]="building",this.roadSyntaxLayerBuildState=n,this.roadSyntaxLayerBuildRunning=!0;const a=this.roadSyntaxLayerBuildToken+1;this.roadSyntaxLayerBuildToken=a;const i=this.parseRoadSyntaxLayerKey(e),s=i.metric,d=this.resolveRoadSyntaxMetricField(s,i.radiusLabel),u=this.resolveRoadSyntaxFallbackField(s),y=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems:[],S=[];let p=0;const x=()=>{if(a!==this.roadSyntaxLayerBuildToken)return;if(this.roadSyntaxIsInteractingInMetricView()){window.setTimeout(()=>{a===this.roadSyntaxLayerBuildToken&&window.requestAnimationFrame(x)},60);return}const m=window.performance&&typeof window.performance.now=="function"?()=>window.performance.now():()=>Date.now(),R=m(),k=this.roadSyntaxResolveFrameBudget("layer");for(;p<y.length;){const B=y[p]||{};p+=1;const ut=this.buildRoadSyntaxStyleForMetric(B&&B.props||{},d,u,s,i.skeletonOnly);if(S.push(ut),m()-R>=k)break}if(p<y.length){window.requestAnimationFrame(x);return}const v=Object.assign({},this.roadSyntaxLayerStyleCache||{});v[e]=S,this.roadSyntaxLayerStyleCache=v;const f=this.roadSyntaxMap(),_=Object.assign({},this.roadSyntaxLayerPool||{});_[e]&&this.roadSyntaxDisposeLayerEntry(_[e],f);const A=this.roadSyntaxBuildLayerFromStyles(e,S,{variant:"full"}),P=this.roadSyntaxBuildLayerLodIndexSet(e),L=this.roadSyntaxBuildLayerFromStyles(e,S,{variant:"lod",includeIndexSet:P,zIndexBoost:3});A.lodLayer=L,A.lodIndexSet=this.roadSyntaxCloneIndexSet(L.indexSet||P),_[e]=A,this.roadSyntaxLayerPool=_;const T=Object.assign({},this.roadSyntaxLayerBuildState||{});T[e]="ready",this.roadSyntaxLayerBuildState=T,this.roadSyntaxLayerBuildRunning=!1;const z=this.refreshRoadSyntaxLayerReadyMap(),tt=Object.values(z).filter(B=>!!B).length,G=Object.keys(z).length;if(G>0&&tt>=G){const B=!!this.roadSyntaxPoolDegraded;this.roadSyntaxPoolReady=!0,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitRunning&&(this.roadSyntaxPoolInitRunning=!1),B&&this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层补建完成",tt,G))}else this.roadSyntaxPoolInitRunning&&this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载中",tt,G));this.roadSyntaxPendingLayerKey===e&&this.switchRoadSyntaxLayerByKey(e,{force:!0}),this.scheduleRoadSyntaxLayerBuilder()};window.requestAnimationFrame(x)},switchRoadSyntaxLayerByKey(t,e={}){if(!this.roadSyntaxMap())return;const a=!e||e.trackPerf!==!1,i=this.roadSyntaxNow();if(!this.roadSyntaxUseArcgisWebgl){this.roadSyntaxSetStatus("ArcGIS-WebGL 未启用，旧版回退已禁用");return}if(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload)){this.roadSyntaxActiveLayerKey=String(t||this.resolveRoadSyntaxLayerKey(this.resolveRoadSyntaxActiveMetric())),this.roadSyntaxActiveLayerVariant="full",this.roadSyntaxPendingLayerKey="",this.roadSyntaxDisplaySuspended=!1,typeof this.renderRoadSyntaxArcgisWebgl=="function"?this.renderRoadSyntaxArcgisWebgl(this.roadSyntaxWebglPayload,{hideWhenSuspended:!0}).then(s=>{s?a&&this.recordRoadSyntaxSwitchDuration(i,t,0,0,"arcgis_webgl"):this.roadSyntaxStrictWebglOnly&&this.roadSyntaxSetStatus("ArcGIS-WebGL 切换失败（已禁用旧版回退）")}).catch(s=>{console.warn("[road-syntax] arcgis webgl switch render failed",s),this.roadSyntaxStrictWebglOnly&&this.roadSyntaxSetStatus("ArcGIS-WebGL 切换失败（已禁用旧版回退）")}):this.roadSyntaxStrictWebglOnly&&this.roadSyntaxSetStatus("ArcGIS-WebGL 渲染器不可用（已禁用旧版回退）");return}this.roadSyntaxSetStatus(this.buildRoadSyntaxWebglUnavailableMessage(this.roadSyntaxWebglPayload))},warmRoadSyntaxLayerPool(t=""){const e=this.roadSyntaxLayerBuildState||{};this.roadSyntaxLayerKeysForPrebuild().filter(a=>{if(a===t)return!1;const i=e[a];return i!=="ready"&&i!=="building"&&i!=="queued"}).forEach(a=>this.enqueueRoadSyntaxLayerBuild(a,{priority:!1,switchOnReady:!1}))},waitRoadSyntaxLayerReady(t,e=ROAD_SYNTAX_CONST.PREBUILD_DEADLINE_MS){return new Promise(n=>{const a=Date.now(),i=()=>{if(this.isRoadSyntaxLayerReady(t)){n(!0);return}if(Date.now()-a>e){n(!1);return}window.setTimeout(i,25)};i()})},prewarmRoadSyntaxLayerVisibility(t,e=""){return t!==this.roadSyntaxRequestToken?Promise.resolve(!1):Promise.resolve(!0)},prewarmRoadSyntaxSwitchPath(t,e=""){return Promise.resolve(t===this.roadSyntaxRequestToken)},async initializeRoadSyntaxPoolFully(t,e=""){if(this.roadSyntaxStrictWebglOnly)return this.roadSyntaxPoolInitRunning=!1,this.roadSyntaxPoolReady=!0,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitTotal=1,this.roadSyntaxPoolInitDone=1,!0;const n=this.roadSyntaxLayerKeysForPrebuild(),a=e?[e].concat(n.filter(p=>p!==e)):n.slice();if(!a.length)return this.roadSyntaxPoolReady=!0,this.roadSyntaxPoolDegraded=!1,!0;const i=Number(this.roadSyntaxPrebuildDeadlineMs||ROAD_SYNTAX_CONST.PREBUILD_DEADLINE_MS),s=Date.now();this.roadSyntaxPoolInitRunning=!0,this.roadSyntaxPoolReady=!1,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitTotal=a.length,this.roadSyntaxPoolInitDone=0,this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载中",0,a.length)),this.refreshRoadSyntaxLayerReadyMap(),a.forEach((p,x)=>this.enqueueRoadSyntaxLayerBuild(p,{priority:x===0,switchOnReady:!1}));let d=!1;for(let p=0;p<a.length;p+=1){if(t!==this.roadSyntaxRequestToken)return this.roadSyntaxPoolInitRunning=!1,!1;const x=Date.now()-s,m=i-x;if(m<=0){d=!0;break}if(!await this.waitRoadSyntaxLayerReady(a[p],m)){d=!0;break}this.roadSyntaxPoolInitDone=p+1,this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载中",this.roadSyntaxPoolInitDone,this.roadSyntaxPoolInitTotal))}this.roadSyntaxPoolInitRunning=!1;const u=this.refreshRoadSyntaxLayerReadyMap(),y=Object.values(u).filter(p=>!!p).length,S=y>=a.length;if(this.roadSyntaxPoolReady=S,this.roadSyntaxPoolDegraded=!S,S&&(this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载完成",y,a.length)),this.roadSyntaxEnableHeavyPrewarm)){const p=this.roadSyntaxPrewarmToken+1;this.roadSyntaxPrewarmToken=p,window.setTimeout(async()=>{if(p===this.roadSyntaxPrewarmToken&&t===this.roadSyntaxRequestToken)try{await this.prewarmRoadSyntaxLayerVisibility(t,e||a[0]||""),await this.prewarmRoadSyntaxSwitchPath(t,e||a[0]||"")}catch{}},0)}return!S&&d&&this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(`图层预加载超时，进入降级模式：${y}/${a.length}`),S},renderRoadSyntaxOverlays(t,e={}){if(this.roadSyntaxStrictWebglOnly){this.roadSyntaxSetStatus("ArcGIS-WebGL 模式已启用，旧版图层渲染已禁用");return}if(!this.roadSyntaxMap()||!window.AMap)return;typeof this.clearRoadSyntaxArcgisWebgl=="function"&&this.clearRoadSyntaxArcgisWebgl({dispose:!1});const n=!!(e&&e.forceRebuild),a=!(e&&e.displayActive===!1),i=(t||{}).features||[];if(this.roadSyntaxRoadFeatures=Array.isArray(i)?i:[],!this.roadSyntaxRoadFeatures.length){this.clearRoadSyntaxOverlays();return}const s=this.buildRoadSyntaxRenderItems(this.roadSyntaxRoadFeatures);if(!s.length){this.clearRoadSyntaxOverlays();return}const d=this.buildRoadSyntaxRenderFingerprint(s);(n||!this.roadSyntaxSourceFingerprint||this.roadSyntaxSourceFingerprint!==d||!Object.keys(this.roadSyntaxLayerPool||{}).length)&&(this.roadSyntaxPoolWarmToken+=1,this.roadSyntaxLayerBuildToken+=1,this.roadSyntaxLayerSwitchToken+=1,this.clearRoadSyntaxLayerPool(),this.roadSyntaxPolylineItems=s,this.roadSyntaxSourceFingerprint=d,this.roadSyntaxPoolRadiusLabel=String(this.roadSyntaxRadiusLabel||"global"),this.roadSyntaxPoolReady=!1,this.roadSyntaxPoolDegraded=!1,this.rebuildRoadSyntaxBasePolylines()),this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxResetLodScoreCache();const y=this.resolveRoadSyntaxActiveMetric(),S=this.resolveRoadSyntaxLayerKey(y);if(a){if(this.isRoadSyntaxLayerReady(S)){const p=this.roadSyntaxResolveDesiredLayerVariant(),x=this.roadSyntaxDisplaySuspended||!this.roadSyntaxGetLayer(S);this.switchRoadSyntaxLayerByKey(S,{force:x,preferVariant:p})}else{this.enqueueRoadSyntaxLayerBuild(S,{priority:!0,switchOnReady:!0});const p=this.roadSyntaxLayerReadyCounts();this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(`图层预处理中：${p.ready}/${p.total||0}`)}this.roadSyntaxLogOverlayHealth("render-road-syntax")}this.warmRoadSyntaxLayerPool(S),this.refreshRoadSyntaxLayerReadyMap(),this.roadSyntaxPolylineItems=s},buildRoadSyntaxRequestPayload(t,e,n=null){const a=this.resolveRoadSyntaxActiveMetric(),i=this.resolveRoadSyntaxMetricField(a,this.roadSyntaxRadiusLabel),s=this.roadSyntaxStrictWebglOnly?!0:!!this.roadSyntaxUseArcgisWebgl,d=a==="control"||a==="depth"||a==="connectivity"||a==="intelligibility",u=this.normalizeRoadSyntaxGraphModel();return{run_id:n?String(n):null,polygon:t,coord_type:"gcj02",mode:"walking",graph_model:u,highway_filter:"all",include_geojson:!0,max_edge_features:d?null:e,merge_geojson_edges:!0,merge_bucket_step:.025,radii_m:[600,800],tulip_bins:1024,metric:this.resolveRoadSyntaxRequestMetric(),use_arcgis_webgl:s,arcgis_timeout_sec:120,arcgis_metric_field:i}},roadSyntaxResponseHasReadyWebgl(t){const e=t&&t.webgl&&typeof t.webgl=="object"?t.webgl:null;return typeof this.roadSyntaxCanUseArcgisWebglPayload!="function"?!1:this.roadSyntaxCanUseArcgisWebglPayload(e)},buildRoadSyntaxWebglUnavailableMessage(t){const e=t&&t.webgl&&typeof t.webgl=="object"?t.webgl:t&&typeof t=="object"?t:null;if(!e||typeof e!="object")return"ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: payload_missing";const n=!!e.enabled,a=String(e&&e.status||"").trim(),i=e&&e.roads&&typeof e.roads=="object"?e.roads:{},s=Array.isArray(i.features)?i.features:[],d=s.length,u=Number(i.count),y=Number.isFinite(u)?u:s.length;return n?a&&a!=="ok"?`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: ${a}`:d<=0?`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: features=0, count=${y}`:y<=0?"ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: roads=0":`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: payload_invalid(status=${a||"empty"}, features=${d}, count=${y})`:a?`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: enabled=false, status=${a}, features=${d}, count=${y}`:`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: enabled=false, features=${d}, count=${y}`},applyRoadSyntaxResponseData(t,e="connectivity"){if(this.roadSyntaxRoadFeatures=Array.isArray(t&&t.roads&&t.roads.features||[])?t.roads.features:[],this.roadSyntaxNodes=Array.isArray(t&&t.nodes&&t.nodes.features||[])?t.nodes.features:[],this.roadSyntaxDiagnostics=t&&t.diagnostics?t.diagnostics:null,this.roadSyntaxScatterPointsCache=this.normalizeRoadSyntaxScatterPoints(this.roadSyntaxDiagnostics&&this.roadSyntaxDiagnostics.intelligibility_scatter),this.roadSyntaxSummary=t&&t.summary?t.summary:null,this.roadSyntaxWebglPayload=t&&t.webgl&&typeof t.webgl=="object"?t.webgl:null,this.roadSyntaxWebglStatus=String(this.roadSyntaxWebglPayload&&this.roadSyntaxWebglPayload.status||""),this.roadSyntaxWebglRadiusFilterCache=null,this.roadSyntaxSkeletonOnly=!1,!this.roadSyntaxSummary)return;const i=this.roadSyntaxMetricTabs().map(u=>u.value).includes(e)?e:this.roadSyntaxDefaultMetric();this.roadSyntaxMetric=i,this.roadSyntaxLastMetricTab=i;const s=this.roadSyntaxRadiusOptions(),d=s.some(u=>String(u.value||"")==="global");this.roadSyntaxRadiusLabel=d?"global":String(s[0]&&s[0].value||"global")},buildRoadSyntaxCompletionStatus(t){if(!this.roadSyntaxSummary)return"完成：未返回有效汇总数据";const e=this.roadSyntaxSummary.analysis_engine||"depthmapxcli",n=`完成：${this.roadSyntaxSummary.node_count||0} 节点，${this.roadSyntaxSummary.edge_count||0} 边段（${e}`,a=Number(this.roadSyntaxSummary.control_valid_count||0),i=Number(this.roadSyntaxSummary.depth_valid_count||0),s=String(this.roadSyntaxSummary.control_source_column||""),d=String(this.roadSyntaxSummary.depth_source_column||"");let u="";(a<=0||i<=0)&&(u=`；control=${a}${s?`(${s})`:""}, depth=${i}${d?`(${d})`:""}`);const y=this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload);return(typeof this.roadSyntaxIsArcgisWebglActive=="function"?this.roadSyntaxIsArcgisWebglActive():y&&!!this.roadSyntaxWebglActive)?`${n}，ArcGIS-WebGL 已就绪${u}）`:y?`${n}，ArcGIS 数据已返回，但 WebGL 渲染未激活${u}）`:`${n}，ArcGIS-WebGL 未就绪（已禁用旧版回退${u}）`},async computeRoadSyntax(){if(!this.lastIsochroneGeoJSON||this.isComputingRoadSyntax)return;this.roadSyntaxMainTab!=="params"&&this.setRoadSyntaxMainTab("params",{refresh:!1,syncMetric:!1}),this.roadSyntaxStrictWebglOnly&&(this.roadSyntaxUseArcgisWebgl=!0),this.isComputingRoadSyntax=!0;const t=this.roadSyntaxGraphModelLabel();this.roadSyntaxSetStatus(`正在请求路网并计算路网指标（${t}）...`);const e=this.roadSyntaxRequestToken+1;this.roadSyntaxRequestToken=e;const n=this.roadSyntaxCreateRunId();this.roadSyntaxStartProgressTracking(n,e,`局部任务已启动（${t}），正在准备路网`);const a=this.roadSyntaxLastMetricTab||this.roadSyntaxMetric||this.roadSyntaxDefaultMetric();this.cancelRoadSyntaxRequest("start_new_compute");const i=new AbortController;this.roadSyntaxFetchAbortController=i;try{const s=this.getIsochronePolygonPayload();if(!s.length)throw new Error("等时圈范围无效");this.invalidateRoadSyntaxCache("recompute-road-syntax",{resetData:!1,resetPerf:!0}),this.roadSyntaxSummary=null,this.roadSyntaxRoadFeatures=[],this.roadSyntaxNodes=[],this.roadSyntaxDiagnostics=null,this.roadSyntaxLegendModel=null;const d=this.resolveRoadSyntaxEdgeCap(),u=this.buildRoadSyntaxRequestPayload(s,d,n),y=await this.fetchRoadSyntaxApi(u,{signal:i.signal});if(e!==this.roadSyntaxRequestToken)return;if(this.roadSyntaxRadiusLabel="global",this.applyRoadSyntaxResponseData(y,a),!(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload)))throw new Error(this.buildRoadSyntaxWebglUnavailableMessage(y));let p=!1;try{if(typeof this.renderRoadSyntaxArcgisWebgl!="function")throw new Error("ArcGIS-WebGL 渲染器不可用");p=await this.renderRoadSyntaxArcgisWebgl(this.roadSyntaxWebglPayload,{hideWhenSuspended:!0})}catch(m){console.warn("[road-syntax] arcgis webgl initial render failed",m),p=!1}if(!p){const m=String(this.roadSyntaxWebglStatus||"").trim();throw new Error(m?`ArcGIS-WebGL 渲染失败（已禁用旧版回退）: ${m}`:"ArcGIS-WebGL 渲染失败（已禁用旧版回退）")}this.roadSyntaxPoolReady=!0,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitRunning=!1,this.roadSyntaxPoolInitTotal=1,this.roadSyntaxPoolInitDone=1;const x=!0;this.roadSyntaxSummary&&(this.setRoadSyntaxMainTab(this.roadSyntaxLastMetricTab||this.roadSyntaxDefaultMetric(),{refresh:!1,syncMetric:!0}),this.activeStep3Panel==="syntax"?await this.renderRoadSyntaxByMetric(this.roadSyntaxLastMetricTab||this.roadSyntaxMetric||this.roadSyntaxDefaultMetric()):typeof this.suspendRoadSyntaxDisplay=="function"&&this.suspendRoadSyntaxDisplay()),this.roadSyntaxSetStatus(`局部（当前多边形）${this.buildRoadSyntaxCompletionStatus(x)}`)}catch(s){if(e!==this.roadSyntaxRequestToken)return;if(s&&(s.name==="AbortError"||String(s.message||"").indexOf("aborted")>=0)){this.roadSyntaxSetStatus("已取消旧请求，正在使用最新参数计算...");return}console.error(s);const d=s&&s.message?s.message:String(s);if(typeof d=="string"&&(d.indexOf("Overpass query timeout/error")>=0||d.indexOf("Local Overpass request failed")>=0)){this.roadSyntaxSetStatus("失败: 路网抓取超时（Overpass 忙），请等几秒再试，或缩小等时圈范围后重试。");return}if(this.normalizeRoadSyntaxGraphModel()==="axial"){const y=String(d||"").trim();y.startsWith("轴线图计算失败")?this.roadSyntaxSetStatus(`失败: ${y}`):this.roadSyntaxSetStatus(`失败: 轴线图计算失败：${y||"请改用线段图或缩小范围后重试。"}`)}else this.roadSyntaxSetStatus("失败: "+d)}finally{this.roadSyntaxFetchAbortController===i&&(this.roadSyntaxFetchAbortController=null),this.isComputingRoadSyntax=!1,this.roadSyntaxStopProgressTracking()}},renderResult(t){if(!t||!t.geometry){this.errorMessage="未获取到有效数据";return}this.clearIsochroneDebugState(),this.lastIsochroneGeoJSON=t,this.applySimplifyConfig()}}});de({app:X,pinia:l,target:"#analysis-app-root"})}function ye(){return he()}function ue(){if(typeof window>"u"||window.__ANALYSIS_CANVAS_READBACK_PATCHED__)return;const r=window.HTMLCanvasElement&&window.HTMLCanvasElement.prototype;if(!r||typeof r.getContext!="function")return;const o=r.getContext;r.getContext=function(h,c){if(h==="2d"){const g=c&&typeof c=="object"?c:{};return o.call(this,h,{...g,willReadFrequently:!0})}return o.call(this,h,c)},window.__ANALYSIS_CANVAS_READBACK_PATCHED__=!0}async function pe(r){ue(),await Ut();const o=document.getElementById("analysis-app-root");if(!o)throw new Error("analysis app root not found");if(window.__ANALYSIS_BOOTSTRAP__=r,!window.__ANALYSIS_APP_MOUNTED__){o.innerHTML=`<div class="analysis-layout-root">${Qt}</div>`,ye(),window.__ANALYSIS_APP_MOUNTED__=!0;return}window.location.reload()}const Se={class:"analysis-shell"},ge={key:0,class:"state state-overlay"},xe={key:1,class:"state state-error"},me=Gt({__name:"App",setup(r){const o=dt(!0),l=dt("");return Ht(async()=>{try{const h=await fetch("/api/v1/config");if(!h.ok)throw new Error(`/api/v1/config 请求失败(${h.status})`);const c=await h.json();await pe({config:{amap_js_api_key:String((c==null?void 0:c.amap_js_api_key)||""),amap_js_security_code:String((c==null?void 0:c.amap_js_security_code)||""),tianditu_key:String((c==null?void 0:c.tianditu_key)||"")},typeMapConfig:(c==null?void 0:c.map_type_config_json)||{groups:[]}})}catch(h){const c=h instanceof Error?h.message:String(h);l.value=`初始化失败：${c}`}finally{o.value=!1}}),(h,c)=>(et(),at("main",Se,[c[0]||(c[0]=jt("div",{id:"analysis-app-root",class:"analysis-host"},null,-1)),o.value?(et(),at("div",ge,"正在初始化分析工作台...")):l.value?(et(),at("div",xe,Vt(l.value),1)):qt("",!0)]))}}),be=(r,o)=>{const l=r.__vccOpts||r;for(const[h,c]of o)l[h]=c;return l},fe=be(me,[["__scopeId","data-v-3a0acfa8"]]);yt(fe).mount("#app");
