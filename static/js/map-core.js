(function (window, MapUtils) {
    function MapCore(containerId, config) {
        this.containerId = containerId;
        this.config = config || {};
        this.center = this.config.center || (this.config.mapData && this.config.mapData.center) || { lng: 0, lat: 0 };
        this.zoom = this.config.zoom || 13;
        this.zooms = this.config.zooms || [3, 20];
        this.mapData = this.config.mapData || {};
        this.mapMode = (new URLSearchParams(window.location.search).get('type') || 'around').toLowerCase();
        this.currentRadius = typeof this.mapData.radius === 'number'
            ? this.mapData.radius
            : (typeof this.config.radius === 'number' ? this.config.radius : null);

        this.map = null;
        this.mainCircle = null;
        this.cityCircles = [];
        this.cityCircleMap = {};
        this.boundaryPolygons = [];
        this.customPolygons = [];
        this.gridPolygons = [];
        this.gridPolygonMap = {};
        this.focusedGridPolygon = null;
        this._gridFocusAnimTimer = null;
        this._gridFocusViewBeforeLock = null;

        this.clusterPluginReady = false;
        this.heatmapPluginReady = false;
        this._pluginPromise = null;
    }

    MapCore.prototype.initMap = function () {
        this.map = new AMap.Map(this.containerId, {
            zoom: this.zoom,
            zooms: this.zooms,
            center: [this.center.lng, this.center.lat]
        });

        this.updateMainCircle(this.currentRadius);
        this.rebuildCityCircles(this.currentRadius);

        if (this.mapMode === 'city') {
            var cityBoundaryId = this.mapData.adcode || (this.center && this.center.adcode) || (this.center && this.center.name);
            this.drawCityBoundary(cityBoundaryId);
        }
    };

    MapCore.prototype.loadPlugins = function () {
        var self = this;
        if (this._pluginPromise) return this._pluginPromise;

        this._pluginPromise = new Promise(function (resolve) {
            AMap.plugin(['AMap.MarkerClusterer', 'AMap.Heatmap'], function () {
                self.clusterPluginReady = true;
                self.heatmapPluginReady = true;
                resolve();
            });
        });

        return this._pluginPromise;
    };

    MapCore.prototype.setRadius = function (radius) {
        this.currentRadius = radius;
        this.updateMainCircle(radius);
        this.rebuildCityCircles(radius);
    };

    MapCore.prototype.updateMainCircle = function (radius) {
        if (this.mainCircle) {
            this.mainCircle.setMap(null);
        }
        if (!radius) {
            this.mainCircle = null;
            return;
        }
        this.mainCircle = new AMap.Circle({
            center: [this.center.lng, this.center.lat],
            radius: radius,
            strokeColor: "#FF0000",
            strokeWeight: 3,
            fillColor: "#FF0000",
            fillOpacity: 0.1
        });
        this.map.add(this.mainCircle);
    };

    MapCore.prototype.rebuildCityCircles = function (radius) {
        var self = this;
        Object.keys(this.cityCircleMap).forEach(function (pid) {
            var circle = self.cityCircleMap[pid];
            if (!circle) return;
            circle.setMap(null);
            if (radius) {
                circle.setRadius(radius);
            }
        });
        this.cityCircles = [];
        if (this.mapMode !== 'city' || !radius) return;

        (this.mapData.points || []).forEach(function (point, idx) {
            var pid = point._pid || ('city-' + idx);
            point._pid = pid;
            var circle = self.cityCircleMap[pid];
            if (!circle) {
                circle = new AMap.Circle({
                    center: [point.lng, point.lat],
                    radius: radius,
                    strokeColor: "#009688",
                    strokeWeight: 2,
                    fillColor: "#009688",
                    fillOpacity: 0.06
                });
                self.cityCircleMap[pid] = circle;
            } else {
                circle.setRadius(radius);
            }
            self.cityCircles.push(circle);
        });
    };

    MapCore.prototype.updateCityCirclesVisibility = function (visiblePidSet) {
        var self = this;
        if (this.mapMode !== 'city') return;
        if (!this.currentRadius) {
            Object.keys(this.cityCircleMap).forEach(function (pid) {
                var circle = self.cityCircleMap[pid];
                if (circle) {
                    circle.setMap(null);
                }
            });
            this.cityCircles = [];
            return;
        }
        this.cityCircles = [];
        Object.keys(this.cityCircleMap).forEach(function (pid) {
            var circle = self.cityCircleMap[pid];
            if (!circle) return;
            if (visiblePidSet && visiblePidSet.has(pid)) {
                circle.setMap(self.map);
                self.cityCircles.push(circle);
            } else {
                circle.setMap(null);
            }
        });
    };

    MapCore.prototype.clearBoundaryPolygons = function () {
        this.boundaryPolygons.forEach(function (polygon) { polygon.setMap(null); });
        this.boundaryPolygons = [];
    };

    MapCore.prototype.clearCustomPolygons = function () {
        this.customPolygons.forEach(function (polygon) { polygon.setMap(null); });
        this.customPolygons = [];
    };

    MapCore.prototype.clearGridPolygons = function () {
        if (this._gridFocusAnimTimer) {
            window.clearInterval(this._gridFocusAnimTimer);
            this._gridFocusAnimTimer = null;
        }
        this.gridPolygons.forEach(function (polygon) { polygon.setMap(null); });
        this.gridPolygons = [];
        this.gridPolygonMap = {};
        this.focusedGridPolygon = null;
        this._gridFocusViewBeforeLock = null;
    };

    MapCore.prototype.setCustomPolygons = function (pathsList) {
        var self = this;
        this.clearCustomPolygons();
        (pathsList || []).forEach(function (path) {
            if (!path || !path.length) return;
            var polygon = new AMap.Polygon({
                path: path,
                strokeColor: '#ff6f00',
                strokeWeight: 2,
                strokeOpacity: 0.9,
                fillColor: '#ff6f00',
                fillOpacity: 0.08,
                clickable: false,
                bubble: true
            });
            polygon.setMap(self.map);
            self.customPolygons.push(polygon);
        });
        this.updateFitView();
    };

    MapCore.prototype.setGridFeatures = function (features, style) {
        var self = this;
        var cfg = style || {};
        var strokeColor = cfg.strokeColor || '#1e88e5';
        var strokeWeight = typeof cfg.strokeWeight === 'number' ? cfg.strokeWeight : 2;
        var fillColor = cfg.fillColor || '#42a5f5';
        var fillOpacity = typeof cfg.fillOpacity === 'number' ? cfg.fillOpacity : 0.12;

        this.clearGridPolygons();
        (features || []).forEach(function (feature) {
            if (!feature || !feature.geometry || feature.geometry.type !== 'Polygon') return;
            var rings = feature.geometry.coordinates || [];
            var path = rings[0];
            if (!Array.isArray(path) || path.length < 3) return;
            var props = feature.properties || {};
            var currentStrokeColor = props.strokeColor || strokeColor;
            var currentStrokeWeight = typeof props.strokeWeight === 'number' ? props.strokeWeight : strokeWeight;
            var currentFillColor = props.fillColor || fillColor;
            var currentFillOpacity = typeof props.fillOpacity === 'number' ? props.fillOpacity : fillOpacity;

            var polygon = new AMap.Polygon({
                path: path,
                strokeColor: currentStrokeColor,
                strokeWeight: currentStrokeWeight,
                strokeOpacity: 0.85,
                fillColor: currentFillColor,
                fillOpacity: currentFillOpacity,
                zIndex: 80,
                clickable: false,
                bubble: true
            });
            polygon.__baseStyle = {
                strokeColor: currentStrokeColor,
                strokeWeight: currentStrokeWeight,
                fillColor: currentFillColor,
                fillOpacity: currentFillOpacity,
                zIndex: 80,
            };
            polygon.__h3Id = props.h3_id || null;
            polygon.setMap(self.map);
            self.gridPolygons.push(polygon);
            if (polygon.__h3Id) {
                self.gridPolygonMap[polygon.__h3Id] = polygon;
            }
        });

        this.updateFitView();
    };

    MapCore.prototype._restoreGridPolygonStyle = function (polygon) {
        if (!polygon || !polygon.__baseStyle) return;
        polygon.setOptions({
            strokeColor: polygon.__baseStyle.strokeColor,
            strokeWeight: polygon.__baseStyle.strokeWeight,
            fillColor: polygon.__baseStyle.fillColor,
            fillOpacity: polygon.__baseStyle.fillOpacity,
            zIndex: polygon.__baseStyle.zIndex
        });
    };

    MapCore.prototype._stopGridFocusAnimation = function () {
        if (this._gridFocusAnimTimer) {
            window.clearInterval(this._gridFocusAnimTimer);
            this._gridFocusAnimTimer = null;
        }
    };

    MapCore.prototype._mixHexColor = function (fromHex, toHex, t) {
        var f = String(fromHex || '#22d3ee').replace('#', '');
        var to = String(toHex || '#ffffff').replace('#', '');
        if (f.length !== 6 || to.length !== 6) return fromHex || '#22d3ee';
        var clampT = Math.max(0, Math.min(1, t || 0));
        var fr = parseInt(f.substring(0, 2), 16);
        var fg = parseInt(f.substring(2, 4), 16);
        var fb = parseInt(f.substring(4, 6), 16);
        var tr = parseInt(to.substring(0, 2), 16);
        var tg = parseInt(to.substring(2, 4), 16);
        var tb = parseInt(to.substring(4, 6), 16);
        var rr = Math.round(fr + (tr - fr) * clampT);
        var rg = Math.round(fg + (tg - fg) * clampT);
        var rb = Math.round(fb + (tb - fb) * clampT);
        var hex = '#' + [rr, rg, rb].map(function (v) {
            var s = v.toString(16);
            return s.length === 1 ? '0' + s : s;
        }).join('');
        return hex;
    };

    MapCore.prototype._runGridFocusPulse = function (polygon, cfg) {
        this._stopGridFocusAnimation();
        if (!polygon) return;
        var baseStroke = cfg.strokeColor || '#22d3ee';
        var glowStroke = cfg.pulseColor || '#ecfeff';
        var baseWeight = typeof cfg.strokeWeight === 'number' ? cfg.strokeWeight : 3;
        var baseOpacity = typeof cfg.fillOpacity === 'number' ? cfg.fillOpacity : 0.42;
        var zIndex = typeof cfg.zIndex === 'number' ? cfg.zIndex : 120;
        var durationMs = typeof cfg.durationMs === 'number' ? cfg.durationMs : 1200;
        var cycles = typeof cfg.cycles === 'number' ? cfg.cycles : 2;
        var startAt = Date.now();
        var totalMs = Math.max(300, durationMs * Math.max(1, cycles));
        var self = this;
        this._gridFocusAnimTimer = window.setInterval(function () {
            var elapsed = Date.now() - startAt;
            var phase = ((elapsed % durationMs) / durationMs);
            var energy = 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI); // smooth breathe
            var strokeColor = self._mixHexColor(baseStroke, glowStroke, energy * 0.7);
            var strokeWeight = baseWeight + energy * 1.8;
            var fillOpacity = Math.min(0.86, baseOpacity + energy * 0.16);
            polygon.setOptions({
                strokeColor: strokeColor,
                strokeWeight: strokeWeight,
                fillOpacity: fillOpacity,
                zIndex: zIndex
            });
            if (elapsed >= totalMs) {
                self._stopGridFocusAnimation();
                polygon.setOptions({
                    strokeColor: baseStroke,
                    strokeWeight: baseWeight,
                    fillOpacity: baseOpacity,
                    zIndex: zIndex
                });
            }
        }, 130);
    };

    MapCore.prototype.focusGridCellById = function (h3Id, opts) {
        if (!h3Id || !this.gridPolygonMap) return false;
        var polygon = this.gridPolygonMap[h3Id];
        if (!polygon) return false;

        if (this.focusedGridPolygon && this.focusedGridPolygon !== polygon) {
            this._restoreGridPolygonStyle(this.focusedGridPolygon);
        }

        var cfg = opts || {};
        var highlightStroke = cfg.strokeColor || '#22d3ee';
        var highlightWeight = typeof cfg.strokeWeight === 'number' ? cfg.strokeWeight : 4;
        var highlightOpacity = typeof cfg.fillOpacity === 'number'
            ? cfg.fillOpacity
            : Math.min(0.72, Math.max(0.28, (polygon.__baseStyle && polygon.__baseStyle.fillOpacity || 0.2) + 0.2));
        var highlightZ = typeof cfg.zIndex === 'number' ? cfg.zIndex : 130;

        if (this.map && cfg.rememberView !== false) {
            var center = this.map.getCenter ? this.map.getCenter() : null;
            var zoom = this.map.getZoom ? this.map.getZoom() : null;
            if (center && center.getLng && center.getLat && typeof zoom === 'number') {
                this._gridFocusViewBeforeLock = {
                    center: [center.getLng(), center.getLat()],
                    zoom: zoom
                };
            }
        }

        polygon.setOptions({
            strokeColor: highlightStroke,
            strokeWeight: highlightWeight,
            fillOpacity: highlightOpacity,
            zIndex: highlightZ
        });
        this.focusedGridPolygon = polygon;

        if (this.map) {
            if (cfg.fitView) {
                // Fit only this polygon; avoid mixing in all overlays.
                this.map.setFitView([polygon]);
                var zoomMin = typeof cfg.zoomMin === 'number' ? cfg.zoomMin : 16;
                if (this.map.getZoom && this.map.setZoom) {
                    var currentZoom = this.map.getZoom();
                    if (currentZoom < zoomMin) this.map.setZoom(zoomMin);
                }
            } else if (cfg.panTo !== false && polygon.getBounds) {
                var bounds = polygon.getBounds();
                if (bounds && bounds.getCenter) {
                    this.map.panTo(bounds.getCenter());
                }
            }
        }
        if (cfg.animate !== false) {
            this._runGridFocusPulse(polygon, {
                strokeColor: highlightStroke,
                strokeWeight: highlightWeight,
                fillOpacity: highlightOpacity,
                zIndex: highlightZ,
                pulseColor: cfg.pulseColor || '#ecfeff'
            });
        } else {
            this._stopGridFocusAnimation();
        }
        return true;
    };

    MapCore.prototype.clearGridFocus = function (opts) {
        var cfg = opts || {};
        this._stopGridFocusAnimation();
        if (this.focusedGridPolygon) {
            this._restoreGridPolygonStyle(this.focusedGridPolygon);
        }
        this.focusedGridPolygon = null;
        if (cfg.restoreView && this.map && this._gridFocusViewBeforeLock && Array.isArray(this._gridFocusViewBeforeLock.center)) {
            var restoreCenter = this._gridFocusViewBeforeLock.center;
            var restoreZoom = this._gridFocusViewBeforeLock.zoom;
            if (this.map.setZoomAndCenter && typeof restoreZoom === 'number') {
                this.map.setZoomAndCenter(restoreZoom, restoreCenter);
            } else {
                if (this.map.setCenter) this.map.setCenter(restoreCenter);
                if (this.map.setZoom && typeof restoreZoom === 'number') this.map.setZoom(restoreZoom);
            }
        }
        this._gridFocusViewBeforeLock = null;
    };

    MapCore.prototype.drawCityBoundary = function (cityCodeOrName) {
        var self = this;
        if (this.mapMode !== 'city' || !cityCodeOrName) return;
        this.clearBoundaryPolygons();

        AMap.plugin('AMap.DistrictSearch', function () {
            var ds = new AMap.DistrictSearch({
                level: 'city',
                extensions: 'all',
                subdistrict: 0
            });

            ds.search(cityCodeOrName, function (status, result) {
                if (status !== 'complete') return;
                var list = result.districtList || [];
                if (!list.length) return;

                var boundaries = list[0].boundaries || [];
                boundaries.forEach(function (path) {
                    var polygon = new AMap.Polygon({
                        path: path,
                        strokeColor: '#00bcd4',
                        strokeWeight: 2,
                        strokeOpacity: 0.9,
                        fillColor: '#00bcd4',
                        fillOpacity: 0.05
                    });
                    polygon.setMap(self.map);
                    self.boundaryPolygons.push(polygon);
                });

                self.updateFitView();
            });
        });
    };

    MapCore.prototype.updateFitView = function (overlays) {
        if (!this.map) return;
        var objects = overlays ? overlays.slice() : [];

        if (this.mainCircle) {
            objects.push(this.mainCircle);
        }
        if (this.mapMode === 'city') {
            this.cityCircles.forEach(function (circle) {
                if (circle && circle.getMap()) {
                    objects.push(circle);
                }
            });
        }
        this.boundaryPolygons.forEach(function (polygon) {
            if (polygon && polygon.getMap) {
                objects.push(polygon);
            }
        });
        this.customPolygons.forEach(function (polygon) {
            if (polygon && polygon.getMap) {
                objects.push(polygon);
            }
        });
        this.gridPolygons.forEach(function (polygon) {
            if (polygon && polygon.getMap) {
                objects.push(polygon);
            }
        });

        if (objects.length) {
            this.map.setFitView(objects);
        } else {
            this.map.setFitView();
        }
    };

    window.MapCore = MapCore;
})(window, window.MapUtils);
