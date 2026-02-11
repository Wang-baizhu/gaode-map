### 说明
- fastapi开发的高德/本地map后端 + 使用html原生jinjia2模板开发的高德地图
- 请确保安装核心依赖: `pip install -r requirements.txt` (包含 `h3` 网格计算库)

### 📚 接口文档 (API Reference)

本项目提供 REST API，主要分为分析、地图管理和后台管理三类。

#### 1. 核心分析 API
| 方法 | 路径 | 描述 | 参数示例 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/analysis/pois` | **抓取 POI 数据**<br>根据多边形范围抓取高德 POI | `{ "polygon": [[120,30]...], "keywords": "咖啡", "types": "050000" }` |
| `POST` | `/api/v1/analysis/isochrone` | **生成等时圈**<br>计算如“15分钟步行范围”的多边形 | `{ "lat": 30.1, "lon": 120.2, "time_min": 15, "mode": "walking" }` |
| `POST` | `/api/v1/analysis/h3-grid` | **生成 H3 网络**<br>将等时圈 polygon 转换为可渲染网格 GeoJSON | `{ "polygon": [[120,30]...], "resolution": 10, "coord_type": "gcj02", "include_mode": "intersects", "min_overlap_ratio": 0.15 }` |
| `POST` | `/api/v1/analysis/h3-metrics` | **计算 H3 网格分析**<br>对 POI 做网格聚合并返回密度/熵/邻域指标与图表数据 | `{ "polygon": [[120,30]...], "resolution": 10, "pois": [...], "neighbor_ring": 1 }` |
| `GET` | `/api/v1/analysis/history` | **获取分析历史**<br>查看之前的抓取记录 | `?limit=20` |

#### 2. 地图管理 API
| 方法 | 路径 | 描述 | 参数示例 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/generate-map` | **生成地图数据**<br>抓取并缓存基础地图数据 | `{ "place": "西湖区", "type": "city" }` |
| `GET` | `/api/v1/config` | **获取前端配置**<br>获取 API Key 等公开配置 | 无 |

#### 3. 后台管理 API
| 方法 | 路径 | 描述 | 权限 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/maps` | **地图列表**<br>查看所有缓存的地图数据 | Admin |
| `DELETE` | `/api/v1/admin/maps/{id}` | **删除地图**<br>清理过期的地图缓存 | Admin |

更多接口详情，启动服务后访问在线文档：
`http://localhost:8000/docs`

### ✅ 测试入口
- 当前主要的测试/演示流程集中在 **工作台页面**：`/analysis`
- 地图生成与展示仍可通过 `/map` 相关接口/页面验证

### 数据库
- 支持 **SQLite** (默认, 本地开发) 和 **MySQL** (生产环境, 推荐)。
- 详见 `DEPLOY_MYSQL.md` 配置指南。
