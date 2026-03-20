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

### 3.4 Docker 开发模式
```bash
cd /mnt/d/Coding/map_analyse/gaode-map
docker compose up --build
```
- 会启动后端热更新容器和 `frontend-builder` 监听构建服务
- `frontend-builder` 会把 Vite 产物持续写入 `static/frontend/`
- `app` 会等待 `static/frontend/index.html` 出现后再启动
- `static/frontend/` 是部署产物，继续保持 `.gitignore`

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
- 人口分析：`POPULATION_DATA_DIR`、`POPULATION_PREVIEW_MAX_SIZE`
- 数据库：`DB_URL`（可选；未配置时走 SQLite）
- 图表输出目录覆盖：`CHART_OUTPUT_DIR`（可选，默认 `runtime/generated_charts/`）

### 人口数据目录
- Docker 启动时，默认把宿主机 `E:/PeopleData` 挂到容器内 `/mapdata/population`
- 可通过 `POPULATION_DATA_HOST_DIR` 覆盖宿主机目录
- 容器内应用读取目录由 `POPULATION_DATA_DIR` 控制，默认 `/mapdata/population`

## 7. 测试与仓库卫生
```bash
cd /mnt/d/Coding/map_analyse/gaode-map
uv run pytest -q
bash scripts/check_repo_hygiene.sh
```

## 8. Docker
```bash
cd /mnt/d/Coding/map_analyse/gaode-map
docker compose -f docker-compose.prod.yml up -d --build
```
- 生产镜像会在 Docker 多阶段构建中自动执行前端 `npm ci` 和 `npm run build`
- 运行容器直接加载镜像内的 `static/frontend/`，不依赖宿主机预先打包

### 8.1 构建产物约定
- `frontend/` 存放 Vue + Vite 源码
- `static/frontend/` 存放部署产物，由 Vite 输出
- 部署产物不应提交到仓库；本地缺失时可通过 `npm run build` 或 Docker 构建重新生成
