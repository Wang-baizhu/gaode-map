import{c as St}from"./vendor-vue-DkdC8wD7.js";import{c as gt}from"./feature-isochrone-D5dqdO5R.js";import{c as mt,a as xt,b as bt,d as ft}from"./feature-poi-B_MGTl4q.js";import{c as vt,a as Mt,b as Rt,d as Pt}from"./feature-history-DvDqOJjA.js";import{a as kt,c as wt}from"./feature-h3-SknWQC-z.js";import{c as At,u as _t,a as Lt,b as Ct,d as Tt,e as Nt,f as It,g as Dt,A as Ot,h as Ft,i as Et,j as $t,k as Bt,l as Wt,m as Gt}from"./feature-stores-DUvM66Hz.js";import{a as Ht,c as zt}from"./feature-export-Ci3zhuiQ.js";import{a as Vt,b as rt,d as ot,c as lt,e as dt,f as jt,g as qt}from"./feature-road-map-CAYi7MCF.js";import{m as st,u as ut,v as Ut,x as Kt,y as at,z as it,A as Yt,B as Zt,C as Qt,d as ct}from"./vendor-C18lXgnW.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))h(c);new MutationObserver(c=>{for(const p of c)if(p.type==="childList")for(const v of p.addedNodes)v.tagName==="LINK"&&v.rel==="modulepreload"&&h(v)}).observe(document,{childList:!0,subtree:!0});function l(c){const p={};return c.integrity&&(p.integrity=c.integrity),c.referrerPolicy&&(p.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?p.credentials="include":c.crossOrigin==="anonymous"?p.credentials="omit":p.credentials="same-origin",p}function h(c){if(c.ep)return;c.ep=!0;const p=l(c);fetch(c.href,p)}})();const ht=new Map,Jt="analysis-style-";function yt(r){const o=ht.get(r);if(o)return o;const l=new Promise((h,c)=>{const p=document.querySelector(`script[data-analysis-src="${r}"]`);if(p){if(p.__loaded){h();return}p.addEventListener("load",()=>h(),{once:!0}),p.addEventListener("error",()=>c(new Error(`script load failed: ${r}`)),{once:!0});return}const v=document.createElement("script");v.src=r,v.async=!1,v.dataset.analysisSrc=r,v.onload=()=>{v.__loaded=!0,h()},v.onerror=()=>c(new Error(`script load failed: ${r}`)),document.head.appendChild(v)});return ht.set(r,l),l}function nt(r){const o=`${Jt}${r}`.replace(/[^a-zA-Z0-9_-]/g,"_");if(document.getElementById(o))return;const l=document.createElement("link");l.id=o,l.rel="stylesheet",l.href=r,document.head.appendChild(l)}async function Xt(){nt("/static/css/map-common.css"),nt("/static/css/filter-panel.css"),nt("/static/css/analysis-page.css"),await yt("/static/vendor/html2canvas.min.js"),await yt("/static/vendor/echarts.min.js")}const te=`

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

                                <div class="panel poi-panel" v-show="activeStep3Panel === 'population'">
                                    <div class="poi-subpanel">
                                        <div v-if="!populationGrid || !populationGrid.features || !populationGrid.features.length" class="panel-placeholder" style="margin-top:10px;">
                                            先在步骤一生成分析范围。
                                        </div>
                                        <div v-if="populationOverview" class="h3-subtabs population-view-tabs">
                                            <button type="button" class="h3-subtab-pill"
                                                :class="{ active: populationAnalysisView === 'density' }"
                                                @click="setPopulationAnalysisView('density')">密度</button>
                                            <button type="button" class="h3-subtab-pill"
                                                :class="{ active: populationAnalysisView === 'sex' }"
                                                @click="setPopulationAnalysisView('sex')">性别结构</button>
                                            <button type="button" class="h3-subtab-pill"
                                                :class="{ active: populationAnalysisView === 'age' }"
                                                @click="setPopulationAnalysisView('age')">年龄</button>
                                        </div>
                                        <div v-if="populationOverview" class="population-view-control-row">
                                            <label v-if="populationAnalysisView === 'sex'" class="population-inline-field">
                                                <span>地图图层</span>
                                                <select v-model="populationSexMetricMode" @change="onPopulationSexMetricModeChange" class="h3-params-select">
                                                    <option value="ratio">性别占比（%）</option>
                                                    <option value="diff">性别差异（人）</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div v-if="populationLayer && populationLayer.legend" class="population-legend-card" style="margin-top:10px;">
                                            <div class="population-legend-title">
                                                {{ populationLayer.legend.title }}
                                                <span style="color:#6b7280; font-weight:400;">
                                                    {{ populationLayer.legend.unit ? \`（\${populationLayer.legend.unit}）\` : '' }}
                                                </span>
                                            </div>
                                            <div v-if="populationLayer.legend.kind !== 'categorical'" class="population-legend-gradient" :style="getPopulationLegendGradientStyle()"></div>
                                            <div class="population-legend-grid">
                                                <div v-for="(item, idx) in populationLayer.legend.stops" :key="\`population-legend-\${idx}\`"
                                                    class="population-legend-item">
                                                    <span class="population-legend-swatch"
                                                        :style="{ background:item.color }"></span>
                                                    <span>
                                                        {{ item.label || (populationLayer.legend.unit === '人/平方公里'
                                                            ? formatPopulationDensity(item.value)
                                                            : (populationLayer.legend.unit === '%'
                                                                ? formatPopulationLegendPercent(item.value)
                                                                : formatPopulationValue(item.value))) }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="populationOverview" class="population-analysis-grid" style="margin-top:10px;">
                                            <div v-for="row in getPopulationSummaryRows()" :key="\`population-card-\${row.key}\`" class="population-analysis-card">
                                                <div class="population-analysis-card-label">{{ row.label }}</div>
                                                <div class="population-analysis-card-value">{{ row.value }}</div>
                                            </div>
                                        </div>
                                        <div v-if="populationOverview" style="margin-top:10px;">
                                            <div id="populationPrimaryChart" :style="{ height: populationAnalysisView === 'age' ? '240px' : '200px' }"></div>
                                            <div v-if="populationAnalysisView !== 'age'" id="populationSecondaryChart" style="height:220px; margin-top:8px;"></div>
                                        </div>
                                        <div v-else class="panel-placeholder" style="margin-top:10px;">
                                            {{ isComputingPopulation ? '正在自动计算人口分析...' : '进入人口面板后会自动计算并展示结果。' }}
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
        </aside>
`,ee=`

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
        </main>`,ae=`${te}${ee}`,O=Object.freeze({POI:"poi",H3:"h3",H3_SETTINGS:"h3_settings",POPULATION:"population",SYNTAX:"syntax"});function ie(){return{normalizeStep3PanelId(r=""){const o=String(r||"");return o===O.H3_SETTINGS?O.H3:o},shouldShowPoiOnCurrentPanel(){return String(this.activeStep3Panel||"")===O.POI&&!this.poiSystemSuspendedForSyntax&&String(this.poiSubTab||"category")!=="analysis"},shouldShowPoiKdeOnCurrentPanel(){return String(this.activeStep3Panel||"")===O.POI&&!this.poiSystemSuspendedForSyntax&&String(this.poiSubTab||"")==="analysis"&&!!this.poiKdeEnabled},applyPoiFilterPanel(r=""){const o=this.filterPanel;if(!o||typeof o.applyFilters!="function")return Promise.resolve({ok:!1,skipped:!0,reason:"filter_panel_unavailable:"+String(r||"")});try{const l=o.applyFilters();return l&&typeof l.then=="function"?l:Promise.resolve({ok:!0,reason:"filter_panel_sync:"+String(r||"")})}catch(l){return Promise.resolve({ok:!1,reason:"filter_panel_exception:"+String(r||""),error:l&&l.message?l.message:String(l)})}},applySimplifyPointVisibility(){const r=this.shouldShowPoiOnCurrentPanel();typeof this.applyPoiVisualState=="function"&&this.applyPoiVisualState({shouldShowPoi:r}),!this.markerManager&&r&&Array.isArray(this.allPoisDetails)&&this.allPoisDetails.length>0&&this.rebuildPoiRuntimeSystem(this.allPoisDetails)},selectStep3Panel(r){if(this.isDraggingNav)return;const o=this.normalizeStep3PanelId(r);if(o===O.SYNTAX&&!this.roadSyntaxModulesReady){this.roadSyntaxSetStatus("路网模块未完整加载："+(this.roadSyntaxModuleMissing||[]).join(", "));return}if(!this.isStep3PanelVisible(o))return;const l=this.activeStep3Panel;if(this.activeStep3Panel=o,l===O.SYNTAX&&o!==O.SYNTAX&&this.suspendRoadSyntaxDisplay(),l===O.POPULATION&&o!==O.POPULATION&&this.clearPopulationRasterDisplayOnLeave(),o!==O.H3&&(this.h3ExportMenuOpen=!1,this.h3ExportTasksOpen=!1),o===O.POI){this.applySimplifyPointVisibility(),this.$nextTick(()=>{String(this.poiSubTab||"category")==="analysis"?this.refreshPoiKdeOverlay():(this.updatePoiCharts(),setTimeout(()=>this.resizePoiChart(),0))});return}if(o===O.H3){this.syncH3PoiFilterSelection(!1),this.ensureH3PanelEntryState(),this.restoreH3GridDisplayOnEnter(),this.$nextTick(()=>{typeof this.updateH3Charts=="function"&&this.updateH3Charts(),typeof this.updateDecisionCards=="function"&&this.updateDecisionCards()}),this.applySimplifyPointVisibility();return}if(o===O.POPULATION){this.ensurePopulationPanelEntryState(),this.restorePopulationRasterDisplayOnEnter(),this.$nextTick(()=>{typeof this.updatePopulationCharts=="function"&&this.updatePopulationCharts()}),this.applySimplifyPointVisibility();return}if(o===O.SYNTAX){if(!!this.roadSyntaxSummary||Array.isArray(this.roadSyntaxRoadFeatures)&&this.roadSyntaxRoadFeatures.length>0||Array.isArray(this.roadSyntaxNodes)&&this.roadSyntaxNodes.length>0){const c=typeof this.roadSyntaxMetricTabs=="function"?this.roadSyntaxMetricTabs().map(_=>_.value):["connectivity","control","depth","choice","integration","intelligibility"],p=String(this.roadSyntaxMainTab||"").trim(),v=String(this.roadSyntaxMetric||"").trim(),N=String(this.roadSyntaxLastMetricTab||"").trim(),w=typeof this.roadSyntaxDefaultMetric=="function"?this.roadSyntaxDefaultMetric():"connectivity",T=c.includes(p)?p:c.includes(v)?v:c.includes(N)?N:w;this.setRoadSyntaxMainTab(T,{refresh:!1,syncMetric:!0})}else this.setRoadSyntaxMainTab("params",{refresh:!1,syncMetric:!1});this.resumeRoadSyntaxDisplay()}this.applySimplifyPointVisibility()},suspendPoiSystemForSyntax(){this.poiSystemSuspendedForSyntax||(this.clearPoiOverlayLayers({reason:"suspend_for_syntax",clearManager:!0,clearSimpleMarkers:!0,resetFilterPanel:!0,immediate:!0}),this.poiSystemSuspendedForSyntax=!0)},resumePoiSystemAfterSyntax(){this.poiSystemSuspendedForSyntax&&(this.poiSystemSuspendedForSyntax=!1,!this.markerManager&&Array.isArray(this.allPoisDetails)&&this.allPoisDetails.length&&this.rebuildPoiRuntimeSystem(this.allPoisDetails))},onStep3DragStart(r,o){this.dragIndex=r,this.dragOverIndex=r,this.dragInsertPosition="before",this.isDraggingNav=!0,o&&o.dataTransfer&&(o.dataTransfer.effectAllowed="move")},onStep3DragOver(r,o){o&&o.preventDefault(),this.dragOverIndex=r;const l=o.currentTarget.getBoundingClientRect(),h=l.top+l.height/2;this.dragInsertPosition=o.clientY<h?"before":"after"},onStep3Drop(r){if(this.dragIndex===null){this.dragOverIndex=null,this.dragInsertPosition=null;return}const o=this.step3NavItems.slice(),l=o.splice(this.dragIndex,1)[0];let h=r;this.dragInsertPosition==="after"&&(h=r+1),this.dragIndex<h&&(h-=1),o.splice(h,0,l),this.step3NavItems=o,this.dragIndex=null,this.dragOverIndex=null,this.dragInsertPosition=null,this.isDraggingNav=!1},onStep3DragEnd(){this.dragIndex=null,this.dragOverIndex=null,this.dragInsertPosition=null,this.isDraggingNav=!1},goToStep(r){this.confirmNavigation(()=>{r<this.step&&(typeof this.cancelHistoryDetailLoading=="function"&&this.cancelHistoryDetailLoading(),this.step===3&&r<=2&&(this.clearPoiOverlayLayers({reason:"go_to_step_back_to_step2",clearManager:!0,clearSimpleMarkers:!0,resetFilterPanel:!0}),this.resetRoadSyntaxState(),this.resetPopulationAnalysisState({keepMeta:!0}),this.poiStatus="",this.clearH3Grid()),this.step>=2&&r<=1&&(typeof this.clearScopePolygonsFromMap=="function"&&this.clearScopePolygonsFromMap(),this.resetRoadSyntaxState(),this.resetPopulationAnalysisState({keepMeta:!0}),this.lastIsochroneGeoJSON=null,this.clearH3Grid())),this.step=r})},confirmNavigation(r){this.isFetchingPois?confirm("数据抓取正在进行中，离开将取消未完成的任务。确定要离开吗？")&&(this.cancelFetch(),r()):r()},cancelFetch(){this.abortController&&(this.abortController.abort(),this.abortController=null),this.isFetchingPois=!1,this.poiStatus="任务已取消",this.resetFetchSubtypeProgress()},backToHome(){this.confirmNavigation(()=>{this.destroyPlaceSearch(),this.clearAnalysisLayers(),this.sidebarView="start",this.step=1,this.selectedPoint=null,typeof this.clearCenterMarkerOverlay=="function"&&this.clearCenterMarkerOverlay(),this.errorMessage=""})}}}function ne(){return{clearAnalysisLayers(){this.abortController&&(this.abortController.abort(),this.abortController=null),this.cancelHistoryDetailLoading(),this.isFetchingPois=!1,this.fetchProgress=0,this.poiStatus="",this.roadSyntaxStatus="",this.resetFetchSubtypeProgress(),this.allPoisDetails=[],this.poiSubTab="category",this.poiAnalysisSubTab="kde",this.poiKdeEnabled=!1,this.poiKdeStats=this.createEmptyPoiKdeStats(),this.populationSubTab="analysis",this.scopeSource="",this.drawnScopePolygon=[],this.lastIsochroneGeoJSON=null,this.h3GridStatus="",this.h3GridCount=0,this.h3GridFeatures=[],this.isGeneratingGrid=!1,this.resetH3AnalysisState(),this.resetPopulationAnalysisState({keepMeta:!0}),this.clearIsochroneDebugState(),this.clearPoiOverlayLayers({reason:"clear_analysis_layers",clearManager:!0,clearSimpleMarkers:!0,resetFilterPanel:!0}),this.clearPoiKdeOverlay(),this.resetRoadSyntaxState(),this.disposePopulationCharts(),this.mapCore&&(this.mapCore.clearGridPolygons&&this.mapCore.clearGridPolygons(),this.mapCore.clearPopulationRasterOverlay&&this.mapCore.clearPopulationRasterOverlay(),this.mapCore.setRadius(0)),this.clearScopeOutlineDisplay(),this.stopScopeDrawing(),this.disposePoiChart()},resetAnalysis(){this.destroyPlaceSearch(),this.step=1,this.isochroneScopeMode="point",this.h3SimplifyMenuOpen=!1,this.h3SimplifyTargets=[],this.clearIsochroneDebugState(),this.sidebarView="wizard",this.selectedPoint=null,this.errorMessage="",this.marker&&(this.safeMapSet(this.marker,null),this.marker=null),this.clearAnalysisLayers(),this.mapCore&&this.mapCore.map&&this.mapCore.map.setFitView(),this.applySimplifyConfig()},saveAndRestart(){this.destroyPlaceSearch(),this.stopScopeDrawing(),this.cancelHistoryDetailLoading(),this.clearIsochroneDebugState(),this.step=1,this.activeStep3Panel="poi",this.isochroneScopeMode="point",this.h3SimplifyMenuOpen=!1,this.h3SimplifyTargets=[],this.poiSystemSuspendedForSyntax=!1,this.selectedPoint=null,this.errorMessage="",this.poiStatus="",this.allPoisDetails=[],this.poiSubTab="category",this.poiAnalysisSubTab="kde",this.poiKdeEnabled=!1,this.poiKdeStats=this.createEmptyPoiKdeStats(),this.populationSubTab="analysis",this.resultDataSource=this.normalizePoiSource(this.poiDataSource,"local"),this.scopeSource="",this.drawnScopePolygon=[],this.lastIsochroneGeoJSON=null,this.h3ExportMenuOpen=!1,this.h3ToastTimer&&(clearTimeout(this.h3ToastTimer),this.h3ToastTimer=null),this.h3Toast={message:"",type:"info"},this.clearPoiOverlayLayers({reason:"save_and_restart",clearManager:!0,clearSimpleMarkers:!0,clearCenterMarker:!0,resetFilterPanel:!0}),this.clearPoiKdeOverlay(),this.clearH3Grid(),this.resetPopulationAnalysisState({keepMeta:!0}),this.clearScopeOutlineDisplay(),this.disposePoiChart(),this.disposePopulationCharts(),this.applySimplifyConfig()}}}function se(r,o=[]){return(Array.isArray(o)?o:[]).reduce((l,h)=>{const c=String(h||"").trim();return c&&(l[c]={get(){return r[c]},set(p){r[c]=p}}),l},{})}function re(r=[]){return(Array.isArray(r)?r:[]).reduce((o,l)=>{if(!l||typeof l!="object")return o;const h=l.store,c=l.fieldKeys;return h?Object.assign(o,se(h,c)):o},{})}function oe(){return{clearScopePolygonsFromMap(){this.mapCore&&typeof this.mapCore.clearCustomPolygons=="function"&&this.mapCore.clearCustomPolygons()},clearCenterMarkerOverlay(){this.marker&&(this.safeMapSet(this.marker,null),this.marker=null)},applyPoiVisualState(r={}){const o=!!r.shouldShowPoi,l=!o;if(this.markerManager&&typeof this.markerManager.setHideAllPoints=="function"&&(this.pointLayersSuspendedForSyntax=!o,l&&typeof this.markerManager.destroyClusterers=="function"&&this.markerManager.destroyClusterers({immediate:!0}),typeof this.markerManager.setShowMarkers=="function"&&this.markerManager.setShowMarkers(o),this.markerManager.setHideAllPoints(l),this.applyPoiFilterPanel("simplify_visibility")),this.marker&&(l?this.safeMapSet(this.marker,null):this.selectedPoint&&this.mapCore&&this.mapCore.map&&this.safeMapSet(this.marker,this.mapCore.map)),Array.isArray(this.poiMarkers)&&this.poiMarkers.length>0){const h=this.poiMarkers.slice();this.poiMarkers=[],this.enqueuePoiMapWrite(()=>(h.forEach(c=>this.safeMapSet(c,null)),{ok:!0,hidden:h.length}),{key:"clear_stale_simple_markers",replaceExisting:!0,meta:{reason:"clear_stale_simple_markers",marker_count:h.length}})}}}}function le(){return{attachAmapRuntimeErrorProbe(){if(this.amapRuntimeErrorListener||this.amapRuntimeRejectionListener)return;const r=(l={})=>{const h=this.markerManager,c=h&&h.typeClusterers&&typeof h.typeClusterers=="object"?Object.keys(h.typeClusterers).length:0,p=h&&Array.isArray(h.markers)?h.markers.length:0;return Object.assign({step:Number(this.step||0),panel:String(this.activeStep3Panel||""),poi_suspended_for_syntax:!!this.poiSystemSuspendedForSyntax,marker_manager_alive:!!h,marker_count:p,clusterer_count:c,road_active_layer:String(this.roadSyntaxActiveLayerKey||""),road_switch_in_progress:!!this.roadSyntaxSwitchInProgress,road_pool_ready:!!this.roadSyntaxPoolReady,road_map_write_queue_pending:Number(this.roadSyntaxMapWriteQueuePending||0)},l||{})},o=(l="",h="")=>{const c=String(l||"");return String(h||"").indexOf("maps?v=")>=0||c.indexOf("split")>=0||c.indexOf("Ud")>=0||c.indexOf("Pixel(NaN")>=0};this.amapRuntimeErrorListener=l=>{const h=l&&l.message?String(l.message):"",c=l&&l.filename?String(l.filename):"";o(h,c)&&console.error("[diag] amap runtime error",r({message:h,filename:c,lineno:Number(l&&l.lineno||0),colno:Number(l&&l.colno||0)}))},this.amapRuntimeRejectionListener=l=>{const h=l&&l.reason||"",c=h&&h.message?String(h.message):String(h||"");o(c,"")&&console.error("[diag] amap runtime rejection",r({reason:c}))},window.addEventListener("error",this.amapRuntimeErrorListener),window.addEventListener("unhandledrejection",this.amapRuntimeRejectionListener)},detachAmapRuntimeErrorProbe(){this.amapRuntimeErrorListener&&window.removeEventListener("error",this.amapRuntimeErrorListener),this.amapRuntimeRejectionListener&&window.removeEventListener("unhandledrejection",this.amapRuntimeRejectionListener),this.amapRuntimeErrorListener=null,this.amapRuntimeRejectionListener=null},async onBasemapSourceChange(){let o=["amap","osm","tianditu"].includes(this.basemapSource)?this.basemapSource:"amap";if(o==="tianditu"?await this.validateTiandituSource()||(this.tdtDiagCopyStatus=""):(this.tdtDiag=null,this.tdtDiagCopyStatus="",this.errorMessage&&this.errorMessage.indexOf("天地图")>=0&&(this.errorMessage="")),this.basemapSource=o,this.mapCore&&this.mapCore.setBasemapSource){const l=this.mapCore.setBasemapSource(o);o==="tianditu"&&l&&l.ok===!1?(this.tdtDiag={ok:!1,phase:"map-init",status:null,contentType:"",bodySnippet:l.message||"",reason:l.code||"wmts-layer-init-failed"},this.errorMessage="天地图 WMTS 图层初始化失败，请检查：Key 类型=Web JS，白名单包含 localhost/127.0.0.1（及端口）。"):o==="tianditu"&&l&&l.ok===!0&&this.errorMessage&&this.errorMessage.indexOf("天地图")>=0&&(this.errorMessage="")}this.applySimplifyConfig()},_toNumber(r,o=0){const l=Number(r);return Number.isFinite(l)?l:o},loadAMapScript(r,o){return new Promise((l,h)=>{if(window.AMap&&window.AMap.Map){l();return}window._AMapSecurityConfig={securityJsCode:o};const c=document.createElement("script");c.src=`https://webapi.amap.com/maps?v=1.4.15&key=${r}`,c.onload=l,c.onerror=h,document.head.appendChild(c)})},async probeTiandituTile(r=4500){const o=(this.config&&this.config.tianditu_key?String(this.config.tianditu_key):"").trim();if(!o)return{ok:!1,phase:"wmts-probe",status:null,contentType:"",bodySnippet:"",reason:"missing-key",url:""};const l=`https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=7&TILEROW=53&TILECOL=107&tk=${encodeURIComponent(o)}&_ts=${Date.now()}`,h=new AbortController,c=window.setTimeout(()=>h.abort(),r);try{const p=await fetch(l,{method:"GET",cache:"no-store",signal:h.signal}),v=String(p.headers.get("content-type")||"").toLowerCase(),N=this.isImageContentType(v);let w="";if(!N)try{w=this._trimText(await p.text(),300)}catch{w=""}const T=p.status,_=p.ok&&N;let I="ok";return _||(T===418?I="http-418":T>=500?I="http-5xx":T>=400?I="http-4xx":p.ok?I="non-image-response":I="http-error"),{ok:_,phase:"wmts-probe",status:T,contentType:v,bodySnippet:w,reason:I,url:l}}catch(p){return p&&p.name==="AbortError"?{ok:!1,phase:"wmts-probe",status:null,contentType:"",bodySnippet:"",reason:"timeout",url:l}:{ok:!1,phase:"wmts-probe",status:null,contentType:"",bodySnippet:this._trimText(p&&p.message?p.message:String(p),300),reason:"network-error",url:l}}finally{window.clearTimeout(c)}},async validateTiandituSource(){const r=await this.probeTiandituTile();return this.tdtDiag=r,this.tdtDiagCopyStatus="",r.ok?(this.errorMessage&&this.errorMessage.indexOf("天地图")>=0&&(this.errorMessage=""),!0):(r.reason==="missing-key"?this.errorMessage="未配置天地图 Key（TIANDITU_KEY）。":r.reason==="timeout"?this.errorMessage="天地图 WMTS 探测超时，请稍后重试（配置修改可能需要 5-10 分钟生效）。":r.reason==="http-418"?this.errorMessage="天地图 WMTS 探测被拦截（HTTP 418），请检查 Key 类型=Web JS，白名单包含 localhost/127.0.0.1（及端口）。":this.errorMessage=`天地图 WMTS 探测失败（${r.status||"NO_STATUS"}），请检查 Key 与白名单。`,!1)},isImageContentType(r){const o=String(r||"").toLowerCase();return o.indexOf("image/")>=0||o.indexOf("application/octet-stream")>=0},_trimText(r,o=300){const l=String(r||"");return l.length<=o?l:l.slice(0,o)+"..."},buildTdtDiagText(){if(!this.tdtDiag)return"";const r=[`ok=${this.tdtDiag.ok}`,`phase=${this.tdtDiag.phase||"-"}`,`reason=${this.tdtDiag.reason||"-"}`,`status=${this.tdtDiag.status===null||this.tdtDiag.status===void 0?"-":this.tdtDiag.status}`,`contentType=${this.tdtDiag.contentType||"-"}`];return this.tdtDiag.url&&r.push(`url=${this.tdtDiag.url}`),this.tdtDiag.bodySnippet&&r.push(`body=${this.tdtDiag.bodySnippet}`),r.join(`
`)},async copyTdtDiag(){const r=this.buildTdtDiagText();if(!r){this.tdtDiagCopyStatus="无可复制内容";return}try{await navigator.clipboard.writeText(r),this.tdtDiagCopyStatus="已复制"}catch(o){console.error(o),this.tdtDiagCopyStatus="复制失败，请手动复制"}},roadSyntaxAttachMapListeners(){const r=this.mapCore&&this.mapCore.map?this.mapCore.map:null;r&&(this.roadSyntaxDetachMapListeners(),this.roadSyntaxZoomStartListener=()=>{this.roadSyntaxMapInteracting=!0,this.isRoadSyntaxMetricViewActive()&&this.roadSyntaxEnterLowFidelityMode()},this.roadSyntaxMoveStartListener=()=>{this.roadSyntaxMapInteracting=!0,this.isRoadSyntaxMetricViewActive()&&this.roadSyntaxEnterLowFidelityMode()},this.roadSyntaxMoveEndListener=()=>{this.roadSyntaxMapInteracting=!1,this.isRoadSyntaxMetricViewActive()&&(this.scheduleRoadSyntaxViewportRefresh("moveend"),this.roadSyntaxLogOverlayHealth("moveend")),this.markerManager&&typeof this.markerManager.logCoordinateHealth=="function"&&this.markerManager.logCoordinateHealth("road-syntax:moveend")},this.roadSyntaxZoomListener=()=>{this.roadSyntaxMapInteracting=!1,this.isRoadSyntaxMetricViewActive()&&(this.scheduleRoadSyntaxViewportRefresh("zoomend"),this.roadSyntaxLogOverlayHealth("zoomend")),this.markerManager&&typeof this.markerManager.logCoordinateHealth=="function"&&this.markerManager.logCoordinateHealth("road-syntax:zoomend")},r.on("zoomstart",this.roadSyntaxZoomStartListener),r.on("movestart",this.roadSyntaxMoveStartListener),r.on("moveend",this.roadSyntaxMoveEndListener),r.on("zoomend",this.roadSyntaxZoomListener))},roadSyntaxDetachMapListeners(){const r=this.mapCore&&this.mapCore.map?this.mapCore.map:null;if(r&&this.roadSyntaxZoomListener)try{r.off("zoomend",this.roadSyntaxZoomListener)}catch{}if(r&&this.roadSyntaxZoomStartListener)try{r.off("zoomstart",this.roadSyntaxZoomStartListener)}catch{}if(r&&this.roadSyntaxMoveStartListener)try{r.off("movestart",this.roadSyntaxMoveStartListener)}catch{}if(r&&this.roadSyntaxMoveEndListener)try{r.off("moveend",this.roadSyntaxMoveEndListener)}catch{}this.roadSyntaxZoomListener=null,this.roadSyntaxZoomStartListener=null,this.roadSyntaxMoveStartListener=null,this.roadSyntaxMoveEndListener=null},initMap(){const r=new Vt("container",{center:{lng:112.9388,lat:28.2282},zoom:13,zooms:[3,20],mapData:{},basemapSource:this.basemapSource,basemapMuted:!1,tiandituKey:this.config?this.config.tianditu_key:"",tiandituContainerId:"tianditu-container",onGridFeatureClick:o=>this.onH3GridFeatureClick(o)});r.initMap(),this.mapCore=st(r),this.applySimplifyConfig(),this.basemapSource==="tianditu"&&r.lastBasemapError&&(this.tdtDiag={ok:!1,phase:"map-init",status:null,contentType:"",bodySnippet:r.lastBasemapError.message||"",reason:r.lastBasemapError.code||"wmts-layer-init-failed"},this.errorMessage="天地图 WMTS 图层初始化失败，请检查：Key 类型=Web JS，白名单包含 localhost/127.0.0.1（及端口）。"),r.map.on("click",o=>{this.sidebarView!=="wizard"||this.step!==1||this.isochroneScopeMode==="point"&&(this.drawScopeActive||this.setSelectedPoint(o.lnglat))}),this.roadSyntaxAttachMapListeners()}}}function de(){return{cancelHistoryDetailLoading(){if(this.historyDetailAbortController){try{this.historyDetailAbortController.abort()}catch(r){console.warn("history detail abort failed",r)}this.historyDetailAbortController=null}this.historyDetailLoadToken+=1},buildHistoryH3ResultSnapshot(){const r=Array.isArray(this.h3AnalysisGridFeatures)?this.h3AnalysisGridFeatures:[],o=Array.isArray(this.h3GridFeatures)?this.h3GridFeatures:[],l=r.length?r:o;if(!(l.length>0||!!this.h3AnalysisSummary))return null;const c=Number(this.h3GridCount);return{grid:{type:"FeatureCollection",features:l,count:Number.isFinite(c)?c:l.length,resolution:Number(this.h3GridResolution)||10,include_mode:String(this.h3GridIncludeMode||"intersects"),min_overlap_ratio:Number(this.h3GridMinOverlapRatio)||0},summary:this.h3AnalysisSummary||null,charts:this.h3AnalysisCharts||null,ui:{main_stage:String(this.h3MainStage||"params"),sub_tab:String(this.h3SubTab||"metric_map"),metric_view:String(this.h3MetricView||"density"),structure_fill_mode:String(this.h3StructureFillMode||"gi_z"),panel_active:this.activeStep3Panel==="h3"}}},buildHistoryRoadResultSnapshot(){const r=Array.isArray(this.roadSyntaxRoadFeatures)?this.roadSyntaxRoadFeatures:[],o=Array.isArray(this.roadSyntaxNodes)?this.roadSyntaxNodes:[];return r.length>0||o.length>0||!!this.roadSyntaxSummary?{summary:this.roadSyntaxSummary||null,diagnostics:this.roadSyntaxDiagnostics||null,roads:{type:"FeatureCollection",features:r,count:r.length},nodes:{type:"FeatureCollection",features:o,count:o.length},webgl:this.roadSyntaxWebglPayload||null,ui:{graph_model:String(this.roadSyntaxGraphModel||"segment"),main_tab:String(this.roadSyntaxMainTab||"params"),metric:String(this.roadSyntaxMetric||"connectivity"),radius_label:String(this.roadSyntaxRadiusLabel||"global"),color_scale:String(this.roadSyntaxDepthmapColorScale||"axmanesque"),display_blue:Number(this.roadSyntaxDisplayBlue)||0,display_red:Number(this.roadSyntaxDisplayRed)||1,panel_active:this.activeStep3Panel==="syntax"}}:null},saveAnalysisHistoryAsync(r,o,l){if(!this.selectedPoint)return;const c=(Array.isArray(o)?o:typeof this.buildSelectedCategoryBuckets=="function"?this.buildSelectedCategoryBuckets():[]).map(b=>b.name).join(","),p=this.isochroneScopeMode==="area"&&Array.isArray(this.drawnScopePolygon)&&this.drawnScopePolygon.length>=3?this._closePolygonRing(this.normalizePath(this.drawnScopePolygon,3,"history.drawn_polygon")):null,N=(Array.isArray(l)?l:Array.isArray(this.allPoisDetails)?this.allPoisDetails:[]).map(b=>({id:b&&b.id?String(b.id):"",name:b&&b.name?String(b.name):"未命名",location:Array.isArray(b&&b.location)?[b.location[0],b.location[1]]:null,address:b&&b.address?String(b.address):"",type:b&&b.type?String(b.type):"",adname:b&&b.adname?String(b.adname):"",lines:Array.isArray(b&&b.lines)?b.lines:[]})).filter(b=>Array.isArray(b.location)&&b.location.length===2),w=Array.isArray(r)&&r.length?r:this.getIsochronePolygonPayload(),T=this.buildHistoryH3ResultSnapshot(),_=this.buildHistoryRoadResultSnapshot(),I={center:[this.selectedPoint.lng,this.selectedPoint.lat],polygon:w,drawn_polygon:Array.isArray(p)&&p.length>=4?p:null,pois:N,keywords:c,location_name:this.selectedPoint.lng.toFixed(4)+","+this.selectedPoint.lat.toFixed(4),mode:this.transportMode,time_min:parseInt(this.timeHorizon),source:this.normalizePoiSource(this.resultDataSource||this.poiDataSource,"local"),h3_result:T,road_result:_};setTimeout(()=>{fetch("/api/v1/analysis/history/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(I)}).then(async b=>{if(!b.ok){let F="";try{F=await b.text()||""}catch{}throw new Error(`HTTP ${b.status}${F?`: ${F.slice(0,200)}`:""}`)}return b.json().catch(()=>({}))}).then(()=>{typeof this.loadHistoryList=="function"&&this.loadHistoryList({force:!0,keepExisting:!0,background:!0,hardRefresh:!0}).catch(b=>{console.warn("refresh history list after save failed",b)})}).catch(b=>{console.warn("Failed to save history",b);const F=b&&b.message?b.message:String(b);this.poiStatus=`分析完成，但历史保存失败：${F}`})},0)}}}function ce(){return{}}function he(){return{async fetchPois(){if(this.lastIsochroneGeoJSON){this.isFetchingPois=!0,this.fetchProgress=0,this.poiStatus="准备抓取...",this.resetRoadSyntaxState(),this.resetFetchSubtypeProgress(),this.clearPoiOverlayLayers({reason:"fetch_pois_start",clearManager:!0,clearSimpleMarkers:!0,resetFilterPanel:!0}),this.allPoisDetails=[];try{const r=this.getIsochronePolygonPayload(),o=this.buildSelectedCategoryBuckets();if(o.length===0){alert("请至少选择一个分类"),this.isFetchingPois=!1;return}let l=0;const h=o.length,c=[];o[0]&&this.updateFetchSubtypeProgressDisplay(o[0]),this.abortController=new AbortController;const p=4,v=this.getPoiSourceLabel(this.poiDataSource);this.poiStatus=`正在并行抓取 ${h} 个分类（每批 ${p} 个，${v}）...`,this.resultDataSource=this.normalizePoiSource(this.poiDataSource,"local");const N=async w=>{const T={polygon:r,keywords:"",types:String(w.types||""),source:this.poiDataSource,save_history:!1,center:[this.selectedPoint.lng,this.selectedPoint.lat],time_min:parseInt(this.timeHorizon),mode:this.transportMode,location_name:this.selectedPoint.name||this.selectedPoint.lng.toFixed(4)+","+this.selectedPoint.lat.toFixed(4)};try{const _=await fetch("/api/v1/analysis/pois",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(T),signal:this.abortController.signal});if(!_.ok){let b="";try{b=await _.text()}catch{}return{list:[],error:`HTTP ${_.status}${b?` ${b.slice(0,240)}`:""}`}}return{list:(await _.json()).pois||[],error:""}}catch(_){return _.name!=="AbortError"&&console.warn(`Failed to fetch category ${w.name}`,_),{list:[],error:_&&_.message?String(_.message):String(_)}}};for(let w=0;w<o.length;w+=p){if(this.abortController.signal.aborted)return;const T=o.slice(w,w+p);(await Promise.all(T.map(N))).forEach((b,F)=>{const E=Array.isArray(b&&b.list)?b.list:[];E&&E.length&&this.allPoisDetails.push(...E);const $=T[F];$&&b&&b.error&&c.push({category:$.name||$.id||`cat_${w+F+1}`,error:b.error}),$&&this.accumulateFetchSubtypeHits($,E||[])}),l=this.allPoisDetails.length;const I=Math.min(w+T.length,h);this.fetchProgress=Math.round(I/h*100),this.poiStatus=`已完成 ${I}/${h} 分类，累计 ${l} 个结果`}if(this.abortController.signal.aborted)return;if(this.allPoisDetails=this.deduplicateFetchedPois(this.allPoisDetails),l=this.allPoisDetails.length,this.fetchProgress=100,l===0&&c.length>0){const w=c[0];throw new Error(`本地源请求失败（${c.length}/${h} 分类）。示例：${w.category} -> ${w.error}`)}this.poiStatus=`完成！共找到 ${l} 个结果`,c.length>0&&(console.warn("[poi-fetch] partial category failures",c),this.poiStatus+=`（${c.length} 个分类失败，已输出到控制台）`),this.rebuildPoiRuntimeSystem(this.allPoisDetails),setTimeout(()=>{this.step=3,this.activeStep3Panel="poi",this.updatePoiCharts(),this.resizePoiChart()},120),this.saveAnalysisHistoryAsync(r,o,this.allPoisDetails)}catch(r){r.name!=="AbortError"&&(console.error(r),this.poiStatus=`失败: ${r.message}`)}finally{this.isFetchingPois=!1,this.abortController=null,this.resetFetchSubtypeProgress()}}},computePoiStats(r){const o=this.poiCategories.map(p=>p.name),l=this.poiCategories.map(p=>p.color||"#888"),h=this.poiCategories.map(()=>0),c={};return this.poiCategories.forEach((p,v)=>{c[p.id]=v}),(r||[]).forEach(p=>{const v=this.resolvePoiCategoryId(p&&p.type);if(!v)return;const N=c[v];Number.isInteger(N)&&N>=0&&(h[N]+=1)}),{labels:o,colors:l,values:h}},getPoiCategoryChartStats(){const r=Array.isArray(this.allPoisDetails)&&this.allPoisDetails.length?this.allPoisDetails:this.markerManager&&typeof this.markerManager.getVisiblePoints=="function"?this.markerManager.getVisiblePoints():[];return this.computePoiStats(r)},updatePoiCharts(){if(!Array.isArray(this.allPoisDetails)||!this.allPoisDetails.length)return;if(this.activeStep3Panel==="poi"&&this.poiSubTab!=="category"){this.refreshPoiKdeOverlay();return}const r=document.getElementById("poiChart");if(!r||!window.echarts)return;const o=echarts.getInstanceByDom(r);if(o&&r.clientWidth>0){this.poiChart=o;const l=this.getPoiCategoryChartStats(),h=l.values.map(p=>Number.isFinite(p)?p:0),c={yAxis:{type:"category",inverse:!0,data:l.labels},series:[{data:h,itemStyle:{color:p=>l.colors[p.dataIndex]||"#888"}}]};o.setOption(c,!1),this.refreshPoiKdeOverlay();return}setTimeout(()=>{const l=this.initPoiChart();if(!l)return;const h=this.getPoiCategoryChartStats(),c=h.values.map(v=>Number.isFinite(v)?v:0),p={grid:{left:50,right:20,top:10,bottom:10,containLabel:!0},xAxis:{type:"value",axisLine:{show:!1},axisTick:{show:!1},splitLine:{lineStyle:{color:"#eee"}}},yAxis:{type:"category",inverse:!0,data:h.labels,axisLine:{show:!1},axisTick:{show:!1}},series:[{type:"bar",data:c,barWidth:12,itemStyle:{color:v=>h.colors[v.dataIndex]||"#888"}}]};try{l.setOption(p,!0),l.resize()}catch(v){console.error("ECharts setOption error:",v)}this.refreshPoiKdeOverlay()},100)}}}function ye(){return Object.freeze({SWITCH_TARGET_MS:120,PREBUILD_DEADLINE_MS:12e4,CONNECTIVITY_NODE_MIN_ZOOM:15,SWITCH_SAMPLE_LIMIT:40,BUILD_BUDGET_MS:Object.freeze({interacting:.8,init:6,steady:4,lineFallbackSmall:12,lineFallbackLarge:8,node:6.5})})}function ue(r={}){const o=r&&r.typeMapConfig||{groups:[]},l=ye(),h=ie(),c=ne(),p=gt(),v=()=>ft(),N=()=>bt(),w=xt(),T=mt(),_=()=>Rt(),I=()=>Pt(),b=Mt(),F=vt(),E=()=>wt(),$=kt(),z=()=>Gt(),V=Dt(),j=()=>zt(),q=Ht(),U=rt(l),K=dt(),Y=ot(l),Z=qt(),Q=()=>lt(l),J=le(),X=de(),W=ce(),tt=he(),t=oe(),e=Object.freeze({queue:typeof jt=="function",overlayCommit:typeof dt=="function",state:typeof lt=="function",controller:typeof ot=="function",ui:typeof rt=="function"}),a=Object.keys(e).filter(R=>!e[R]),i=a.length===0;i||console.error("[road-syntax] module wiring incomplete",{missing:a.slice(),static_version:"frontend-build"});const n=St(),s=At(n,{typeMapConfig:o,roadSyntaxModulesReady:i,roadSyntaxModuleMissing:a.slice(),buildAnalysisPoiRuntimeInitialState:N,buildAnalysisPoiInitialState:v,buildAnalysisHistoryListInitialState:_,buildAnalysisHistoryInitialState:I,buildAnalysisH3InitialState:E,buildAnalysisPopulationInitialState:z,buildAnalysisExportInitialState:j,buildRoadSyntaxInitialState:Q}),d=_t(n),u=Lt(n),y=Ct(n),g=Tt(n),S=Nt(n),x=It(n),m=re([{store:d,fieldKeys:Ot},{store:u,fieldKeys:Ft},{store:y,fieldKeys:Et},{store:g,fieldKeys:$t},{store:S,fieldKeys:Bt},{store:x,fieldKeys:Wt}]);return{pinia:n,initialState:s,storeBackedComputed:m,roadSyntaxModulesReady:i,roadSyntaxModuleMissing:a,methods:{analysisWorkbenchMethods:h,analysisWorkbenchSessionMethods:c,isochroneMethods:p,poiPanelMethods:w,poiRuntimeMethods:T,historyListMethods:b,historyMethods:F,h3Methods:$,populationMethods:V,exportMethods:q,roadSyntaxOverlayCommitMethods:K,roadSyntaxControllerCoreMethods:Y,roadSyntaxWebglMethods:Z,roadSyntaxUiMethods:U,mapOrchestratorMethods:J,historyOrchestratorMethods:X,exportOrchestratorMethods:W,poiFlowOrchestratorMethods:tt,poiMapVisibilityAdapterMethods:t}}}function pe({app:r,pinia:o,target:l="#analysis-app-root"}){if(!r||typeof r.use!="function"||typeof r.mount!="function")throw new Error("invalid app instance for runtime mount");if(!o)throw new Error("pinia instance is required for runtime mount");r.use(o),r.mount(l)}function Se(r={}){const o=!!r.roadSyntaxModulesReady,l=Array.isArray(r.roadSyntaxModuleMissing)?r.roadSyntaxModuleMissing:[];return{async mounted(){try{this.config=window.__ANALYSIS_BOOTSTRAP__&&window.__ANALYSIS_BOOTSTRAP__.config?window.__ANALYSIS_BOOTSTRAP__.config:{amap_js_api_key:"",amap_js_security_code:"",tianditu_key:""},this.initializePoiCategoriesFromTypeMap(),this.basemapSource==="tianditu"&&(await this.validateTiandituSource()||(this.tdtDiagCopyStatus=""));const h=8e3;await Promise.race([this.loadAMapScript(this.config.amap_js_api_key,this.config.amap_js_security_code),new Promise((c,p)=>setTimeout(()=>p(new Error("AMap 加载超时，请检查网络或 Key")),h))]),this.initMap()}catch(h){console.error("Initialization Failed:",h),this.errorMessage="系统初始化失败: "+h.message}finally{this.preloadHistoryListInBackground(),o||this.roadSyntaxSetStatus(`路网模块未完整加载：${l.join(", ")}`),this.attachAmapRuntimeErrorProbe(),document.addEventListener("click",this.handleGlobalClick,!0),this.loadingConfig=!1;const h=document.getElementById("loading-overlay");h&&(h.style.display="none")}},beforeUnmount(){document.removeEventListener("click",this.handleGlobalClick,!0),this.detachAmapRuntimeErrorProbe(),this.destroyPlaceSearch(),this.stopScopeDrawing({destroyTool:!0}),this.clearPoiOverlayLayers({reason:"before_unmount",clearManager:!0,clearSimpleMarkers:!0,clearCenterMarker:!0,resetFilterPanel:!0,immediate:!0}),this.clearPoiKdeOverlay(),this.roadSyntaxDetachMapListeners(),typeof this.cancelRoadSyntaxRequest=="function"&&this.cancelRoadSyntaxRequest("before_unmount"),this.invalidateRoadSyntaxCache("unmount",{resetData:!0}),this.h3ToastTimer&&(clearTimeout(this.h3ToastTimer),this.h3ToastTimer=null),this.cancelHistoryLoading(),this.cancelHistoryDetailLoading(),this.disposePoiChart(),this.disposeH3Charts(),this.disposePopulationCharts(),this.clearPopulationRasterDisplayOnLeave()},watch:{step(h,c){c===1&&h!==1&&(this.destroyPlaceSearch(),this.stopScopeDrawing())},sidebarView(h,c){c==="history"&&h!=="history"&&this.cancelHistoryLoading(),c==="wizard"&&h!=="wizard"&&this.stopScopeDrawing()},activeStep3Panel(h,c){h!==c&&(h==="syntax"?typeof this.resumeRoadSyntaxDisplay=="function"&&this.resumeRoadSyntaxDisplay():typeof this.suspendRoadSyntaxDisplay=="function"&&this.suspendRoadSyntaxDisplay(),h==="syntax"?this.suspendPoiSystemForSyntax():c==="syntax"&&this.resumePoiSystemAfterSyntax(),c==="h3"&&h!=="h3"&&this.clearH3GridDisplayOnLeave(),c==="population"&&h!=="population"&&this.clearPopulationRasterDisplayOnLeave(),h==="h3"&&this.restoreH3GridDisplayOnEnter(),h==="population"&&this.ensurePopulationPanelEntryState(),this.$nextTick(()=>{this.refreshPoiKdeOverlay()}))},roadSyntaxGraphModel(h,c){const p=String(h||"").trim().toLowerCase(),v=String(c||"").trim().toLowerCase();!v||p===v||this.roadSyntaxSetStatus(`图模型已切换为${this.roadSyntaxGraphModelLabel(p)}，请重新计算路网指标`)}}}}function ge(){const r=window.__ANALYSIS_BOOTSTRAP__&&window.__ANALYSIS_BOOTSTRAP__.typeMapConfig||{groups:[]},o=ue({typeMapConfig:r}),{pinia:l,initialState:h,storeBackedComputed:c,roadSyntaxModulesReady:p,roadSyntaxModuleMissing:v,methods:N}=o,{analysisWorkbenchMethods:w,analysisWorkbenchSessionMethods:T,isochroneMethods:_,poiPanelMethods:I,poiRuntimeMethods:b,historyListMethods:F,historyMethods:E,h3Methods:$,populationMethods:z,exportMethods:V,roadSyntaxOverlayCommitMethods:j,roadSyntaxControllerCoreMethods:q,roadSyntaxWebglMethods:U,roadSyntaxUiMethods:K,mapOrchestratorMethods:Y,historyOrchestratorMethods:Z,exportOrchestratorMethods:Q,poiFlowOrchestratorMethods:J,poiMapVisibilityAdapterMethods:X}=N,W=Se({roadSyntaxModulesReady:p,roadSyntaxModuleMissing:v}),tt=ut({data(){return{loadingConfig:!0,config:null,...h,placeSearch:null,placeSearchErrorListener:null,placeSearchLoadingPromise:null,placeSearchBuildToken:0,drawScopeMouseTool:null,drawScopeDrawHandler:null,drawScopeActive:!1,amapRuntimeErrorListener:null,amapRuntimeRejectionListener:null}},computed:c,mounted:W.mounted,beforeUnmount:W.beforeUnmount,watch:W.watch,methods:{...w,...T,..._,...I,...b,...F,...E,...$,...z,...V,...X,...Y,...Z,...Q,...J,...j,...q,...U,...K,async generateH3Grid(){if(!(!this.getIsochronePolygonRing()||this.isGeneratingGrid||this.isComputingH3Analysis)){this.isGeneratingGrid=!0,this.resetH3AnalysisState(),this.h3GridStatus="正在生成网络...";try{const e=this.getIsochronePolygonPayload(),a=await fetch("/api/v1/analysis/h3-grid",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({polygon:e,resolution:this.h3GridResolution,coord_type:"gcj02",include_mode:this.h3GridIncludeMode,min_overlap_ratio:this.h3GridIncludeMode==="intersects"?this.h3GridMinOverlapRatio:0})});if(!a.ok){let s="";try{s=await a.text()}catch{}throw new Error(s||"网络生成失败")}const i=await a.json();this.h3GridFeatures=i.features||[],this.h3GridCount=Number.isFinite(i.count)?i.count:this.h3GridFeatures.length,this.isH3PanelActive()&&this.mapCore&&this.mapCore.setGridFeatures?this.mapCore.setGridFeatures(this.h3GridFeatures,{strokeColor:"#2c6ecb",strokeWeight:1.1,fillOpacity:0,webglBatch:!0}):this.clearH3GridDisplayOnLeave();const n=this.h3GridCount>0?`已生成 ${this.h3GridCount} 个 H3 网格`:"已生成网络，但当前范围无可用网格";this.h3GridStatus=this.isH3PanelActive()?n:`${n}（已就绪，切换到“网格”查看）`}catch(e){console.error(e),this.h3GridStatus="网络生成失败: "+e.message}finally{this.isGeneratingGrid=!1}}},isRoadSyntaxPanelActive(){return this.activeStep3Panel==="syntax"},isRoadSyntaxMetricViewActive(){return this.isRoadSyntaxPanelActive()&&this.roadSyntaxMainTab!=="params"},roadSyntaxMap(){return this.mapCore&&this.mapCore.map?this.mapCore.map:null},roadSyntaxQuantizeChannel(t,e=24){const a=Number.isFinite(Number(t))?Number(t):0,i=Math.max(1,Number(e)||1);return Math.max(0,Math.min(255,Math.round(a/i)*i))},roadSyntaxQuantizeHexColor(t="",e=24){const a=String(t||"").trim(),i=a.startsWith("#")?a.slice(1):a;if(!/^[0-9a-fA-F]{6}$/.test(i))return"#9ca3af";const n=this.roadSyntaxQuantizeChannel(parseInt(i.slice(0,2),16),e),s=this.roadSyntaxQuantizeChannel(parseInt(i.slice(2,4),16),e),d=this.roadSyntaxQuantizeChannel(parseInt(i.slice(4,6),16),e);return`#${n.toString(16).padStart(2,"0")}${s.toString(16).padStart(2,"0")}${d.toString(16).padStart(2,"0")}`},roadSyntaxNormalizeLayerStyleForBucket(t=null){const e=t||{},a=Math.max(1,Number(this.roadSyntaxStyleBucketColorStep||24)),i=Math.max(.1,Number(this.roadSyntaxStyleBucketWeightStep||.5)),n=Math.max(.02,Number(this.roadSyntaxStyleBucketOpacityStep||.08)),s=Number(e.strokeWeight),d=Number(e.strokeOpacity),u=Number(e.zIndex);return{strokeColor:this.roadSyntaxQuantizeHexColor(e.strokeColor||"#9ca3af",a),strokeWeight:Math.max(1,Math.round((Number.isFinite(s)?s:1.8)/i)*i),strokeOpacity:Math.max(.08,Math.min(1,Math.round((Number.isFinite(d)?d:.32)/n)*n)),zIndex:Number.isFinite(u)?Math.round(u):90}},roadSyntaxBuildLayerStyleBucketKey(t=null){const e=this.roadSyntaxNormalizeLayerStyleForBucket(t);return`${e.strokeColor}|${e.strokeWeight}|${e.strokeOpacity}|${e.zIndex}`},roadSyntaxCloneIndexSet(t=null){const e={};return Object.keys(t&&typeof t=="object"?t:{}).forEach(i=>{const n=Number(i);!Number.isFinite(n)||n<0||(e[n]=!0)}),e},roadSyntaxBuildLayerLodIndexSet(t=""){const e=String(t||""),a=Object.assign({},this.roadSyntaxLayerLodIndexCache||{});if(a[e])return this.roadSyntaxCloneIndexSet(a[e]);const i=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems:[];if(!i.length)return{};const n=this.parseRoadSyntaxLayerKey(e),s=n.metric||this.resolveRoadSyntaxActiveMetric(),d=n.radiusLabel||"global",u=this.resolveRoadSyntaxMetricField(s,d),y=this.resolveRoadSyntaxFallbackField(s),g=this.resolveRoadSyntaxRankField(s),S=[];for(let P=0;P<i.length;P+=1){const M=i[P]||{};if((Array.isArray(M.coords)?M.coords:[]).length<2)continue;const A=M.props||{},L=Number(g?A[g]:NaN),k=Number(A[u]),C=Number(A[y]),D=Number.isFinite(L)?this.clamp01(L):Number.isFinite(k)?this.clamp01(k):Number.isFinite(C)?this.clamp01(C):0;S.push({idx:P,score:D})}if(!S.length)return{};S.sort((P,M)=>M.score-P.score||P.idx-M.idx);const x=Math.max(80,Math.floor(Number(this.roadSyntaxLayerLodCap||180))),m=[];if(S.length<=x)S.forEach(P=>m.push(P.idx));else{const P=Math.max(1,Math.min(x,Math.floor(x*.75)));for(let f=0;f<P;f+=1)m.push(S[f].idx);const M=x-m.length;if(M>0){const f=S.slice(P),A=f.length/M;for(let L=0;L<M;L+=1){const k=Math.min(f.length-1,Math.floor(L*A));m.push(f[k].idx)}}}const R={};return m.forEach(P=>{const M=Number(P);!Number.isFinite(M)||M<0||(R[M]=!0)}),a[e]=R,this.roadSyntaxLayerLodIndexCache=a,this.roadSyntaxCloneIndexSet(R)},roadSyntaxResolveDesiredLayerVariant(){const t=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems.length:0;if(!t||typeof this.roadSyntaxResolveLodPolicy!="function")return"full";const e=this.roadSyntaxResolveLodPolicy(t);return e&&e.backboneOnly?"lod":"full"},roadSyntaxResolveLayerRuntimeEntry(t=null,e="full"){const a=String(e||"full"),i=t&&typeof t=="object"?t:null;return i?a==="lod"&&i.lodLayer&&Array.isArray(i.lodLayer.overlays)&&i.lodLayer.overlays.length?i.lodLayer:i:null},roadSyntaxApplyVisibleIndexSet(t={},e=""){const a=this.roadSyntaxCloneIndexSet(t);this.roadSyntaxTargetVisibleLineSet=Object.assign({},a),this.roadSyntaxAppliedVisibleLineSet=Object.assign({},a),this.roadSyntaxOverlayCommitToken=Number(this.roadSyntaxOverlayCommitToken||0)+1,this.roadSyntaxOverlayLastCommitPath="pool_state_apply",this.roadSyntaxOverlayLastCommitReason=String(e||"switch")},roadSyntaxDisposeLayerEntry(t=null,e=null){if(!t)return;const a=e||this.roadSyntaxMap();t.overlayGroup&&this.roadSyntaxSetOverlayGroupVisible(t.overlayGroup,!1,a);const i=Array.isArray(t.overlays)?t.overlays:[];i.length&&this.roadSyntaxSetLinesVisible(i,!1,a,{preferBatch:!0}),t.lodLayer&&this.roadSyntaxDisposeLayerEntry(t.lodLayer,a)},roadSyntaxBuildLayerFromStyles(t="",e=[],a={}){const i=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems:[],n=a&&a.includeIndexSet&&typeof a.includeIndexSet=="object"?a.includeIndexSet:null,s=String(a&&a.variant||"full"),d=Number(a&&a.zIndexBoost||0),u=Object.create(null);let y=0;const g={};let S=0,x=0;const m=[];for(let f=0;f<i.length;f+=1){if(n&&!n[f])continue;const A=i[f]||{},L=Array.isArray(A.coords)?A.coords:[];if(L.length<2)continue;y+=1,g[f]=!0;const k=this.roadSyntaxNormalizeLayerStyleForBucket(e[f]||null),C=d?Object.assign({},k,{zIndex:(Number(k.zIndex)||90)+d}):k,D=this.roadSyntaxBuildLayerStyleBucketKey(C);u[D]||(u[D]={style:C,paths:[]}),u[D].paths.push(L)}const R=[],P=Object.values(u);P.forEach(f=>{const A=f.style||{},L=Array.isArray(f.paths)?f.paths:[];if(!L.length||!window.AMap)return;const k=[];L.forEach((C,D)=>{const G=this.normalizePath(C,2,"road_syntax.layer_build.path");if(!G.length){S+=1,m.length<5&&m.push({layer_key:String(t||""),variant:String(s||""),path_index:D,sample:this.roadSyntaxSummarizeCoordInput(Array.isArray(C)?C[0]:C)});return}k.push(G)}),k.length&&k.forEach(C=>{try{const D=st(new AMap.Polyline({path:C,strokeColor:A.strokeColor||"#9ca3af",strokeWeight:Number(A.strokeWeight)||1.8,strokeOpacity:Number(A.strokeOpacity)||.32,zIndex:Number(A.zIndex)||90,bubble:!0,clickable:!1,cursor:"default"}));R.push(D)}catch{x+=1}})}),(S>0||x>0)&&console.warn("[road-syntax] layer build skipped invalid paths",{layer_key:String(t||""),variant:String(s||""),invalid_path_count:S,polyline_create_error_count:x,sample_paths:m});let M=null;try{window.AMap&&typeof AMap.OverlayGroup=="function"&&R.length&&(M=st(new AMap.OverlayGroup(R)))}catch{M=null}return{layerKey:String(t||""),mode:"bucket_pool",variant:s,overlays:R,overlayGroup:M,bucketCount:P.length,featureCount:y,indexSet:g}},roadSyntaxGetLayer(t=""){const e=this.roadSyntaxLayerPool||{},a=String(t||"");return a&&e[a]||null},roadSyntaxSetStatus(t=""){this.roadSyntaxStatus=String(t||"")},cancelRoadSyntaxRequest(t=""){const e=this.roadSyntaxFetchAbortController;if(!e)return!1;try{e.abort()}catch{}return this.roadSyntaxFetchAbortController=null,t&&console.info("[road-syntax] request aborted",{reason:String(t||"")}),!0},roadSyntaxCreateRunId(){const t=Math.random().toString(36).slice(2,10);return`rs_${Date.now()}_${t}`},roadSyntaxStopProgressTracking(){this.roadSyntaxProgressPollTimer&&(window.clearInterval(this.roadSyntaxProgressPollTimer),this.roadSyntaxProgressPollTimer=null),this.roadSyntaxProgressTickTimer&&(window.clearInterval(this.roadSyntaxProgressTickTimer),this.roadSyntaxProgressTickTimer=null),this.roadSyntaxProgressPolling=!1},roadSyntaxResetProgressState(){this.roadSyntaxStopProgressTracking(),this.roadSyntaxProgressRunId="",this.roadSyntaxProgressStage="",this.roadSyntaxProgressMessage="",this.roadSyntaxProgressStep=0,this.roadSyntaxProgressTotal=0,this.roadSyntaxProgressElapsedSec=0,this.roadSyntaxProgressStartedAtMs=0},async roadSyntaxPollProgressOnce(t=null){const e=String(this.roadSyntaxProgressRunId||"").trim();if(e&&!this.roadSyntaxProgressPolling&&!(t!==null&&t!==this.roadSyntaxRequestToken)){this.roadSyntaxProgressPolling=!0;try{const a=await fetch(`/api/v1/analysis/road-syntax/progress?run_id=${encodeURIComponent(e)}`,{cache:"no-store"});if(!a.ok)return;const i=await a.json(),n=String(i&&i.stage||""),s=String(i&&i.message||""),d=String(i&&i.status||"running"),u=Number(i&&i.step),y=Number(i&&i.total),g=Number(i&&i.elapsed_sec);if(this.roadSyntaxProgressStage=n,this.roadSyntaxProgressMessage=s,this.roadSyntaxProgressStep=Number.isFinite(u)?Math.max(0,Math.floor(u)):0,this.roadSyntaxProgressTotal=Number.isFinite(y)?Math.max(0,Math.floor(y)):0,Number.isFinite(g)&&g>=0&&(this.roadSyntaxProgressElapsedSec=g),s){const x=this.roadSyntaxProgressStep>0&&this.roadSyntaxProgressTotal>0?`进度 ${this.roadSyntaxProgressStep}/${this.roadSyntaxProgressTotal}：${s}`:s;this.roadSyntaxSetStatus(x)}d!=="running"&&this.roadSyntaxStopProgressTracking()}catch{}finally{this.roadSyntaxProgressPolling=!1}}},roadSyntaxStartProgressTracking(t,e=null,a="已提交计算请求"){this.roadSyntaxStopProgressTracking(),this.roadSyntaxProgressRunId=String(t||"").trim(),this.roadSyntaxProgressStage="queued",this.roadSyntaxProgressMessage=String(a||""),this.roadSyntaxProgressStep=0,this.roadSyntaxProgressTotal=9,this.roadSyntaxProgressStartedAtMs=Date.now(),this.roadSyntaxProgressElapsedSec=0,a&&this.roadSyntaxSetStatus(a),this.roadSyntaxProgressRunId&&(this.roadSyntaxProgressTickTimer=window.setInterval(()=>{if(!this.isComputingRoadSyntax||!this.roadSyntaxProgressStartedAtMs)return;const i=Math.max(0,Math.floor((Date.now()-this.roadSyntaxProgressStartedAtMs)/1e3));this.roadSyntaxProgressElapsedSec=i},1e3),this.roadSyntaxProgressPollTimer=window.setInterval(()=>{this.roadSyntaxPollProgressOnce(e)},1e3),this.roadSyntaxPollProgressOnce(e))},roadSyntaxUseLegacyPoolStatus(){return!1},roadSyntaxLogOverlayHealth(t="",e={}){const a=!!(e&&e.force),i=Math.max(0,Number(e&&e.throttleMs||1200)),n=this.roadSyntaxNow(),s=Number(this._roadSyntaxOverlayHealthLastAt||0);if(!a&&n-s<i)return null;if(this._roadSyntaxOverlayHealthLastAt=n,this.roadSyntaxUseArcgisWebgl&&this.roadSyntaxWebglActive&&this.roadSyntaxWebglPayload){const m=Number(((this.roadSyntaxWebglPayload||{}).roads||{}).count||0);return(a||m<=0)&&console.info("[road-syntax] overlay pool health",{reason:String(t||""),active_layer:String(this.roadSyntaxActiveLayerKey||""),visible_lines:m,applied_visible_lines:m,target_visible_lines:m,total_lines:m,mode:"arcgis_webgl"}),{inspectedLines:m,visibleLines:m,invalid:{path:0,endpoint:0,line:0},totalLines:m}}const d=this.roadSyntaxAppliedVisibleLineSet&&typeof this.roadSyntaxAppliedVisibleLineSet=="object"?this.roadSyntaxAppliedVisibleLineSet:{},u=this.roadSyntaxTargetVisibleLineSet&&typeof this.roadSyntaxTargetVisibleLineSet=="object"?this.roadSyntaxTargetVisibleLineSet:{},y=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems.length:0,g=Object.keys(d).length,S=Object.keys(u).length,x=g>0?g:this.roadSyntaxActiveLayerKey?y:0;return(a||x<=0)&&console.info("[road-syntax] overlay pool health",{reason:String(t||""),active_layer:String(this.roadSyntaxActiveLayerKey||""),visible_lines:x,applied_visible_lines:g,target_visible_lines:S,total_lines:y,mode:"bucket_pool"}),{inspectedLines:x,visibleLines:x,invalid:{path:0,endpoint:0,line:0},totalLines:y}},invalidateRoadSyntaxCache(t="manual",e={}){const a=!!(e&&e.resetData),i=!!(e&&e.resetPerf);if(typeof this.roadSyntaxClearMapWriteQueue=="function"&&this.roadSyntaxClearMapWriteQueue({dispose:t==="unmount"}),this.roadSyntaxStyleUpdateToken+=1,this.roadSyntaxPoolWarmToken+=1,this.roadSyntaxLayerBuildToken+=1,this.roadSyntaxLayerSwitchToken+=1,this.roadSyntaxPrewarmToken+=1,this.roadSyntaxStyleApplyToken+=1,this.roadSyntaxSwitchInProgress=!1,this.roadSyntaxSwitchQueuedLayerKey="",this.roadSyntaxSwitchLastAt=0,this.roadSyntaxClearSwitchThrottleTimer(),this.roadSyntaxClearViewportRefreshHandles(),this.roadSyntaxClearNodeRefreshTimer(),this.roadSyntaxBumpViewportRefreshToken(),this._roadSyntaxPinnedAttachKey="",this._roadSyntaxViewportToggleDisabledLogged=!1,this.roadSyntaxOverlayCommitToken=0,this.roadSyntaxOverlayLastCommitPath="",this.roadSyntaxOverlayLastCommitReason="",this.roadSyntaxInteractionLowFidelity=!1,this.roadSyntaxDisplaySuspended=!1,this.clearRoadSyntaxLayerPool(),this.roadSyntaxPolylines=[],this.roadSyntaxPolylineItems=[],this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxResetLodScoreCache(),this.roadSyntaxResetSpatialIndex(),this.roadSyntaxSourceFingerprint="",this.roadSyntaxPoolRadiusLabel="",this.roadSyntaxLastStyleKey="",this.roadSyntaxConnectivityReuseLayerKey="",this.roadSyntaxNodeBuildToken+=1,this.roadSyntaxNodeBuildRunning=!1,this.roadSyntaxNodeSourceFingerprint="",this.clearRoadSyntaxNodeMarkers({immediate:!0}),this.disposeRoadSyntaxScatterChart(),this.roadSyntaxWebglPayload=null,this.roadSyntaxWebglStatus="",this.roadSyntaxWebglRadiusFilterCache=null,typeof this.clearRoadSyntaxArcgisWebgl=="function"&&this.clearRoadSyntaxArcgisWebgl({dispose:t==="unmount"}),a){this.roadSyntaxStatus="",this.roadSyntaxSummary=null,this.roadSyntaxRoadFeatures=[],this.roadSyntaxNodes=[],this.roadSyntaxDiagnostics=null,this.roadSyntaxScatterPointsCache=[],this.roadSyntaxLegendModel=null,this.roadSyntaxSkeletonOnly=!1,this.roadSyntaxMainTab="params";const n=this.roadSyntaxDefaultMetric();this.roadSyntaxMetric=n,this.roadSyntaxLastMetricTab=n,this.roadSyntaxRadiusLabel="global"}i&&(this.roadSyntaxSwitchSamples=[],this.roadSyntaxSwitchLastMs=0,this.roadSyntaxSwitchP50Ms=0,this.roadSyntaxSwitchP95Ms=0,this.roadSyntaxSwitchStatsText="",this.roadSyntaxSwitchPath=""),t==="unmount"&&(this.roadSyntaxStatus="")},resetRoadSyntaxState(){this.roadSyntaxRequestToken+=1,this.isComputingRoadSyntax=!1,this.roadSyntaxResetProgressState(),this.invalidateRoadSyntaxCache("reset-state",{resetData:!0,resetPerf:!0})},clearRoadSyntaxOverlays(){this.invalidateRoadSyntaxCache("clear-overlays",{resetData:!1,resetPerf:!1})},suspendRoadSyntaxDisplay(){const t=this.roadSyntaxMap();if(!t)return;this.roadSyntaxDisplaySuspended=!0,this.roadSyntaxLayerSwitchToken+=1,this.roadSyntaxClearViewportRefreshHandles(),this.roadSyntaxClearNodeRefreshTimer(),this.roadSyntaxBumpViewportRefreshToken(),this._roadSyntaxPinnedAttachKey="",this.roadSyntaxInteractionLowFidelity=!1;const e=this.roadSyntaxGetLayer(this.roadSyntaxActiveLayerKey||""),a=this.roadSyntaxResolveLayerRuntimeEntry(e,this.roadSyntaxActiveLayerVariant||"full");a&&(a.overlayGroup?this.roadSyntaxSetOverlayGroupVisible(a.overlayGroup,!1,t):Array.isArray(a.overlays)&&a.overlays.length&&this.roadSyntaxSetLinesVisible(a.overlays,!1,t,{preferBatch:!0})),this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxCurrentStride=1,typeof this.setRoadSyntaxArcgisWebglVisible=="function"&&this.setRoadSyntaxArcgisWebglVisible(!1),this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1),this.disposeRoadSyntaxScatterChart()},resumeRoadSyntaxDisplay(){if(!this.roadSyntaxSummary||!Array.isArray(this.roadSyntaxRoadFeatures)||!this.roadSyntaxRoadFeatures.length){this.roadSyntaxDisplaySuspended=!1;return}if(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload)){this.roadSyntaxDisplaySuspended=!1,this.renderRoadSyntaxByMetric(this.resolveRoadSyntaxActiveMetric());return}if(this.roadSyntaxStrictWebglOnly){this.roadSyntaxDisplaySuspended=!1,this.roadSyntaxSetStatus(this.buildRoadSyntaxWebglUnavailableMessage(this.roadSyntaxWebglPayload));return}this._roadSyntaxPinnedAttachKey="",this.roadSyntaxDisplaySuspended=!0,this.renderRoadSyntaxOverlays({type:"FeatureCollection",features:this.roadSyntaxRoadFeatures},{forceRebuild:!1,displayActive:!0})},clearRoadSyntaxLayerPool(){const t=this.roadSyntaxMap(),e=Array.isArray(this.roadSyntaxPolylines)?this.roadSyntaxPolylines:[];this.roadSyntaxSetLinesVisible(e,!1,t,{preferBatch:!0}),this.roadSyntaxClearViewportRefreshHandles(),this.roadSyntaxClearNodeRefreshTimer();const a=this.roadSyntaxLayerPool||{};Object.keys(a).forEach(i=>{this.roadSyntaxDisposeLayerEntry(a[i],t)}),this.roadSyntaxLayerPool={},this.roadSyntaxLayerStyleCache={},this.roadSyntaxLayerLodIndexCache={},this.roadSyntaxPolylines=[],this.roadSyntaxTargetVisibleLineSet={},this.roadSyntaxAppliedVisibleLineSet={},this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxResetLodScoreCache(),this.roadSyntaxResetSpatialIndex(),this.roadSyntaxBumpViewportRefreshToken(),this.roadSyntaxInteractionLowFidelity=!1,this.roadSyntaxCurrentStride=1,this.roadSyntaxActiveLayerKey="",this.roadSyntaxActiveLayerVariant="full",this.roadSyntaxPendingLayerKey="",this.roadSyntaxLayerBuildState={},this.roadSyntaxLayerBuildQueue=[],this.roadSyntaxLayerBuildRunning=!1,this.roadSyntaxPoolInitRunning=!1,this.roadSyntaxPoolReady=!1,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitTotal=0,this.roadSyntaxPoolInitDone=0,this.roadSyntaxLayerReadyMap={},this.roadSyntaxConnectivityReuseLayerKey=""},refreshRoadSyntaxLayerReadyMap(){const t=this.roadSyntaxLayerKeysForPrebuild(),e=this.roadSyntaxLayerBuildState||{},a=this.roadSyntaxLayerStyleCache||{},i={};return t.forEach(n=>{i[n]=!!a[n]&&e[n]==="ready"}),this.roadSyntaxLayerReadyMap=i,this.roadSyntaxPoolInitTotal=t.length,this.roadSyntaxPoolInitDone=Object.values(i).filter(n=>!!n).length,i},isRoadSyntaxMetricReady(t=null,e={}){if(!this.roadSyntaxSummary)return!1;const a=String(t||this.resolveRoadSyntaxActiveMetric()||this.roadSyntaxDefaultMetric());if(this.roadSyntaxStrictWebglOnly)return!!(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload));if(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload))return!0;const i=e&&Object.prototype.hasOwnProperty.call(e,"radiusLabel")?String(e.radiusLabel||"global"):this.roadSyntaxMetricUsesRadius(a)?String(this.roadSyntaxRadiusLabel||"global"):"global",n=e&&Object.prototype.hasOwnProperty.call(e,"skeletonOnly")?!!e.skeletonOnly:!1,s=this.resolveRoadSyntaxLayerKey(a,{radiusLabel:i,skeletonOnly:n});return this.isRoadSyntaxLayerReady(s)},canActivateRoadSyntaxTab(t){const e=String(t||"").trim();return e==="params"?!0:this.roadSyntaxSummary?this.isRoadSyntaxMetricReady(e):!1},canToggleRoadSyntaxSkeleton(){const t=this.resolveRoadSyntaxActiveMetric();return!this.roadSyntaxSupportsSkeleton(t)||!this.roadSyntaxSummary||this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload)?!1:this.roadSyntaxSkeletonOnly?this.isRoadSyntaxMetricReady(t,{skeletonOnly:!1}):this.isRoadSyntaxMetricReady(t,{skeletonOnly:!0})},cancelRoadSyntaxNodeBuild(){this.roadSyntaxNodeBuildToken+=1,this.roadSyntaxNodeBuildRunning=!1},shouldRenderRoadSyntaxConnectivityNodes(){if(!this.mapCore||!this.mapCore.map)return!1;const t=Number(this.roadSyntaxConnectivityNodeMinZoom||15),e=Number(this.mapCore.map.getZoom?this.mapCore.map.getZoom():NaN);return Number.isFinite(e)?e>=t:!0},setRoadSyntaxNodeMarkersVisible(t){if(!Array.isArray(this.roadSyntaxNodeMarkers)||!this.roadSyntaxNodeMarkers.length)return;t&&!this.shouldRenderRoadSyntaxConnectivityNodes()&&(t=!1);const e=this.roadSyntaxNodeMarkers.slice(),a=t&&this.mapCore&&this.mapCore.map?this.mapCore.map:null;this.roadSyntaxEnqueueMapWrite(()=>(e.forEach(i=>this.safeMapSet(i,a)),{ok:!0,marker_count:e.length,visible:!!a}),{key:"road_syntax_node_visibility",replaceExisting:!0,meta:{reason:"road_syntax_node_visibility",marker_count:e.length,visible:!!a}})},clearRoadSyntaxNodeMarkers(t={}){if(this.cancelRoadSyntaxNodeBuild(),!Array.isArray(this.roadSyntaxNodeMarkers)){this.roadSyntaxNodeMarkers=[];return}const e=!!(t&&t.immediate),a=this.roadSyntaxNodeMarkers.slice();if(this.roadSyntaxNodeMarkers=[],!!a.length){if(e){a.forEach(i=>this.safeMapSet(i,null));return}this.roadSyntaxEnqueueMapWrite(()=>(a.forEach(i=>this.safeMapSet(i,null)),{ok:!0,marker_count:a.length}),{key:"road_syntax_node_clear",replaceExisting:!1,meta:{reason:"road_syntax_node_clear",marker_count:a.length}})}},disposeRoadSyntaxScatterChart(){this.clearRoadSyntaxScatterRenderTimer();const t=this.roadSyntaxScatterChart;t&&typeof t.dispose=="function"&&t.dispose(),this.roadSyntaxScatterChart=null},clearRoadSyntaxScatterRenderTimer(){this.roadSyntaxScatterRenderTimer&&(window.clearTimeout(this.roadSyntaxScatterRenderTimer),this.roadSyntaxScatterRenderTimer=null)},scheduleRoadSyntaxScatterRender(t=0){if(this.roadSyntaxMainTab!=="intelligibility")return;const e=Math.max(0,Number(t)||0),a=8;this.clearRoadSyntaxScatterRenderTimer();const i=e===0?0:Math.min(180,40+e*20);this.roadSyntaxScatterRenderTimer=window.setTimeout(()=>{this.roadSyntaxScatterRenderTimer=null,!this.renderRoadSyntaxScatterChart()&&e<a&&this.roadSyntaxMainTab==="intelligibility"&&this.scheduleRoadSyntaxScatterRender(e+1)},i)},setRoadSyntaxMainTab(t,e={}){const a=String(t||"").trim();if(!(this.roadSyntaxTabs||[]).map(y=>y.value).includes(a))return;if(a!=="params"&&this.roadSyntaxPoolInitRunning&&this.roadSyntaxUseLegacyPoolStatus()){this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载中",this.roadSyntaxPoolInitDone,this.roadSyntaxPoolInitTotal||0));return}const n=e.syncMetric!==!1,s=e.refresh!==!1,d=this.roadSyntaxMainTab,u=this.roadSyntaxMetric;if(this.roadSyntaxMainTab=a,a==="params"){this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1),this.disposeRoadSyntaxScatterChart(),this.mapCore&&typeof this.mapCore.setRadius=="function"&&this.mapCore.setRadius(0);return}if(!this.isRoadSyntaxMetricReady(a)){if(this.roadSyntaxStrictWebglOnly)this.roadSyntaxSetStatus(`指标“${this.roadSyntaxLabelByMetric(a)}”对应 ArcGIS-WebGL 数据未就绪`);else{const y=this.roadSyntaxLayerReadyCounts();this.roadSyntaxPoolDegraded?this.roadSyntaxSetStatus(`图层预处理已降级，指标“${this.roadSyntaxLabelByMetric(a)}”仍未就绪（${y.ready}/${y.total||0}）`):this.roadSyntaxSetStatus(`指标“${this.roadSyntaxLabelByMetric(a)}”仍在预处理（${y.ready}/${y.total||0}）`)}return}n&&(this.roadSyntaxMetric=a,this.roadSyntaxLastMetricTab=a),this.roadSyntaxMetricUsesRadius(a)?this.roadSyntaxHasRadiusLabel(this.roadSyntaxRadiusLabel)||(this.roadSyntaxRadiusLabel="global"):this.roadSyntaxRadiusLabel="global",this.roadSyntaxApplyRadiusCircle(a),!(d===a&&u===this.roadSyntaxMetric)&&s&&this.refreshRoadSyntaxOverlay()},roadSyntaxMetricTabs(){return(this.roadSyntaxTabs||[]).filter(t=>t.value!=="params")},roadSyntaxDefaultMetric(){const t=this.roadSyntaxMetricTabs();return t.length?String(t[0]&&t[0].value||"connectivity"):"connectivity"},roadSyntaxMetricDataCount(t=null){const e=String(t||this.resolveRoadSyntaxActiveMetric()||this.roadSyntaxDefaultMetric()),a=this.roadSyntaxSummary||{};return Number(e==="control"?a.control_valid_count||0:e==="depth"?a.depth_valid_count||0:a.edge_count||0)},isRoadSyntaxMetricAvailable(t=null){const e=String(t||this.resolveRoadSyntaxActiveMetric()||this.roadSyntaxDefaultMetric());return e!=="control"&&e!=="depth"?!0:this.roadSyntaxMetricDataCount(e)>0},roadSyntaxLabelByMetric(t){const e=String(t||"").trim(),a=this.roadSyntaxMetricTabs().find(i=>i.value===e);return a?a.label:e},roadSyntaxMetricUsesRadius(t=null){const e=t||this.roadSyntaxMetric||this.roadSyntaxDefaultMetric();return e==="choice"||e==="integration"},roadSyntaxSupportsSkeleton(t=null){return!1},onRoadSyntaxMetricChange(t){this.setRoadSyntaxMainTab(t)},formatRoadSyntaxMetricValue(t){const e=this.roadSyntaxSummary||{},a=t||this.roadSyntaxDefaultMetric();if(!this.isRoadSyntaxMetricAvailable(a))return"--";let i=NaN;if(a==="accessibility")i=Number(e.avg_accessibility_global??e.avg_closeness);else if(a==="connectivity")i=Number(e.avg_connectivity??e.avg_degree);else if(a==="control")i=Number(e.avg_control);else if(a==="depth")i=Number(e.avg_depth);else if(a==="choice"){const n=this.roadSyntaxNormalizeRadiusLabel(this.roadSyntaxRadiusLabel,a),s=e.avg_choice_by_radius&&typeof e.avg_choice_by_radius=="object"?e.avg_choice_by_radius:{};i=Number(n==="global"?e.avg_choice_global:s[n]),Number.isFinite(i)||(i=Number(e.avg_choice_global))}else if(a==="integration"){const n=this.roadSyntaxNormalizeRadiusLabel(this.roadSyntaxRadiusLabel,a),s=e.avg_integration_by_radius&&typeof e.avg_integration_by_radius=="object"?e.avg_integration_by_radius:{};i=Number(n==="global"?e.avg_integration_global:s[n]),Number.isFinite(i)||(i=Number(e.avg_integration_global))}else a==="intelligibility"&&(i=Number(e.avg_intelligibility));return Number.isFinite(i)?a==="connectivity"?i.toFixed(2):a==="intelligibility"?i.toFixed(4):i.toFixed(6):"--"},roadSyntaxRadiusOptions(){const e=(this.roadSyntaxSummary&&Array.isArray(this.roadSyntaxSummary.radius_labels)?this.roadSyntaxSummary.radius_labels:[]).map(i=>String(i||"").trim().toLowerCase()),a=[{value:"global",label:"等时圈内"}];return e.includes("r600")&&a.push({value:"r600",label:"600m"}),e.includes("r800")&&a.push({value:"r800",label:"800m"}),a},roadSyntaxHasRadiusLabel(t){const e=String(t||"").trim().toLowerCase();return e?this.roadSyntaxRadiusOptions().some(a=>String(a.value)===e):!1},roadSyntaxNormalizeRadiusLabel(t,e=null){const a=e||this.resolveRoadSyntaxActiveMetric(),i=String(t||"global").trim().toLowerCase();return this.roadSyntaxMetricUsesRadius(a)&&this.roadSyntaxHasRadiusLabel(i)?i:"global"},roadSyntaxRadiusMeters(t=null,e=null){const a=this.roadSyntaxNormalizeRadiusLabel(t??this.roadSyntaxRadiusLabel,e);return a==="r600"?600:a==="r800"?800:0},roadSyntaxApplyRadiusCircle(t=null){const e=t||this.resolveRoadSyntaxActiveMetric();let a=0;this.roadSyntaxMetricUsesRadius(e)&&(a=this.roadSyntaxRadiusMeters(this.roadSyntaxRadiusLabel,e));const i=!!(this.selectedPoint&&Number.isFinite(Number(this.selectedPoint.lng))&&Number.isFinite(Number(this.selectedPoint.lat)));this.mapCore&&typeof this.mapCore.setRadius=="function"&&this.mapCore.setRadius(a>0&&i?a:0)},setRoadSyntaxRadiusLabel(t){const e=this.resolveRoadSyntaxActiveMetric();if(!this.roadSyntaxMetricUsesRadius(e))return;const a=this.roadSyntaxNormalizeRadiusLabel(t,e);if(this.roadSyntaxHasRadiusLabel(a)){if(a===String(this.roadSyntaxRadiusLabel||"global")){this.roadSyntaxApplyRadiusCircle(e);return}this.roadSyntaxRadiusLabel=a,this.roadSyntaxApplyRadiusCircle(e),this.refreshRoadSyntaxOverlay()}},normalizeRoadSyntaxGraphModel(t=null){return String(t??this.roadSyntaxGraphModel).trim().toLowerCase()==="axial"?"axial":"segment"},roadSyntaxGraphModelLabel(t=null){return this.normalizeRoadSyntaxGraphModel(t)==="axial"?"轴线图":"线段图"},async fetchRoadSyntaxApi(t,e={}){const a=e&&e.signal?e.signal:void 0,i=await fetch("/api/v1/analysis/road-syntax",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t),signal:a});if(!i.ok){let n="";try{const s=await i.json();s&&typeof s=="object"&&(typeof s.detail=="string"&&s.detail.trim()?n=s.detail.trim():n=JSON.stringify(s))}catch{try{n=await i.text()}catch{}}throw new Error(n||"路网分析失败")}return await i.json()},async applyRoadSyntaxDataset(t,e="connectivity"){if(this.invalidateRoadSyntaxCache("switch-road-syntax-scope",{resetData:!1,resetPerf:!1}),this.applyRoadSyntaxResponseData(t,e),!this.roadSyntaxSummary)return;const a=this.roadSyntaxLastMetricTab||this.roadSyntaxMetric||this.roadSyntaxDefaultMetric();this.setRoadSyntaxMainTab(a,{refresh:!1,syncMetric:!0}),this.activeStep3Panel==="syntax"&&await this.renderRoadSyntaxByMetric(a)},resolveRoadSyntaxRequestMetric(){return this.roadSyntaxMetric==="choice"?"choice":"integration"},clamp01(t){return Math.max(0,Math.min(1,Number(t)||0))},blendTwoColor(t,e,a){const i=Array.isArray(t)?t:[0,0,0],n=Array.isArray(e)?e:[0,0,0],s=this.clamp01(a),d=Math.round(i[0]+(n[0]-i[0])*s),u=Math.round(i[1]+(n[1]-i[1])*s),y=Math.round(i[2]+(n[2]-i[2])*s),g=S=>{const x=Math.max(0,Math.min(255,S)).toString(16);return x.length===1?"0"+x:x};return`#${g(d)}${g(u)}${g(y)}`},blendPaletteColor(t,e){const a=Array.isArray(t)&&t.length?t:[[0,0,0],[255,255,255]],i=this.clamp01(e),n=g=>{const S=Math.max(0,Math.min(255,g)).toString(16);return S.length===1?"0"+S:S};if(a.length===1){const g=a[0];return`#${n(g[0])}${n(g[1])}${n(g[2])}`}const s=Math.min(a.length-2,Math.floor(i*(a.length-1))),d=s/(a.length-1),u=(s+1)/(a.length-1),y=(i-d)/Math.max(1e-9,u-d);return this.blendTwoColor(a[s],a[s+1],y)},onRoadSyntaxDisplayRangeChange(){const t=this.clamp01(Number(this.roadSyntaxDisplayBlue)),e=this.clamp01(Number(this.roadSyntaxDisplayRed));this.roadSyntaxDisplayBlue=Number.isFinite(t)?t:0,this.roadSyntaxDisplayRed=Number.isFinite(e)?e:1,this.roadSyntaxMainTab!=="params"&&this.refreshRoadSyntaxOverlay()},roadSyntaxDepthmapColorSchemes(){return{axmanesque:["#3333dd","#3388dd","#22ccdd","#22ccbb","#22dd88","#88dd22","#bbcc22","#ddcc22","#dd8833","#dd3333"],hueonlyaxmanesque:["#3333dd","#3377dd","#33bbdd","#33ddbb","#33dd55","#55dd33","#bbdd33","#ddbb33","#dd7733","#dd3333"],bluered:["#4575b4","#91bfdb","#e0f3f8","#ffffbf","#fee090","#fc8d59","#d73027"],purpleorange:["#542788","#998ec3","#d8daeb","#f7f7f7","#fee0b6","#f1a340","#b35806"],greyscale:["#000000","#444444","#777777","#aaaaaa","#cccccc","#eeeeee","#ffffff"],monochrome:["#000000","#444444","#777777","#aaaaaa","#cccccc","#eeeeee","#ffffff"]}},roadSyntaxDepthmapColorScaleOptions(){return[{value:"axmanesque",label:"Equal Ranges (3-Colour)"},{value:"bluered",label:"Equal Ranges (Blue-Red)"},{value:"purpleorange",label:"Equal Ranges (Purple-Orange)"},{value:"depthmapclassic",label:"depthmapX Classic"},{value:"greyscale",label:"Equal Ranges (Greyscale)"},{value:"monochrome",label:"Equal Ranges (Monochrome)"},{value:"hueonlyaxmanesque",label:"Equal Ranges (3-Colour Hue Only)"}]},roadSyntaxDepthmapColorScaleLabel(){const t=String(this.roadSyntaxDepthmapColorScale||"axmanesque"),a=this.roadSyntaxDepthmapColorScaleOptions().find(i=>String(i.value)===t);return a?a.label:"Equal Ranges (3-Colour)"},roadSyntaxDepthmapDisplayParams(){const t=this.clamp01(Number(this.roadSyntaxDisplayBlue)),e=this.clamp01(Number(this.roadSyntaxDisplayRed));let a=t,i=e,n=!1;return a>i&&(n=!0,a=1-t,i=1-e),{rawBlue:t,rawRed:e,blue:this.clamp01(a),red:this.clamp01(i),inverted:n}},roadSyntaxDepthmapPalette(){const t=this.roadSyntaxDepthmapColorSchemes(),e=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase();return Array.isArray(t[e])&&t[e].length?t[e]:t.axmanesque},roadSyntaxDepthmapClassIndex(t,e){const a=Math.max(1,Number(e)||1),i=this.clamp01(t),n=Math.floor((i-1e-9)*a);return Math.max(0,Math.min(a-1,n))},roadSyntaxDepthmapScaledField(t){if(!Number.isFinite(Number(t)))return NaN;const e=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase(),a=this.roadSyntaxDepthmapDisplayParams();let i=this.clamp01(Number(t));if(a.inverted&&(i=1-i),e==="depthmapclassic")return i;const n=a.red-a.blue;if(!(n>1e-9))return .5;const s=(i-a.blue)/n;return Number.isFinite(s)?this.clamp01(s):.5},roadSyntaxNormalizeScoreByRange(t,e,a){const i=Number(t),n=Number(e),s=Number(a);return Number.isFinite(i)?!Number.isFinite(n)||!Number.isFinite(s)||s<=n?this.clamp01(i):this.clamp01((i-n)/Math.max(1e-9,s-n)):0},roadSyntaxDepthmapClassicByte(t){const e=this.clamp01(t),a=Math.floor((e+.0333)*15);return Math.max(0,Math.min(255,a*17))},roadSyntaxDepthmapClassicColor(t,e=null,a=null){const i=this.clamp01(t),n=this.roadSyntaxDepthmapDisplayParams(),s=Number.isFinite(Number(e))?this.clamp01(Number(e)):n.blue,d=Number.isFinite(Number(a))?this.clamp01(Number(a)):n.red,u=s+(d-s)/10;let y=0,g=0,S=0;i>=0&&i<s?(y=this.roadSyntaxDepthmapClassicByte(.5*(s-i)/Math.max(1e-9,s)),S=255):i>=s&&i<(u+s)/2?(S=255,g=this.roadSyntaxDepthmapClassicByte(2*(i-s)/Math.max(1e-9,u-s))):i>=(u+s)/2&&i<u?(S=this.roadSyntaxDepthmapClassicByte(2*(u-i)/Math.max(1e-9,u-s)),g=255):i>=u&&i<(u+d)/2?(g=255,y=this.roadSyntaxDepthmapClassicByte(2*(i-u)/Math.max(1e-9,d-u))):i>=(u+d)/2&&i<d?(g=this.roadSyntaxDepthmapClassicByte(2*(d-i)/Math.max(1e-9,d-u)),y=255):(y=255,S=this.roadSyntaxDepthmapClassicByte(.5*(i-d)/Math.max(1e-9,1-d)));const x=m=>{const R=Math.max(0,Math.min(255,Number(m)||0)).toString(16);return R.length===1?`0${R}`:R};return`#${x(y)}${x(g)}${x(S)}`},roadSyntaxDepthmapClassColor(t,e=null){const a=Array.isArray(e)&&e.length?e:this.roadSyntaxDepthmapPalette(),i=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase();if(!Number.isFinite(Number(t)))return i==="monochrome"||i==="greyscale"?"rgba(0,0,0,0)":"#7f7f7f";const n=this.roadSyntaxDepthmapScaledField(t);if(i==="depthmapclassic"){const d=this.roadSyntaxDepthmapDisplayParams();return this.roadSyntaxDepthmapClassicColor(n,d.blue,d.red)}const s=this.roadSyntaxDepthmapClassIndex(n,a.length);return String(a[s]||"#3333dd")},roadSyntaxEqualRangeLegendItems(t,e=null){const a=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase(),i=Array.isArray(e)&&e.length?e:this.roadSyntaxDepthmapPalette(),n=a==="depthmapclassic"?new Array(10).fill(0).map((x,m)=>this.roadSyntaxDepthmapClassColor((m+.5)/10,i)):i,s=(Array.isArray(t)?t:[]).map(x=>Number(x)).filter(x=>Number.isFinite(x)).sort((x,m)=>x-m);if(!s.length)return n.map((x,m)=>({color:x,label:`等级 ${m+1}`}));const d=s[0],u=s[s.length-1];if(!(u>d))return n.map((x,m)=>({color:x,label:m===0?`${d.toFixed(2)}`:"-"}));const y=u-d,g=n,S=this.roadSyntaxDepthmapDisplayParams();return g.map((x,m)=>{let R=m/g.length,P=(m+1)/g.length;a!=="depthmapclassic"&&(R=S.blue+(S.red-S.blue)*R,P=S.blue+(S.red-S.blue)*P);const M=d+y*this.clamp01(R),f=d+y*this.clamp01(P);return{color:x,label:`${M.toFixed(2)} - ${f.toFixed(2)}`}})},roadSyntaxSummarizeCoordInput(t){if(t===null)return{type:"null"};if(typeof t>"u")return{type:"undefined"};if(typeof t=="string")return{type:"string",value:String(t).slice(0,80)};if(Array.isArray(t))return{type:"array",length:t.length,head:t.slice(0,2)};if(typeof t=="object"){const e={type:"object"};return Object.prototype.hasOwnProperty.call(t,"lng")&&(e.lng=t.lng),Object.prototype.hasOwnProperty.call(t,"lat")&&(e.lat=t.lat),Object.prototype.hasOwnProperty.call(t,"lon")&&(e.lon=t.lon),typeof t.getLng=="function"&&(e.getLng=!0),typeof t.getLat=="function"&&(e.getLat=!0),e}return{type:typeof t,value:t}},roadSyntaxLogInvalidCoordInput(t="",e=null){const a=String(t||"unknown");this._roadSyntaxInvalidCoordStats||(this._roadSyntaxInvalidCoordStats=Object.create(null));const i=this._roadSyntaxInvalidCoordStats;i[a]||(i[a]={count:0}),i[a].count+=1;const n=i[a].count;n<=5?console.warn("[road-syntax] invalid coordinate input",{source:a,count:n,sample:this.roadSyntaxSummarizeCoordInput(e)}):n%100===0&&console.warn("[road-syntax] invalid coordinate input aggregated",{source:a,count:n})},normalizeLngLat(t,e=""){let a=NaN,i=NaN;if(Array.isArray(t)&&t.length>=2)a=Number(t[0]),i=Number(t[1]);else if(t&&typeof t=="object")typeof t.getLng=="function"&&typeof t.getLat=="function"?(a=Number(t.getLng()),i=Number(t.getLat())):Object.prototype.hasOwnProperty.call(t,"lng")&&Object.prototype.hasOwnProperty.call(t,"lat")?(a=Number(t.lng),i=Number(t.lat)):Object.prototype.hasOwnProperty.call(t,"lon")&&Object.prototype.hasOwnProperty.call(t,"lat")&&(a=Number(t.lon),i=Number(t.lat));else if(typeof t=="string"){const n=t.split(",");n.length>=2&&(a=Number(n[0].trim()),i=Number(n[1].trim()))}return!Number.isFinite(a)||!Number.isFinite(i)?(this.roadSyntaxLogInvalidCoordInput(e||"normalize_lnglat",t),null):a<-180||a>180||i<-90||i>90?(this.roadSyntaxLogInvalidCoordInput(e||"normalize_lnglat_range",{input:this.roadSyntaxSummarizeCoordInput(t),lng:a,lat:i}),null):[a,i]},normalizePath(t,e=2,a=""){const i=Array.isArray(t)?t:[],n=[];return i.forEach(s=>{const d=this.normalizeLngLat(s,a||"normalize_path");d&&n.push(d)}),n.length>=e?n:[]},resolveRoadSyntaxActiveMetric(){const t=this.roadSyntaxDefaultMetric(),e=this.roadSyntaxMetricTabs().map(s=>String(s.value||"")),a=this.roadSyntaxMainTab==="params"?this.roadSyntaxLastMetricTab||this.roadSyntaxMetric:this.roadSyntaxMetric,i=String(a||"").trim();if(e.includes(i))return i;const n=String(this.roadSyntaxMetric||"").trim();return e.includes(n)?n:t},resolveRoadSyntaxMetricField(t=null,e=null){const a=t||this.resolveRoadSyntaxActiveMetric(),i=this.roadSyntaxNormalizeRadiusLabel(e??this.roadSyntaxRadiusLabel,a);return a==="connectivity"?"connectivity_score":a==="control"?"control_score":a==="depth"?"depth_score":a==="intelligibility"?"intelligibility_score":a==="choice"?i==="global"?"choice_global":`choice_${i}`:a==="integration"?i==="global"?"integration_global":`integration_${i}`:"connectivity_score"},resolveRoadSyntaxLayerKey(t=null,e={}){const a=t||this.resolveRoadSyntaxActiveMetric(),i=e&&Object.prototype.hasOwnProperty.call(e,"skeletonOnly")?!!e.skeletonOnly:!!this.roadSyntaxSkeletonOnly,n=e&&Object.prototype.hasOwnProperty.call(e,"radiusLabel")?String(e.radiusLabel||"global"):this.roadSyntaxMetricUsesRadius(a)?String(this.roadSyntaxRadiusLabel||"global"):"global",s=this.roadSyntaxNormalizeRadiusLabel(n,a),u=(typeof this.roadSyntaxSupportsSkeleton=="function"?!!this.roadSyntaxSupportsSkeleton(a):a==="choice"||a==="integration")?i:!1,y=this.roadSyntaxMetricUsesRadius(a)?s:"global";return`${a}|${y}|${u?1:0}`},parseRoadSyntaxLayerKey(t){const e=String(t||"").split("|"),a=e[0]||this.roadSyntaxDefaultMetric(),i=e[1]||"global",n=e[2]==="1";return{metric:a,radiusLabel:i,skeletonOnly:n}},roadSyntaxLayerKeysForPrebuild(){const t=this.roadSyntaxRadiusOptions().map(i=>String(i.value||"global")),e=t.map(i=>this.resolveRoadSyntaxLayerKey("choice",{radiusLabel:i,skeletonOnly:!1})),a=t.map(i=>this.resolveRoadSyntaxLayerKey("integration",{radiusLabel:i,skeletonOnly:!1}));return[this.resolveRoadSyntaxLayerKey("connectivity",{radiusLabel:"global",skeletonOnly:!1}),this.resolveRoadSyntaxLayerKey("control",{radiusLabel:"global",skeletonOnly:!1}),this.resolveRoadSyntaxLayerKey("depth",{radiusLabel:"global",skeletonOnly:!1}),...e,...a,this.resolveRoadSyntaxLayerKey("intelligibility",{radiusLabel:"global",skeletonOnly:!1})]},resolveRoadSyntaxRankField(t){return t==="choice"?"rank_quantile_choice":t==="integration"?"rank_quantile_integration":t==="accessibility"?"rank_quantile_accessibility":""},roadSyntaxScoreFromProps(t,e,a){const i=d=>{if(!t||typeof t!="object")return NaN;if(!Object.prototype.hasOwnProperty.call(t,d))return NaN;const u=t[d];if(u===null||typeof u>"u"||u==="")return NaN;const y=Number(u);return Number.isFinite(y)?y:NaN},n=i(e),s=i(a);return Number.isFinite(n)?this.clamp01(n):Number.isFinite(s)?this.clamp01(s):NaN},roadSyntaxQuantileBreakLabels(t){const e=(Array.isArray(t)?t:[]).map(i=>Number(i)).filter(i=>Number.isFinite(i)).sort((i,n)=>i-n);if(!e.length)return["P10 --","P30 --","P70 --","P90 --"];const a=i=>{const n=Math.max(0,Math.min(1,i));if(e.length===1)return e[0];const s=n*(e.length-1),d=Math.floor(s),u=Math.min(e.length-1,d+1),y=s-d;return e[d]+(e[u]-e[d])*y};return[`P10 ${a(.1).toFixed(2)}`,`P30 ${a(.3).toFixed(2)}`,`P70 ${a(.7).toFixed(2)}`,`P90 ${a(.9).toFixed(2)}`]},buildRoadSyntaxLegendModel(t){const e=t||this.resolveRoadSyntaxActiveMetric(),a=this.resolveRoadSyntaxMetricField(e),i=this.resolveRoadSyntaxFallbackField(e),n=this.roadSyntaxDepthmapPalette(),s=this.roadSyntaxDepthmapColorScaleLabel();let u=(Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems:[]).map(y=>this.roadSyntaxScoreFromProps(y&&y.props||{},a,i));return u.length||(u=(Array.isArray(this.roadSyntaxRoadFeatures)?this.roadSyntaxRoadFeatures:[]).map(g=>this.roadSyntaxScoreFromProps(g&&g.properties||{},a,i))),e==="accessibility"?{type:"discrete",title:`可达性（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,n)}:e==="integration"?{type:"discrete",title:`整合度（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,n)}:e==="choice"?{type:"discrete",title:`选择度（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,n)}:e==="connectivity"?{type:"discrete",title:`连接度（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,n)}:e==="control"?{type:"discrete",title:`控制值（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,n)}:e==="depth"?{type:"discrete",title:`深度值（${s}）`,items:this.roadSyntaxEqualRangeLegendItems(u,n)}:{type:"discrete",title:"可理解度（散点回归）",items:[{label:"样本点",color:"#2563eb"},{label:"回归线",color:"#dc2626"}]}},roadSyntaxFootnoteByMetric(t=null){const e=t||this.resolveRoadSyntaxActiveMetric(),a=this.roadSyntaxDepthmapColorScaleLabel(),i=this.roadSyntaxDepthmapDisplayParams(),n=`(Blue=${i.rawBlue.toFixed(2)}, Red=${i.rawRed.toFixed(2)})`;if(e==="connectivity")return`连接度采用 depthmapX ${a} ${n} 的线段着色图表达，不启用节点点层。`;if(e==="control"){const s=String(this.roadSyntaxSummary&&this.roadSyntaxSummary.control_source_column||"");return this.isRoadSyntaxMetricAvailable("control")?s==="topology_fallback"?"控制值当前采用拓扑回退计算（depthmap 控制列不可用或近常量），用于保障稳定显示。":`控制值采用 depthmapX ${a} ${n} 的线段着色表达。`:`控制值当前无有效样本${s?`（列：${s}）`:""}，请检查 depthmap 输出列与分析参数。`}if(e==="depth"){if(!this.isRoadSyntaxMetricAvailable("depth")){const s=String(this.roadSyntaxSummary&&this.roadSyntaxSummary.depth_source_column||"");return`深度值当前无有效样本${s?`（列：${s}）`:""}，请检查 depthmap 输出列与分析参数。`}return`深度值采用 depthmapX ${a} ${n} 的线段着色表达。`}return e==="choice"?`选择度采用 depthmapX ${a} ${n} 的线段着色表达。`:e==="integration"?`整合度采用 depthmapX ${a} ${n} 的线段着色表达网络中心性。`:e==="intelligibility"?"可理解度主表达为散点回归图（x=连接度，y=整合度）；地图蓝线为网络参考层。":`连接度采用 depthmapX ${a} ${n} 的线段着色表达。`},roadSyntaxRegressionView(){const t=this.roadSyntaxDiagnostics||{},e=t.regression||{},a=this.roadSyntaxSummary||{},i=Number(e.r),n=Number(e.r2),s=Number(e.n),d=Number(a.avg_intelligibility),u=Number(a.avg_intelligibility_r2);return{r:Number.isFinite(i)?i.toFixed(4):Number.isFinite(d)?d.toFixed(4):"--",r2:Number.isFinite(n)?n.toFixed(4):Number.isFinite(u)?u.toFixed(4):"--",n:Number.isFinite(s)?String(Math.round(s)):String((t.intelligibility_scatter||[]).length||0),slope:Number.isFinite(Number(e.slope))?Number(e.slope):0,intercept:Number.isFinite(Number(e.intercept))?Number(e.intercept):0}},buildRoadSyntaxStyleForMetric(t,e,a,i,n=null){const s=this.roadSyntaxScoreFromProps(t,e,a),d=i||this.resolveRoadSyntaxActiveMetric(),y=(typeof this.roadSyntaxSupportsSkeleton=="function"?!!this.roadSyntaxSupportsSkeleton(d):d==="choice"||d==="integration")&&(n===null?!!this.roadSyntaxSkeletonOnly:!!n),g=this.roadSyntaxDepthmapPalette(),S=String(this.roadSyntaxDepthmapColorScale||"axmanesque").toLowerCase(),x=this.roadSyntaxDepthmapClassColor(s,g),m=2.1,M=!Number.isFinite(Number(s))&&(S==="monochrome"||S==="greyscale")?0:.88;if(d==="accessibility")return{strokeColor:x,strokeWeight:m,strokeOpacity:M,zIndex:90};if(d==="integration"){const f=!!(t&&t.is_skeleton_integration_top20);return y&&!f?{strokeColor:"#a1a1aa",strokeWeight:1.5,strokeOpacity:.15,zIndex:82}:{strokeColor:x,strokeWeight:m,strokeOpacity:M,zIndex:91}}if(d==="choice"){const f=!!(t&&t.is_skeleton_choice_top20);return y&&!f?{strokeColor:"#9ca3af",strokeWeight:1.5,strokeOpacity:.15,zIndex:82}:{strokeColor:x,strokeWeight:m,strokeOpacity:M,zIndex:92}}return d==="connectivity"?{strokeColor:x,strokeWeight:m,strokeOpacity:M,zIndex:80}:d==="control"?{strokeColor:x,strokeWeight:m,strokeOpacity:M,zIndex:81}:d==="depth"?{strokeColor:x,strokeWeight:m,strokeOpacity:M,zIndex:81}:d==="intelligibility"?{strokeColor:"#2563eb",strokeWeight:2.2,strokeOpacity:.62,zIndex:79}:{strokeColor:"#9ca3af",strokeWeight:1.4,strokeOpacity:.22,zIndex:79}},refreshRoadSyntaxOverlay(){if(this.roadSyntaxMainTab==="params")return;const t=this.resolveRoadSyntaxActiveMetric();if(t==="intelligibility"){const n=this.parseRoadSyntaxLayerKey(this.roadSyntaxActiveLayerKey||""),s=String(n&&n.metric||"");if((typeof this.roadSyntaxIsArcgisWebglActive=="function"?this.roadSyntaxIsArcgisWebglActive():!!this.roadSyntaxWebglActive)&&s==="intelligibility"){this.roadSyntaxLegendModel=this.buildRoadSyntaxLegendModel(t),this.$nextTick(()=>this.scheduleRoadSyntaxScatterRender(0));return}}const e=this.roadSyntaxSupportsSkeleton(t),a=e?!!this.roadSyntaxSkeletonOnly:!1;if(!e&&this.roadSyntaxSkeletonOnly&&(this.roadSyntaxSkeletonOnly=!1),!this.isRoadSyntaxMetricReady(t,{skeletonOnly:a})){if(this.roadSyntaxStrictWebglOnly)this.roadSyntaxSetStatus(this.buildRoadSyntaxWebglUnavailableMessage(this.roadSyntaxWebglPayload));else{const n=this.roadSyntaxLayerReadyCounts();this.roadSyntaxSetStatus(`目标图层仍在预处理（${n.ready}/${n.total||0}）`)}return}this.renderRoadSyntaxByMetric(this.resolveRoadSyntaxActiveMetric())},async renderRoadSyntaxByMetric(t=null){const e=t||this.resolveRoadSyntaxActiveMetric();this.roadSyntaxApplyRadiusCircle(e);const a=this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload);if(a&&typeof this.renderRoadSyntaxArcgisWebgl=="function"){let i=!1;try{i=await this.renderRoadSyntaxArcgisWebgl(this.roadSyntaxWebglPayload,{hideWhenSuspended:!0})}catch(n){i=!1,console.warn("[road-syntax] arcgis webgl render failed",n)}if(i){this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1),e==="intelligibility"?this.$nextTick(()=>this.scheduleRoadSyntaxScatterRender(0)):this.disposeRoadSyntaxScatterChart(),this.roadSyntaxLegendModel=this.buildRoadSyntaxLegendModel(e);return}}if(this.clearRoadSyntaxOverlays(),this.roadSyntaxLegendModel=null,this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1),this.disposeRoadSyntaxScatterChart(),a){const i=String(this.roadSyntaxWebglStatus||"").trim();this.roadSyntaxSetStatus(i?`ArcGIS-WebGL 渲染失败（已禁用旧版回退）: ${i}`:"ArcGIS-WebGL 渲染失败（已禁用旧版回退）")}else this.roadSyntaxSetStatus(this.buildRoadSyntaxWebglUnavailableMessage(this.roadSyntaxWebglPayload))},resolveRoadSyntaxFallbackField(t){let e="connectivity_score";return t==="choice"?e="choice_score":t==="integration"?e="integration_score":t==="connectivity"?e="degree_score":t==="control"?e="control_score":t==="depth"?e="depth_score":t==="intelligibility"&&(e="intelligibility_score"),e},renderRoadSyntaxNodeMarkers(t={}){if(!this.mapCore||!this.mapCore.map||!window.AMap)return;const e=!!(t&&t.forceRebuild);if(!this.shouldRenderRoadSyntaxConnectivityNodes()){this.cancelRoadSyntaxNodeBuild(),this.setRoadSyntaxNodeMarkersVisible(!1);return}let a=Array.isArray(this.roadSyntaxNodes)?this.roadSyntaxNodes:[];if(!a.length){const m={};(this.roadSyntaxPolylineItems||[]).forEach(R=>{const P=Array.isArray(R&&R.coords)?R.coords:[],M=R&&R.props||{},f=this.clamp01(Number(M.degree_score));[P[0],P[P.length-1]].forEach(L=>{const k=this.normalizeLngLat(L,"road_syntax.node_fallback.endpoint");if(!k)return;const C=`${k[0].toFixed(6)},${k[1].toFixed(6)}`,D=m[C];(!D||f>D.score)&&(m[C]={loc:k,score:f})})}),a=Object.keys(m).map(R=>({geometry:{coordinates:m[R].loc},properties:{degree_score:m[R].score,degree:Math.round(m[R].score*10),integration_global:0}}))}if(!a.length){this.clearRoadSyntaxNodeMarkers({immediate:!0});return}const i=Number(this.mapCore.map.getZoom?this.mapCore.map.getZoom():NaN);let n=a;if(Number.isFinite(i)&&i<16&&a.length>2200){const m=Math.max(1,Math.ceil(a.length/1800));n=a.filter((R,P)=>P%m===0)}const s=this.normalizeLngLat(((n[0]||{}).geometry||{}).coordinates||[],"road_syntax.node_fingerprint.first")||[0,0],d=this.normalizeLngLat(((n[n.length-1]||{}).geometry||{}).coordinates||[],"road_syntax.node_fingerprint.last")||[0,0],u=`${n.length}|${s[0].toFixed(6)},${s[1].toFixed(6)}|${d[0].toFixed(6)},${d[1].toFixed(6)}`;if(!e&&u===this.roadSyntaxNodeSourceFingerprint&&Array.isArray(this.roadSyntaxNodeMarkers)&&this.roadSyntaxNodeMarkers.length){this.setRoadSyntaxNodeMarkersVisible(!0);return}this.clearRoadSyntaxNodeMarkers({immediate:!0});const y=this.roadSyntaxNodeBuildToken+1;this.roadSyntaxNodeBuildToken=y,this.roadSyntaxNodeBuildRunning=!0;const g=[];let S=0;const x=()=>{if(y!==this.roadSyntaxNodeBuildToken){this.roadSyntaxEnqueueMapWrite(()=>(g.forEach(f=>this.safeMapSet(f,null)),{ok:!0,marker_count:g.length}),{key:`road_syntax_node_build_abort:${y}`,replaceExisting:!1,meta:{reason:"road_syntax_node_build_abort",marker_count:g.length}});return}if(!this.shouldRenderRoadSyntaxConnectivityNodes()){this.roadSyntaxEnqueueMapWrite(()=>(g.forEach(f=>this.safeMapSet(f,null)),{ok:!0,marker_count:g.length}),{key:`road_syntax_node_build_hidden:${y}`,replaceExisting:!1,meta:{reason:"road_syntax_node_build_hidden",marker_count:g.length}}),this.roadSyntaxNodeBuildRunning=!1;return}const m=window.performance&&typeof window.performance.now=="function"?()=>window.performance.now():()=>Date.now(),R=m(),P=this.roadSyntaxResolveFrameBudget("node"),M=[];for(;S<n.length;){const f=n[S]||{};S+=1;const A=this.normalizeLngLat(((f||{}).geometry||{}).coordinates||[],"road_syntax.node_marker.center");if(!A)continue;const L=f&&f.properties||{},k=this.clamp01(Number(L.degree_score)),C=new AMap.CircleMarker({center:A,radius:3+k*7,strokeColor:"#ffffff",strokeWeight:1,fillColor:this.blendTwoColor([203,213,225],[153,27,27],k),fillOpacity:.88,zIndex:115,bubble:!0,clickable:!1,cursor:"default"});if(g.push(C),M.push(C),m()-R>=P)break}if(M.length){const f=M.length,A=S;this.roadSyntaxEnqueueMapWrite(()=>{if(y!==this.roadSyntaxNodeBuildToken)return M.forEach(k=>this.safeMapSet(k,null)),{ok:!1,skipped:!0,reason:"stale_node_build_chunk"};const L=this.mapCore&&this.mapCore.map&&this.shouldRenderRoadSyntaxConnectivityNodes()?this.mapCore.map:null;return M.forEach(k=>this.safeMapSet(k,L)),{ok:!0,marker_count:f,visible:!!L}},{key:`road_syntax_node_build_chunk:${y}:${A}`,replaceExisting:!1,meta:{reason:"road_syntax_node_build_chunk",marker_count:f}})}if(this.roadSyntaxNodeMarkers=g,S<n.length){window.requestAnimationFrame(x);return}this.roadSyntaxNodeBuildRunning=!1,this.roadSyntaxNodeSourceFingerprint=u,this.setRoadSyntaxNodeMarkersVisible(!0)};window.requestAnimationFrame(x)},renderRoadSyntaxScatterChart(){if(this.roadSyntaxMainTab!=="intelligibility")return this.disposeRoadSyntaxScatterChart(),!1;if(!window.echarts)return this.roadSyntaxSetStatus("可理解度图表库未加载（echarts）"),!1;const t=document.getElementById("roadSyntaxScatterChart");if(!t||t.clientWidth===0||t.clientHeight===0)return!1;const e=this.roadSyntaxDiagnostics||{};let a=this.normalizeRoadSyntaxScatterPoints(e.intelligibility_scatter);if(!a.length&&Array.isArray(this.roadSyntaxScatterPointsCache)&&this.roadSyntaxScatterPointsCache.length&&(a=this.normalizeRoadSyntaxScatterPoints(this.roadSyntaxScatterPointsCache)),a.length||(a=this.buildRoadSyntaxScatterFallbackPoints()),a.length&&(this.roadSyntaxScatterPointsCache=a.slice()),!a.length){this.roadSyntaxSetStatus("可理解度样本为空（暂无可回归数据）");let y=this.roadSyntaxScatterChart;return(!y||y.isDisposed())&&(y=echarts.getInstanceByDom(t)||echarts.init(t),this.roadSyntaxScatterChart=y),y.setOption({animation:!1,xAxis:{show:!1,min:0,max:1},yAxis:{show:!1,min:0,max:1},series:[],graphic:[{type:"text",left:"center",top:"middle",style:{text:"暂无可理解度样本点",fill:"#6b7280",fontSize:13}}]},!0),y.resize(),!0}let i=this.roadSyntaxScatterChart;(!i||i.isDisposed())&&(i=echarts.getInstanceByDom(t)||echarts.init(t),this.roadSyntaxScatterChart=i);const n=this.roadSyntaxRegressionView(),s=Math.min(...a.map(y=>y[0])),d=Math.max(...a.map(y=>y[0])),u=Number.isFinite(n.slope)&&Number.isFinite(n.intercept)?[[s,n.slope*s+n.intercept],[d,n.slope*d+n.intercept]]:[];try{i.setOption({animation:!1,grid:{left:42,right:16,top:20,bottom:34},xAxis:{type:"value",name:"连接度",nameLocation:"middle",nameGap:26,splitLine:{lineStyle:{color:"#eef2f7"}}},yAxis:{type:"value",name:"整合度",nameGap:14,splitLine:{lineStyle:{color:"#eef2f7"}}},series:[{type:"scatter",data:a,symbolSize:6,z:3,itemStyle:{color:"#2563eb",opacity:.82,borderColor:"#ffffff",borderWidth:.8},emphasis:{scale:!1}},{type:"line",data:u,showSymbol:!1,z:2,lineStyle:{width:2,color:"#dc2626",opacity:u.length?.9:0}}],graphic:[]},!0)}catch(y){console.warn("[road-syntax] scatter setOption failed, retry with simplified series",y),i.clear(),i.setOption({animation:!1,grid:{left:42,right:16,top:20,bottom:34},xAxis:{type:"value",name:"连接度",nameLocation:"middle",nameGap:26},yAxis:{type:"value",name:"整合度",nameGap:14},series:[{type:"scatter",data:a,symbolSize:6,itemStyle:{color:"#2563eb",opacity:.85},emphasis:{scale:!1}}],graphic:[]},!0)}return i.resize(),String(this.roadSyntaxStatus||"").indexOf("可理解度样本为空")>=0&&this.roadSyntaxSetStatus(""),!0},normalizeRoadSyntaxScatterPoints(t){const e=Array.isArray(t)?t:[],a=[];if(e.forEach(i=>{let n=NaN,s=NaN;Array.isArray(i)?(n=Number(i[0]),s=Number(i[1])):i&&typeof i=="object"&&(n=Number(i.x),Number.isFinite(n)||(n=Number(i.connectivity_score??i.connectivity??i.degree_score??i.degree)),s=Number(i.y),Number.isFinite(s)||(s=Number(i.integration_global??i.integration_score??i.integration))),Number.isFinite(n)&&Number.isFinite(s)&&a.push([n,s])}),a.length>8e3){const i=Math.max(1,Math.ceil(a.length/8e3));return a.filter((n,s)=>s%i===0)}return a},buildRoadSyntaxScatterFallbackPoints(){let t=[];const e=Array.isArray(this.roadSyntaxNodes)?this.roadSyntaxNodes:[];if(e.length&&(t=e.map(a=>{const i=a&&a.properties||{};return[Number.isFinite(Number(i.degree_score))?Number(i.degree_score):Number(i.degree),Number(i.integration_global)]}).filter(a=>Number.isFinite(a[0])&&Number.isFinite(a[1]))),t.length||(t=(Array.isArray(this.roadSyntaxRoadFeatures)?this.roadSyntaxRoadFeatures:[]).map(i=>{const n=i&&i.properties||{};return[Number(n.connectivity_score),Number(n.integration_global)]}).filter(i=>Number.isFinite(i[0])&&Number.isFinite(i[1]))),t.length>8e3){const a=Math.max(1,Math.ceil(t.length/8e3));t=t.filter((i,n)=>n%a===0)}return t},buildRoadSyntaxRenderItems(t){const e=[];let a=0;const i=[];return(Array.isArray(t)?t:[]).forEach((n,s)=>{const d=this.normalizePath(((n||{}).geometry||{}).coordinates||[],2,"road_syntax.render_items.path");if(!d.length){if(a+=1,i.length<5){const u=(n||{}).properties||{};i.push({idx:s,id:u.edge_id||u.id||"",name:u.name||""})}return}e.push({coords:d,boundsRect:this.buildRoadSyntaxBoundsRect(d),props:(n||{}).properties||{}})}),a>0&&console.warn("[road-syntax] skipped invalid road geometries",{invalid_count:a,total_features:Array.isArray(t)?t.length:0,samples:i}),e},buildRoadSyntaxRenderFingerprint(t){const e=Array.isArray(t)?t:[];if(!e.length)return"0";const a=e[0]||{},i=e[e.length-1]||{},n=this.normalizeLngLat((a.coords||[])[0],"road_syntax.render_fingerprint.first")||[0,0],s=i.coords||[],d=this.normalizeLngLat(s[s.length-1],"road_syntax.render_fingerprint.last")||[0,0];return`${e.length}|${n[0].toFixed(6)},${n[1].toFixed(6)}|${d[0].toFixed(6)},${d[1].toFixed(6)}`},rebuildRoadSyntaxBasePolylines(){return this.roadSyntaxPolylines=[],this.roadSyntaxLayerLodIndexCache={},this.roadSyntaxTargetVisibleLineSet={},this.roadSyntaxAppliedVisibleLineSet={},this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxResetLodScoreCache(),this.roadSyntaxResetSpatialIndex(),[]},isRoadSyntaxLayerReady(t){if(this.roadSyntaxStrictWebglOnly)return!!(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload));if(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload))return!0;const e=this.roadSyntaxLayerBuildState||{};return!!(this.roadSyntaxLayerStyleCache||{})[t]&&e[t]==="ready"},enqueueRoadSyntaxLayerBuild(t,e={}){if(this.roadSyntaxStrictWebglOnly||!this.roadSyntaxMap()||!window.AMap||!Array.isArray(this.roadSyntaxPolylineItems)||!this.roadSyntaxPolylineItems.length)return;const a=!!(e&&e.priority),i=!!(e&&e.switchOnReady),n=Object.assign({},this.roadSyntaxLayerBuildState||{}),s=Array.isArray(this.roadSyntaxLayerBuildQueue)?this.roadSyntaxLayerBuildQueue.slice():[],d=n[t];if(d==="ready"){i&&(this.roadSyntaxPendingLayerKey=t,this.switchRoadSyntaxLayerByKey(t));return}if(d==="building"||d==="queued"){i&&(this.roadSyntaxPendingLayerKey=t);return}n[t]="queued",a?s.unshift(t):s.push(t),i&&(this.roadSyntaxPendingLayerKey=t),this.roadSyntaxLayerBuildState=n,this.roadSyntaxLayerBuildQueue=s,this.scheduleRoadSyntaxLayerBuilder()},scheduleRoadSyntaxLayerBuilder(){if(this.roadSyntaxLayerBuildRunning)return;const t=Array.isArray(this.roadSyntaxLayerBuildQueue)?this.roadSyntaxLayerBuildQueue:[];if(!t.length)return;const e=t.shift();this.roadSyntaxLayerBuildQueue=t;const a=Object.assign({},this.roadSyntaxLayerBuildState||{});a[e]="building",this.roadSyntaxLayerBuildState=a,this.roadSyntaxLayerBuildRunning=!0;const i=this.roadSyntaxLayerBuildToken+1;this.roadSyntaxLayerBuildToken=i;const n=this.parseRoadSyntaxLayerKey(e),s=n.metric,d=this.resolveRoadSyntaxMetricField(s,n.radiusLabel),u=this.resolveRoadSyntaxFallbackField(s),y=Array.isArray(this.roadSyntaxPolylineItems)?this.roadSyntaxPolylineItems:[],g=[];let S=0;const x=()=>{if(i!==this.roadSyntaxLayerBuildToken)return;if(this.roadSyntaxIsInteractingInMetricView()){window.setTimeout(()=>{i===this.roadSyntaxLayerBuildToken&&window.requestAnimationFrame(x)},60);return}const m=window.performance&&typeof window.performance.now=="function"?()=>window.performance.now():()=>Date.now(),R=m(),P=this.roadSyntaxResolveFrameBudget("layer");for(;S<y.length;){const B=y[S]||{};S+=1;const pt=this.buildRoadSyntaxStyleForMetric(B&&B.props||{},d,u,s,n.skeletonOnly);if(g.push(pt),m()-R>=P)break}if(S<y.length){window.requestAnimationFrame(x);return}const M=Object.assign({},this.roadSyntaxLayerStyleCache||{});M[e]=g,this.roadSyntaxLayerStyleCache=M;const f=this.roadSyntaxMap(),A=Object.assign({},this.roadSyntaxLayerPool||{});A[e]&&this.roadSyntaxDisposeLayerEntry(A[e],f);const L=this.roadSyntaxBuildLayerFromStyles(e,g,{variant:"full"}),k=this.roadSyntaxBuildLayerLodIndexSet(e),C=this.roadSyntaxBuildLayerFromStyles(e,g,{variant:"lod",includeIndexSet:k,zIndexBoost:3});L.lodLayer=C,L.lodIndexSet=this.roadSyntaxCloneIndexSet(C.indexSet||k),A[e]=L,this.roadSyntaxLayerPool=A;const D=Object.assign({},this.roadSyntaxLayerBuildState||{});D[e]="ready",this.roadSyntaxLayerBuildState=D,this.roadSyntaxLayerBuildRunning=!1;const G=this.refreshRoadSyntaxLayerReadyMap(),et=Object.values(G).filter(B=>!!B).length,H=Object.keys(G).length;if(H>0&&et>=H){const B=!!this.roadSyntaxPoolDegraded;this.roadSyntaxPoolReady=!0,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitRunning&&(this.roadSyntaxPoolInitRunning=!1),B&&this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层补建完成",et,H))}else this.roadSyntaxPoolInitRunning&&this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载中",et,H));this.roadSyntaxPendingLayerKey===e&&this.switchRoadSyntaxLayerByKey(e,{force:!0}),this.scheduleRoadSyntaxLayerBuilder()};window.requestAnimationFrame(x)},switchRoadSyntaxLayerByKey(t,e={}){if(!this.roadSyntaxMap())return;const i=!e||e.trackPerf!==!1,n=this.roadSyntaxNow();if(!this.roadSyntaxUseArcgisWebgl){this.roadSyntaxSetStatus("ArcGIS-WebGL 未启用，旧版回退已禁用");return}if(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload)){this.roadSyntaxActiveLayerKey=String(t||this.resolveRoadSyntaxLayerKey(this.resolveRoadSyntaxActiveMetric())),this.roadSyntaxActiveLayerVariant="full",this.roadSyntaxPendingLayerKey="",this.roadSyntaxDisplaySuspended=!1,typeof this.renderRoadSyntaxArcgisWebgl=="function"?this.renderRoadSyntaxArcgisWebgl(this.roadSyntaxWebglPayload,{hideWhenSuspended:!0}).then(s=>{s?i&&this.recordRoadSyntaxSwitchDuration(n,t,0,0,"arcgis_webgl"):this.roadSyntaxStrictWebglOnly&&this.roadSyntaxSetStatus("ArcGIS-WebGL 切换失败（已禁用旧版回退）")}).catch(s=>{console.warn("[road-syntax] arcgis webgl switch render failed",s),this.roadSyntaxStrictWebglOnly&&this.roadSyntaxSetStatus("ArcGIS-WebGL 切换失败（已禁用旧版回退）")}):this.roadSyntaxStrictWebglOnly&&this.roadSyntaxSetStatus("ArcGIS-WebGL 渲染器不可用（已禁用旧版回退）");return}this.roadSyntaxSetStatus(this.buildRoadSyntaxWebglUnavailableMessage(this.roadSyntaxWebglPayload))},warmRoadSyntaxLayerPool(t=""){const e=this.roadSyntaxLayerBuildState||{};this.roadSyntaxLayerKeysForPrebuild().filter(i=>{if(i===t)return!1;const n=e[i];return n!=="ready"&&n!=="building"&&n!=="queued"}).forEach(i=>this.enqueueRoadSyntaxLayerBuild(i,{priority:!1,switchOnReady:!1}))},waitRoadSyntaxLayerReady(t,e=ROAD_SYNTAX_CONST.PREBUILD_DEADLINE_MS){return new Promise(a=>{const i=Date.now(),n=()=>{if(this.isRoadSyntaxLayerReady(t)){a(!0);return}if(Date.now()-i>e){a(!1);return}window.setTimeout(n,25)};n()})},prewarmRoadSyntaxLayerVisibility(t,e=""){return t!==this.roadSyntaxRequestToken?Promise.resolve(!1):Promise.resolve(!0)},prewarmRoadSyntaxSwitchPath(t,e=""){return Promise.resolve(t===this.roadSyntaxRequestToken)},async initializeRoadSyntaxPoolFully(t,e=""){if(this.roadSyntaxStrictWebglOnly)return this.roadSyntaxPoolInitRunning=!1,this.roadSyntaxPoolReady=!0,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitTotal=1,this.roadSyntaxPoolInitDone=1,!0;const a=this.roadSyntaxLayerKeysForPrebuild(),i=e?[e].concat(a.filter(S=>S!==e)):a.slice();if(!i.length)return this.roadSyntaxPoolReady=!0,this.roadSyntaxPoolDegraded=!1,!0;const n=Number(this.roadSyntaxPrebuildDeadlineMs||ROAD_SYNTAX_CONST.PREBUILD_DEADLINE_MS),s=Date.now();this.roadSyntaxPoolInitRunning=!0,this.roadSyntaxPoolReady=!1,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitTotal=i.length,this.roadSyntaxPoolInitDone=0,this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载中",0,i.length)),this.refreshRoadSyntaxLayerReadyMap(),i.forEach((S,x)=>this.enqueueRoadSyntaxLayerBuild(S,{priority:x===0,switchOnReady:!1}));let d=!1;for(let S=0;S<i.length;S+=1){if(t!==this.roadSyntaxRequestToken)return this.roadSyntaxPoolInitRunning=!1,!1;const x=Date.now()-s,m=n-x;if(m<=0){d=!0;break}if(!await this.waitRoadSyntaxLayerReady(i[S],m)){d=!0;break}this.roadSyntaxPoolInitDone=S+1,this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载中",this.roadSyntaxPoolInitDone,this.roadSyntaxPoolInitTotal))}this.roadSyntaxPoolInitRunning=!1;const u=this.refreshRoadSyntaxLayerReadyMap(),y=Object.values(u).filter(S=>!!S).length,g=y>=i.length;if(this.roadSyntaxPoolReady=g,this.roadSyntaxPoolDegraded=!g,g&&(this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(this.roadSyntaxFormatReadyStatus("图层预加载完成",y,i.length)),this.roadSyntaxEnableHeavyPrewarm)){const S=this.roadSyntaxPrewarmToken+1;this.roadSyntaxPrewarmToken=S,window.setTimeout(async()=>{if(S===this.roadSyntaxPrewarmToken&&t===this.roadSyntaxRequestToken)try{await this.prewarmRoadSyntaxLayerVisibility(t,e||i[0]||""),await this.prewarmRoadSyntaxSwitchPath(t,e||i[0]||"")}catch{}},0)}return!g&&d&&this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(`图层预加载超时，进入降级模式：${y}/${i.length}`),g},renderRoadSyntaxOverlays(t,e={}){if(this.roadSyntaxStrictWebglOnly){this.roadSyntaxSetStatus("ArcGIS-WebGL 模式已启用，旧版图层渲染已禁用");return}if(!this.roadSyntaxMap()||!window.AMap)return;typeof this.clearRoadSyntaxArcgisWebgl=="function"&&this.clearRoadSyntaxArcgisWebgl({dispose:!1});const a=!!(e&&e.forceRebuild),i=!(e&&e.displayActive===!1),n=(t||{}).features||[];if(this.roadSyntaxRoadFeatures=Array.isArray(n)?n:[],!this.roadSyntaxRoadFeatures.length){this.clearRoadSyntaxOverlays();return}const s=this.buildRoadSyntaxRenderItems(this.roadSyntaxRoadFeatures);if(!s.length){this.clearRoadSyntaxOverlays();return}const d=this.buildRoadSyntaxRenderFingerprint(s);(a||!this.roadSyntaxSourceFingerprint||this.roadSyntaxSourceFingerprint!==d||!Object.keys(this.roadSyntaxLayerPool||{}).length)&&(this.roadSyntaxPoolWarmToken+=1,this.roadSyntaxLayerBuildToken+=1,this.roadSyntaxLayerSwitchToken+=1,this.clearRoadSyntaxLayerPool(),this.roadSyntaxPolylineItems=s,this.roadSyntaxSourceFingerprint=d,this.roadSyntaxPoolRadiusLabel=String(this.roadSyntaxRadiusLabel||"global"),this.roadSyntaxPoolReady=!1,this.roadSyntaxPoolDegraded=!1,this.rebuildRoadSyntaxBasePolylines()),this.roadSyntaxResetVisibleIndexCache(),this.roadSyntaxResetLodScoreCache();const y=this.resolveRoadSyntaxActiveMetric(),g=this.resolveRoadSyntaxLayerKey(y);if(i){if(this.isRoadSyntaxLayerReady(g)){const S=this.roadSyntaxResolveDesiredLayerVariant(),x=this.roadSyntaxDisplaySuspended||!this.roadSyntaxGetLayer(g);this.switchRoadSyntaxLayerByKey(g,{force:x,preferVariant:S})}else{this.enqueueRoadSyntaxLayerBuild(g,{priority:!0,switchOnReady:!0});const S=this.roadSyntaxLayerReadyCounts();this.roadSyntaxUseLegacyPoolStatus()&&this.roadSyntaxSetStatus(`图层预处理中：${S.ready}/${S.total||0}`)}this.roadSyntaxLogOverlayHealth("render-road-syntax")}this.warmRoadSyntaxLayerPool(g),this.refreshRoadSyntaxLayerReadyMap(),this.roadSyntaxPolylineItems=s},buildRoadSyntaxRequestPayload(t,e,a=null){const i=this.resolveRoadSyntaxActiveMetric(),n=this.resolveRoadSyntaxMetricField(i,this.roadSyntaxRadiusLabel),s=this.roadSyntaxStrictWebglOnly?!0:!!this.roadSyntaxUseArcgisWebgl,d=i==="control"||i==="depth"||i==="connectivity"||i==="intelligibility",u=this.normalizeRoadSyntaxGraphModel();return{run_id:a?String(a):null,polygon:t,coord_type:"gcj02",mode:"walking",graph_model:u,highway_filter:"all",include_geojson:!0,max_edge_features:d?null:e,merge_geojson_edges:!0,merge_bucket_step:.025,radii_m:[600,800],tulip_bins:1024,metric:this.resolveRoadSyntaxRequestMetric(),use_arcgis_webgl:s,arcgis_timeout_sec:120,arcgis_metric_field:n}},roadSyntaxResponseHasReadyWebgl(t){const e=t&&t.webgl&&typeof t.webgl=="object"?t.webgl:null;return typeof this.roadSyntaxCanUseArcgisWebglPayload!="function"?!1:this.roadSyntaxCanUseArcgisWebglPayload(e)},buildRoadSyntaxWebglUnavailableMessage(t){const e=t&&t.webgl&&typeof t.webgl=="object"?t.webgl:t&&typeof t=="object"?t:null;if(!e||typeof e!="object")return"ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: payload_missing";const a=!!e.enabled,i=String(e&&e.status||"").trim(),n=e&&e.roads&&typeof e.roads=="object"?e.roads:{},s=Array.isArray(n.features)?n.features:[],d=s.length,u=Number(n.count),y=Number.isFinite(u)?u:s.length;return a?i&&i!=="ok"?`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: ${i}`:d<=0?`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: features=0, count=${y}`:y<=0?"ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: roads=0":`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: payload_invalid(status=${i||"empty"}, features=${d}, count=${y})`:i?`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: enabled=false, status=${i}, features=${d}, count=${y}`:`ArcGIS-WebGL 数据未就绪（已禁用旧版回退）: enabled=false, features=${d}, count=${y}`},applyRoadSyntaxResponseData(t,e="connectivity"){if(this.roadSyntaxRoadFeatures=Array.isArray(t&&t.roads&&t.roads.features||[])?t.roads.features:[],this.roadSyntaxNodes=Array.isArray(t&&t.nodes&&t.nodes.features||[])?t.nodes.features:[],this.roadSyntaxDiagnostics=t&&t.diagnostics?t.diagnostics:null,this.roadSyntaxScatterPointsCache=this.normalizeRoadSyntaxScatterPoints(this.roadSyntaxDiagnostics&&this.roadSyntaxDiagnostics.intelligibility_scatter),this.roadSyntaxSummary=t&&t.summary?t.summary:null,this.roadSyntaxWebglPayload=t&&t.webgl&&typeof t.webgl=="object"?t.webgl:null,this.roadSyntaxWebglStatus=String(this.roadSyntaxWebglPayload&&this.roadSyntaxWebglPayload.status||""),this.roadSyntaxWebglRadiusFilterCache=null,this.roadSyntaxSkeletonOnly=!1,!this.roadSyntaxSummary)return;const n=this.roadSyntaxMetricTabs().map(u=>u.value).includes(e)?e:this.roadSyntaxDefaultMetric();this.roadSyntaxMetric=n,this.roadSyntaxLastMetricTab=n;const s=this.roadSyntaxRadiusOptions(),d=s.some(u=>String(u.value||"")==="global");this.roadSyntaxRadiusLabel=d?"global":String(s[0]&&s[0].value||"global")},buildRoadSyntaxCompletionStatus(t){if(!this.roadSyntaxSummary)return"完成：未返回有效汇总数据";const e=this.roadSyntaxSummary.analysis_engine||"depthmapxcli",a=`完成：${this.roadSyntaxSummary.node_count||0} 节点，${this.roadSyntaxSummary.edge_count||0} 边段（${e}`,i=Number(this.roadSyntaxSummary.control_valid_count||0),n=Number(this.roadSyntaxSummary.depth_valid_count||0),s=String(this.roadSyntaxSummary.control_source_column||""),d=String(this.roadSyntaxSummary.depth_source_column||"");let u="";(i<=0||n<=0)&&(u=`；control=${i}${s?`(${s})`:""}, depth=${n}${d?`(${d})`:""}`);const y=this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload);return(typeof this.roadSyntaxIsArcgisWebglActive=="function"?this.roadSyntaxIsArcgisWebglActive():y&&!!this.roadSyntaxWebglActive)?`${a}，ArcGIS-WebGL 已就绪${u}）`:y?`${a}，ArcGIS 数据已返回，但 WebGL 渲染未激活${u}）`:`${a}，ArcGIS-WebGL 未就绪（已禁用旧版回退${u}）`},async computeRoadSyntax(){if(!this.lastIsochroneGeoJSON||this.isComputingRoadSyntax)return;this.roadSyntaxMainTab!=="params"&&this.setRoadSyntaxMainTab("params",{refresh:!1,syncMetric:!1}),this.roadSyntaxStrictWebglOnly&&(this.roadSyntaxUseArcgisWebgl=!0),this.isComputingRoadSyntax=!0;const t=this.roadSyntaxGraphModelLabel();this.roadSyntaxSetStatus(`正在请求路网并计算路网指标（${t}）...`);const e=this.roadSyntaxRequestToken+1;this.roadSyntaxRequestToken=e;const a=this.roadSyntaxCreateRunId();this.roadSyntaxStartProgressTracking(a,e,`局部任务已启动（${t}），正在准备路网`);const i=this.roadSyntaxLastMetricTab||this.roadSyntaxMetric||this.roadSyntaxDefaultMetric();this.cancelRoadSyntaxRequest("start_new_compute");const n=new AbortController;this.roadSyntaxFetchAbortController=n;try{const s=this.getIsochronePolygonPayload();if(!s.length)throw new Error("等时圈范围无效");this.invalidateRoadSyntaxCache("recompute-road-syntax",{resetData:!1,resetPerf:!0}),this.roadSyntaxSummary=null,this.roadSyntaxRoadFeatures=[],this.roadSyntaxNodes=[],this.roadSyntaxDiagnostics=null,this.roadSyntaxLegendModel=null;const d=this.resolveRoadSyntaxEdgeCap(),u=this.buildRoadSyntaxRequestPayload(s,d,a),y=await this.fetchRoadSyntaxApi(u,{signal:n.signal});if(e!==this.roadSyntaxRequestToken)return;if(this.roadSyntaxRadiusLabel="global",this.applyRoadSyntaxResponseData(y,i),!(this.roadSyntaxUseArcgisWebgl&&typeof this.roadSyntaxCanUseArcgisWebglPayload=="function"&&this.roadSyntaxCanUseArcgisWebglPayload(this.roadSyntaxWebglPayload)))throw new Error(this.buildRoadSyntaxWebglUnavailableMessage(y));let S=!1;try{if(typeof this.renderRoadSyntaxArcgisWebgl!="function")throw new Error("ArcGIS-WebGL 渲染器不可用");S=await this.renderRoadSyntaxArcgisWebgl(this.roadSyntaxWebglPayload,{hideWhenSuspended:!0})}catch(m){console.warn("[road-syntax] arcgis webgl initial render failed",m),S=!1}if(!S){const m=String(this.roadSyntaxWebglStatus||"").trim();throw new Error(m?`ArcGIS-WebGL 渲染失败（已禁用旧版回退）: ${m}`:"ArcGIS-WebGL 渲染失败（已禁用旧版回退）")}this.roadSyntaxPoolReady=!0,this.roadSyntaxPoolDegraded=!1,this.roadSyntaxPoolInitRunning=!1,this.roadSyntaxPoolInitTotal=1,this.roadSyntaxPoolInitDone=1;const x=!0;this.roadSyntaxSummary&&(this.setRoadSyntaxMainTab(this.roadSyntaxLastMetricTab||this.roadSyntaxDefaultMetric(),{refresh:!1,syncMetric:!0}),this.activeStep3Panel==="syntax"?await this.renderRoadSyntaxByMetric(this.roadSyntaxLastMetricTab||this.roadSyntaxMetric||this.roadSyntaxDefaultMetric()):typeof this.suspendRoadSyntaxDisplay=="function"&&this.suspendRoadSyntaxDisplay()),this.roadSyntaxSetStatus(`局部（当前多边形）${this.buildRoadSyntaxCompletionStatus(x)}`),typeof this.saveAnalysisHistoryAsync=="function"&&this.saveAnalysisHistoryAsync(this.getIsochronePolygonPayload(),typeof this.buildSelectedCategoryBuckets=="function"?this.buildSelectedCategoryBuckets():[],this.allPoisDetails)}catch(s){if(e!==this.roadSyntaxRequestToken)return;if(s&&(s.name==="AbortError"||String(s.message||"").indexOf("aborted")>=0)){this.roadSyntaxSetStatus("已取消旧请求，正在使用最新参数计算...");return}console.error(s);const d=s&&s.message?s.message:String(s);if(typeof d=="string"&&(d.indexOf("Overpass query timeout/error")>=0||d.indexOf("Local Overpass request failed")>=0)){this.roadSyntaxSetStatus("失败: 路网抓取超时（Overpass 忙），请等几秒再试，或缩小等时圈范围后重试。");return}if(this.normalizeRoadSyntaxGraphModel()==="axial"){const y=String(d||"").trim();y.startsWith("轴线图计算失败")?this.roadSyntaxSetStatus(`失败: ${y}`):this.roadSyntaxSetStatus(`失败: 轴线图计算失败：${y||"请改用线段图或缩小范围后重试。"}`)}else this.roadSyntaxSetStatus("失败: "+d)}finally{this.roadSyntaxFetchAbortController===n&&(this.roadSyntaxFetchAbortController=null),this.isComputingRoadSyntax=!1,this.roadSyntaxStopProgressTracking()}},renderResult(t){if(!t||!t.geometry){this.errorMessage="未获取到有效数据";return}this.clearIsochroneDebugState(),this.lastIsochroneGeoJSON=t,this.applySimplifyConfig()}}});pe({app:tt,pinia:l,target:"#analysis-app-root"})}function me(){return ge()}function xe(){if(typeof window>"u"||window.__ANALYSIS_CANVAS_READBACK_PATCHED__)return;const r=window.HTMLCanvasElement&&window.HTMLCanvasElement.prototype;if(!r||typeof r.getContext!="function")return;const o=r.getContext;r.getContext=function(h,c){if(h==="2d"){const p=c&&typeof c=="object"?c:{};return o.call(this,h,{...p,willReadFrequently:!0})}return o.call(this,h,c)},window.__ANALYSIS_CANVAS_READBACK_PATCHED__=!0}async function be(r){xe(),await Xt();const o=document.getElementById("analysis-app-root");if(!o)throw new Error("analysis app root not found");if(window.__ANALYSIS_BOOTSTRAP__=r,!window.__ANALYSIS_APP_MOUNTED__){o.innerHTML=`<div class="analysis-layout-root">${ae}</div>`,me(),window.__ANALYSIS_APP_MOUNTED__=!0;return}window.location.reload()}const fe={class:"analysis-shell"},ve={key:0,class:"state state-overlay"},Me={key:1,class:"state state-error"},Re=Ut({__name:"App",setup(r){const o=ct(!0),l=ct("");return Kt(async()=>{try{const h=await fetch("/api/v1/config");if(!h.ok)throw new Error(`/api/v1/config 请求失败(${h.status})`);const c=await h.json();await be({config:{amap_js_api_key:String((c==null?void 0:c.amap_js_api_key)||""),amap_js_security_code:String((c==null?void 0:c.amap_js_security_code)||""),tianditu_key:String((c==null?void 0:c.tianditu_key)||"")},typeMapConfig:(c==null?void 0:c.map_type_config_json)||{groups:[]}})}catch(h){const c=h instanceof Error?h.message:String(h);l.value=`初始化失败：${c}`}finally{o.value=!1}}),(h,c)=>(at(),it("main",fe,[c[0]||(c[0]=Yt("div",{id:"analysis-app-root",class:"analysis-host"},null,-1)),o.value?(at(),it("div",ve,"正在初始化分析工作台...")):l.value?(at(),it("div",Me,Zt(l.value),1)):Qt("",!0)]))}}),Pe=(r,o)=>{const l=r.__vccOpts||r;for(const[h,c]of o)l[h]=c;return l},ke=Pe(Re,[["__scopeId","data-v-3a0acfa8"]]);ut(ke).mount("#app");
