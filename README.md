# gaode-map

## 1. 当前状态
- 后端：FastAPI（`main.py`）
- 前端：Vue 3 + Vite（`frontend/`）
- Analysis 主链路：`/analysis`（返回 `static/frontend/index.html`）
- Legacy：`/analysis-legacy` 已下线
- 运行时图表产物目录：`runtime/generated_charts/`

## 2. 目录（核心）
- `core/`：配置、异常、通用模型
- `router/`：HTTP 路由聚合（按 domain 拆分）
- `modules/`：业务域实现（`poi`/`h3`/`road`/`isochrone`/`export`/`providers`）
- `store/`：数据库与仓储
- `frontend/`：前端源码（Vite 构建）
- `static/frontend/`：前端构建产物（由 Vite 输出）
- `runtime/`：运行时数据（图表、临时文件）
- `scripts/check_repo_hygiene.sh`：仓库卫生检查
- `tests/`：`api` / `domain` / `integration` / `e2e`

## 3. 本地启动

### 3.1 后端依赖
```bash
cd /mnt/d/Coding/map_analyse/gaode-map
uv sync
# 或: pip install -r requirements.txt
```

### 3.2 前端构建
```bash
cd /mnt/d/Coding/map_analyse/gaode-map/frontend
npm install
npm run build
```

### 3.3 启动服务
```bash
cd /mnt/d/Coding/map_analyse/gaode-map
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 4. 访问入口
- `http://localhost:8000/analysis`：分析工作台
- `http://localhost:8000/map?...`：常规地图页
- `http://localhost:8000/docs`：OpenAPI 文档
- `http://localhost:8000/health`：健康检查

## 5. 主要接口（分析链路）
- `GET /api/v1/config`
- `POST /api/v1/analysis/isochrone`
- `POST /api/v1/analysis/pois`
- `POST /api/v1/analysis/h3-grid`
- `POST /api/v1/analysis/h3-metrics`
- `POST /api/v1/analysis/road-syntax`
- `GET /api/v1/analysis/road-syntax/progress`
- `POST /api/v1/analysis/export/bundle`
- `GET /api/v1/analysis/history`
- `GET /api/v1/analysis/history/{id}`

## 6. 关键环境变量
- 地图：`AMAP_WEB_SERVICE_KEY`、`AMAP_JS_API_KEY`、`AMAP_JS_SECURITY_CODE`、`TIANDITU_KEY`
- 路网/等时圈：`DEPTHMAPX_CLI_PATH`、`OVERPASS_ENDPOINT`、`VALHALLA_BASE_URL`
- 数据库：`DB_URL`（可选；未配置时走 SQLite）
- 图表输出目录覆盖：`CHART_OUTPUT_DIR`（可选，默认 `runtime/generated_charts/`）

## 7. 测试与仓库卫生
```bash
cd /mnt/d/Coding/map_analyse/gaode-map
uv run pytest -q
bash scripts/check_repo_hygiene.sh
```

## 8. Docker
```bash
cd /mnt/d/Coding/map_analyse/gaode-map
docker compose up -d --build
```
