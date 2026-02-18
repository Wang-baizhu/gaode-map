(function (window, MapUtils) {
    function MarkerManager(mapCore, config) {
        this.mapCore = mapCore;
        this.map = mapCore.map;
        this.mapData = (config && config.mapData) || {};
        this.mapTypeConfig = (config && config.mapTypeConfig) || {};

        this.centerPoint = this.mapData.center || { lng: 0, lat: 0, name: '中心点', type: 'center' };

        this.markers = [];
        this.markersByType = {};
        this.markersByPid = {};
        this.typeClusterers = {};
        this.clusterRenderers = {};
        this.pointsByType = {};
        this.pointsByPid = {};
        this.pointStateMap = {};
        this.typeLabelMap = {};
        this.markerClassMap = {};
        this.labelsVisible = false;
        this.activeTypes = new Set();
        this.existingTypes = new Set();
        this.lastVisibleMarkerPids = new Set();
        this.lastFilteredPoints = [];
        this.showMarkers = true;
        this.hideAllPoints = false;
        this.spatialFilter = null;

        this.onMarkerClick = null;
    }

    MarkerManager.prototype.init = function () {
        this.map = this.mapCore.map;
        this.collectExistingTypes();
        this.buildTypeLabelMap();
        this.ensureMarkerStylesFromConfig();
        this.buildMarkerClassMap();
        MapUtils.injectMarkerStyles(this.mapTypeConfig);
        this.preparePointsIndex();
    };

    MarkerManager.prototype.collectExistingTypes = function () {
        var self = this;
        this.existingTypes.clear();
        if (this.mapData.points && Array.isArray(this.mapData.points)) {
            this.mapData.points.forEach(function (p) {
                if (p && p.type) {
                    self.existingTypes.add(p.type);
                }
            });
        }
    };

    MarkerManager.prototype.buildTypeLabelMap = function () {
        var self = this;
        (this.mapTypeConfig.groups || []).forEach(function (group) {
            (group.items || []).forEach(function (item) {
                self.typeLabelMap[item.id] = item.label;
            });
        });
    };

    MarkerManager.prototype.ensureMarkerStylesFromConfig = function () {
        var styles = {};
        (this.mapTypeConfig.groups || []).forEach(function (group) {
            (group.items || []).forEach(function (item) {
                if (!item || !item.id) return;
                styles[item.id] = {
                    color: item.color || '#888',
                    match: item.id
                };
            });
        });
        styles.center = { color: '#ff4500', isCenter: true, match: 'center' };
        styles.default = { color: '#888', match: 'default' };
        this.mapTypeConfig.markerStyles = styles;
    };

    MarkerManager.prototype.buildMarkerClassMap = function () {
        var self = this;
        Object.keys(this.mapTypeConfig.markerStyles || {}).forEach(function (key) {
            var cfg = self.mapTypeConfig.markerStyles[key] || {};
            var typeName = cfg.match || key;
            self.markerClassMap[typeName] = 'marker-' + typeName;
        });
    };

    MarkerManager.prototype.preparePointsIndex = function () {
        var self = this;
        this.pointsByType = {};
        this.pointStateMap = {};
        this.pointsByPid = {};

        if (this.centerPoint) {
            this.centerPoint._pid = 'center';
            this.centerPoint.disabled = false;
            this.pointsByPid[this.centerPoint._pid] = this.centerPoint;
        }

        (this.mapData.points || []).forEach(function (point, idx) {
            if (!point) return;
            if (!point.type) point.type = 'default';
            point._pid = point._pid || ('p-' + idx);
            point.disabled = !!point.disabled;
            self.pointsByPid[point._pid] = point;
            self.pointStateMap[point._pid] = { disabled: point.disabled, type: point.type };
            self.pointsByType[point.type] = self.pointsByType[point.type] || [];
            self.pointsByType[point.type].push(point);
        });
    };

    MarkerManager.prototype.isPointEnabled = function (point) {
        if (!point) return false;
        if (point.type === 'center') return true;
        var state = this.pointStateMap[point._pid];
        return !(point.disabled || (state && state.disabled));
    };

    MarkerManager.prototype.setPointDisabled = function (pid, disabled) {
        var point = this.pointsByPid[pid];
        if (!point) return;
        point.disabled = disabled;
        this.pointStateMap[pid] = { disabled: disabled, type: point.type };
    };

    MarkerManager.prototype.setTypeEnabled = function (typeId, enabled) {
        var self = this;
        var list = this.pointsByType[typeId] || [];
        list.forEach(function (pt) {
            self.setPointDisabled(pt._pid, !enabled);
        });
    };

    MarkerManager.prototype.getPointsByType = function () {
        return this.pointsByType;
    };

    MarkerManager.prototype.getExistingTypes = function () {
        return this.existingTypes;
    };

    MarkerManager.prototype.getTypeLabel = function (typeId) {
        return this.typeLabelMap[typeId] || typeId;
    };

    MarkerManager.prototype.renderMarkers = function () {
        var self = this;
        this.destroyClusterers();
        this.markers.forEach(function (marker) {
            marker.setMap(null);
            marker.setLabel(null);
        });
        this.markers = [];
        this.markersByType = {};
        this.markersByPid = {};

        if (this.centerPoint) {
            this.addMarker(this.centerPoint);
        }
        if (this.mapData.points && Array.isArray(this.mapData.points)) {
            this.mapData.points.forEach(function (point) {
                self.addMarker(point);
            });
        }
    };

    MarkerManager.prototype.addMarker = function (point) {
        var self = this;
        var isCenter = point.type === 'center';
        var marker = new AMap.Marker({
            position: [point.lng, point.lat],
            title: point.name,
            map: isCenter ? this.map : null,
            content: '<div class="marker-dot ' + MapUtils.getMarkerClass(point.type, this.markerClassMap) + '"></div>',
            offset: new AMap.Pixel(-8, -8)
        });

        marker.__data = point;
        this.markersByPid[point._pid] = marker;
        this.setMarkerLabel(marker);

        marker.on('click', function () {
            self.openMarkerInfoWindow(marker);
            if (typeof self.onMarkerClick === 'function') {
                self.onMarkerClick(point._pid);
            }
        });

        this.markers.push(marker);
        if (!isCenter) {
            this.markersByType[point.type] = this.markersByType[point.type] || [];
            this.markersByType[point.type].push(marker);
        }
    };

    MarkerManager.prototype.setMarkerLabel = function (marker) {
        if (this.labelsVisible) {
            marker.setLabel({
                content: '<div class="marker-label">' + marker.__data.name + '</div>',
                offset: new AMap.Pixel(0, -30)
            });
        } else {
            marker.setLabel(null);
        }
    };

    MarkerManager.prototype.setLabelsVisible = function (visible) {
        this.labelsVisible = visible;
        var self = this;
        this.markers.forEach(function (marker) {
            if (marker.getMap()) {
                self.setMarkerLabel(marker);
            } else {
                marker.setLabel(null);
            }
        });
    };

    MarkerManager.prototype.toggleLabels = function () {
        this.setLabelsVisible(!this.labelsVisible);
        return this.labelsVisible;
    };

    MarkerManager.prototype.openMarkerInfoWindow = function (marker) {
        var point = marker.__data;
        var typeLabel = this.getTypeLabel(point.type);
        if (point.type === 'center') {
            typeLabel = '中心点';
        }
        var typeId = point.type || '';
        var typeLabelText = typeLabel || '';
        var nameText = point.name || '';
        var isTraffic = false;
        if (typeof typeId === 'string') {
            if (typeId.startsWith('15') || typeId.startsWith('type-15')) {
                isTraffic = true;
            }
        }
        if (!isTraffic && /交通|公交|地铁|车站|站|机场|港口|码头|出租|轻轨|轮渡|停车/.test(typeLabelText)) {
            isTraffic = true;
        }

        var isParking = false;
        if (typeof typeId === 'string' && (typeId === '150900' || typeId === 'type-150900' || typeId.indexOf('1509') !== -1)) {
            isParking = true;
        }
        if (!isParking && /停车/.test(typeLabelText + nameText)) {
            isParking = true;
        }

        var addressText = point.address || '';
        var lines = Array.isArray(point.lines) ? point.lines.slice() : [];
        if (isTraffic && !isParking && addressText) {
            if (!lines.length) {
                lines = [addressText];
            } else if (lines.indexOf(addressText) === -1) {
                lines.push(addressText);
            }
        }
        var showAddress = !isTraffic || isParking;
        var showLines = isTraffic && !isParking;
        var coordLng = typeof point.lng === 'number' ? point.lng : marker.getPosition().getLng();
        var coordLat = typeof point.lat === 'number' ? point.lat : marker.getPosition().getLat();
        var coordText = coordLng.toFixed(6) + ', ' + coordLat.toFixed(6);

        // Calculate distance if missing and center exists
        var distanceStr = point.distance;
        if ((!distanceStr || distanceStr === '—') && this.centerPoint && point.type !== 'center') {
            var p1 = new AMap.LngLat(this.centerPoint.lng, this.centerPoint.lat);
            var p2 = new AMap.LngLat(coordLng, coordLat);
            var dist = Math.round(p1.distance(p2));
            distanceStr = dist;
        }

        var infoContainer = document.createElement('div');
        infoContainer.style.padding = '10px';
        infoContainer.style.fontSize = '13px';
        infoContainer.style.minWidth = '200px';

        // 1. Name
        var nameEl = document.createElement('div');
        nameEl.style.fontWeight = 'bold';
        nameEl.style.fontSize = '14px';
        nameEl.style.marginBottom = '6px';
        nameEl.style.borderBottom = '1px solid #eee';
        nameEl.style.paddingBottom = '4px';
        nameEl.textContent = point.name;
        infoContainer.appendChild(nameEl);

        // 2. Type
        var typeEl = document.createElement('div');
        typeEl.style.marginBottom = '4px';
        typeEl.innerHTML = '<span style="color:#888;">类型：</span>' + typeLabel;
        infoContainer.appendChild(typeEl);

        // 3. Address
        // 地址/途经线路统一放在最后

        // 4. Coordinates
        var coordEl = document.createElement('div');
        coordEl.style.marginBottom = '4px';
        coordEl.innerHTML = '<span style="color:#888;">坐标：</span>' + coordText;
        infoContainer.appendChild(coordEl);

        // 5. Distance (for non-center)
        if (point.type !== 'center') {
            var distEl = document.createElement('div');
            distEl.style.marginBottom = '4px';
            var distVal = (distanceStr && distanceStr !== '—') ? distanceStr + ' 米' : '—';
            distEl.innerHTML = '<span style="color:#888;">距离中心：</span>' + distVal;
            infoContainer.appendChild(distEl);
        }

        // Lines (Traffic)
        if (showAddress && addressText) {
            var addressEl = document.createElement('div');
            addressEl.style.marginBottom = '4px';
            addressEl.style.color = '#666';
            addressEl.innerHTML = '<span style="color:#666;">地址：</span>' + addressText;
            infoContainer.appendChild(addressEl);
        }

        if (showLines && lines && lines.length > 0) {
            var linesEl = document.createElement('div');
            linesEl.style.marginBottom = '4px';
            linesEl.style.color = '#666';
            linesEl.innerHTML = '<span style="color:#666;">途经线路：</span>' + lines.join('，');
            infoContainer.appendChild(linesEl);
        } else {
            // DEBUG: Temporary check why lines are missing
            // var debugEl = document.createElement('div');
            // debugEl.style.color = 'red';
            // debugEl.textContent = 'Db: L=' + (point.lines ? point.lines.length : 'N') + ' A=' + (point.address || 'N');
            // infoContainer.appendChild(debugEl);
        }


        var infoWindow = new AMap.InfoWindow({
            content: infoContainer,
            offset: new AMap.Pixel(0, -30)
        });
        infoWindow.open(this.map, marker.getPosition());
    };

    MarkerManager.prototype.focusMarkerOnMap = function (pid, openInfo) {
        var marker = this.markersByPid[pid];
        if (!marker) return;
        if (!marker.getMap()) {
            marker.setMap(this.map);
        }
        this.map.setCenter(marker.getPosition());
        if (this.map.getZoom && this.map.getZoom() < 15) {
            this.map.setZoom(15);
        }
        if (openInfo) {
            this.openMarkerInfoWindow(marker);
        }
    };

    MarkerManager.prototype.destroyClusterers = function () {
        Object.keys(this.typeClusterers).forEach(function (key) {
            var clusterer = this.typeClusterers[key];
            if (clusterer && typeof clusterer.setMap === 'function') {
                clusterer.setMap(null);
            }
        }, this);
        this.typeClusterers = {};
    };

    MarkerManager.prototype.createClusterRenderer = function (type) {
        var color = MapUtils.getTypeColor(type, this.mapTypeConfig);
        return function (context) {
            var count = context.count;
            var size = Math.max(32, Math.min(50, 18 + count));
            var div = document.createElement('div');
            div.style.width = size + 'px';
            div.style.height = size + 'px';
            div.style.background = color;
            div.style.borderRadius = '50%';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.color = '#fff';
            div.style.fontSize = '13px';
            div.style.fontWeight = 'bold';
            div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
            div.style.border = '2px solid #fff';
            div.textContent = count;
            context.marker.setContent(div);
            context.marker.setOffset(new AMap.Pixel(-size / 2, -size / 2));
        };
    };

    MarkerManager.prototype.getClusterRenderer = function (type) {
        if (!this.clusterRenderers[type]) {
            this.clusterRenderers[type] = this.createClusterRenderer(type);
        }
        return this.clusterRenderers[type];
    };

    MarkerManager.prototype.setActiveTypes = function (activeTypes) {
        this.activeTypes = new Set(activeTypes);
    };

    MarkerManager.prototype.setShowMarkers = function (show) {
        this.showMarkers = !!show;
    };

    MarkerManager.prototype.setHideAllPoints = function (hide) {
        this.hideAllPoints = !!hide;
    };

    MarkerManager.prototype.setSpatialFilter = function (filterFn) {
        this.spatialFilter = typeof filterFn === 'function' ? filterFn : null;
    };

    MarkerManager.prototype.getVisiblePointsData = function (count) {
        var heatCount = typeof count === 'number' ? count : 10;
        return (this.lastFilteredPoints || []).map(function (pt) {
            return { lng: pt.lng, lat: pt.lat, count: heatCount };
        });
    };

    MarkerManager.prototype.getVisiblePoints = function () {
        return (this.lastFilteredPoints || []).slice();
    };

    MarkerManager.prototype.applyFilters = function () {
        var self = this;
        var needCluster = this.showMarkers;
        if (needCluster && !this.mapCore.clusterPluginReady) {
            this.mapCore.loadPlugins().then(function () {
                self.applyFilters();
            });
            return;
        }

        this.destroyClusterers();
        this.lastVisibleMarkerPids.clear();
        this.lastFilteredPoints = [];
        this.markersByType = {};

        this.markers.forEach(function (marker) {
            var point = marker.__data;
            if (!point) return;

            var isActiveType = point.type === 'center' || self.activeTypes.has(point.type);
            var isEnabled = self.isPointEnabled(point);
            var withinRadius = true;
            if (self.mapCore.mapMode === 'around' && self.mapCore.currentRadius && point.type !== 'center') {
                withinRadius = MapUtils.isWithinRadius(point, self.mapCore.center, self.mapCore.currentRadius);
            }
            var withinPolygon = true;
            if (self.spatialFilter) {
                withinPolygon = self.spatialFilter(point);
            }

            var isVisible = isActiveType && isEnabled && withinRadius && withinPolygon;

            if (isVisible) {
                self.lastVisibleMarkerPids.add(point._pid);
                if (point.type !== 'center') {
                    self.lastFilteredPoints.push(point);
                }
            }

            // Optimization: Only call setMap when state changes or for center point
            if (point.type === 'center') {
                if (!self.hideAllPoints && isVisible && !marker.getMap()) {
                    marker.setMap(self.map);
                    self.setMarkerLabel(marker);
                } else if ((self.hideAllPoints || !isVisible) && marker.getMap()) {
                    marker.setMap(null);
                    marker.setLabel(null);
                }
                return;
            }

            // For POI markers, if not visible, ensure they are off the map.
            // If visible, DON'T call setMap(map) here, let MarkerClusterer handle it.
            if (!isVisible || !self.showMarkers || self.hideAllPoints) {
                if (marker.getMap()) {
                    marker.setMap(null);
                }
                marker.setLabel(null);
            } else {
                // Marker is visible and we want to show markers, it will be added to buckets
                var list = self.markersByType[point.type] || [];
                list.push(marker);
                self.markersByType[point.type] = list;
            }
        });

        if (!this.showMarkers) {
            this.mapCore.updateCityCirclesVisibility(this.lastVisibleMarkerPids);
            return;
        }

        var clusterMaxZoom = 17;
        if (this.map.getMaxZoom) {
            clusterMaxZoom = Math.max(3, this.map.getMaxZoom() - 1);
        }

        Object.keys(self.markersByType).forEach(function (typeKey) {
            var list = self.markersByType[typeKey];
            var clusterer = self.typeClusterers[typeKey];

            if (clusterer) {
                clusterer.setMarkers(list);
            } else {
                self.typeClusterers[typeKey] = new AMap.MarkerClusterer(self.map, list, {
                    gridSize: 80,
                    maxZoom: clusterMaxZoom,
                    minClusterSize: 2,
                    renderClusterMarker: self.getClusterRenderer(typeKey)
                });
            }
        });

        // Clear clusterers for types that are no longer active or have no points
        Object.keys(this.typeClusterers).forEach(function (typeKey) {
            if (!self.markersByType[typeKey] || self.markersByType[typeKey].length === 0) {
                var c = self.typeClusterers[typeKey];
                if (c) {
                    c.clearMarkers();
                    c.setMap(null);
                    delete self.typeClusterers[typeKey];
                }
            }
        });

        this.mapCore.updateCityCirclesVisibility(this.lastVisibleMarkerPids);
    };

    MarkerManager.prototype.getVisibleMarkers = function () {
        return this.markers.filter(function (marker) {
            return marker && marker.getMap();
        });
    };

    MarkerManager.prototype.computeTypeCounts = function () {
        var counts = {};
        Object.keys(this.pointsByType || {}).forEach(function (typeKey) {
            if (typeKey === 'center') return;
            counts[typeKey] = (this.pointsByType[typeKey] || []).length;
        }, this);
        return counts;
    };

    MarkerManager.prototype.getTypeCounts = function () {
        return this.computeTypeCounts();
    };

    MarkerManager.prototype.setMarkerClickHandler = function (handler) {
        this.onMarkerClick = handler;
    };

    window.MarkerManager = MarkerManager;
})(window, window.MapUtils);
