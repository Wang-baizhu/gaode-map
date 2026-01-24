(function(window, MapUtils) {
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
      this.labelsVisible = true;
      this.activeTypes = new Set();
      this.existingTypes = new Set();
      this.lastVisibleMarkerPids = new Set();
      this.lastFilteredPoints = [];
      this.showMarkers = true;
      this.spatialFilter = null;

      this.onMarkerClick = null;
  }

  MarkerManager.prototype.init = function() {
      this.map = this.mapCore.map;
      this.collectExistingTypes();
      this.buildTypeLabelMap();
      this.ensureMarkerStylesFromConfig();
      this.buildMarkerClassMap();
      MapUtils.injectMarkerStyles(this.mapTypeConfig);
      this.preparePointsIndex();
  };

  MarkerManager.prototype.collectExistingTypes = function() {
      var self = this;
      this.existingTypes.clear();
      if (this.mapData.points && Array.isArray(this.mapData.points)) {
          this.mapData.points.forEach(function(p) {
              if (p && p.type) {
                  self.existingTypes.add(p.type);
              }
          });
      }
  };

  MarkerManager.prototype.buildTypeLabelMap = function() {
      var self = this;
      (this.mapTypeConfig.groups || []).forEach(function(group) {
          (group.items || []).forEach(function(item) {
              self.typeLabelMap[item.id] = item.label;
          });
      });
  };

  MarkerManager.prototype.ensureMarkerStylesFromConfig = function() {
      var styles = {};
      (this.mapTypeConfig.groups || []).forEach(function(group) {
          (group.items || []).forEach(function(item) {
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

  MarkerManager.prototype.buildMarkerClassMap = function() {
      var self = this;
      Object.keys(this.mapTypeConfig.markerStyles || {}).forEach(function(key) {
          var cfg = self.mapTypeConfig.markerStyles[key] || {};
          var typeName = cfg.match || key;
          self.markerClassMap[typeName] = 'marker-' + typeName;
      });
  };

  MarkerManager.prototype.preparePointsIndex = function() {
      var self = this;
      this.pointsByType = {};
      this.pointStateMap = {};
      this.pointsByPid = {};

      if (this.centerPoint) {
          this.centerPoint._pid = 'center';
          this.centerPoint.disabled = false;
          this.pointsByPid[this.centerPoint._pid] = this.centerPoint;
      }

      (this.mapData.points || []).forEach(function(point, idx) {
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

  MarkerManager.prototype.isPointEnabled = function(point) {
      if (!point) return false;
      if (point.type === 'center') return true;
      var state = this.pointStateMap[point._pid];
      return !(point.disabled || (state && state.disabled));
  };

  MarkerManager.prototype.setPointDisabled = function(pid, disabled) {
      var point = this.pointsByPid[pid];
      if (!point) return;
      point.disabled = disabled;
      this.pointStateMap[pid] = { disabled: disabled, type: point.type };
  };

  MarkerManager.prototype.setTypeEnabled = function(typeId, enabled) {
      var self = this;
      var list = this.pointsByType[typeId] || [];
      list.forEach(function(pt) {
          self.setPointDisabled(pt._pid, !enabled);
      });
  };

  MarkerManager.prototype.getPointsByType = function() {
      return this.pointsByType;
  };

  MarkerManager.prototype.getExistingTypes = function() {
      return this.existingTypes;
  };

  MarkerManager.prototype.getTypeLabel = function(typeId) {
      return this.typeLabelMap[typeId] || typeId;
  };

  MarkerManager.prototype.renderMarkers = function() {
      var self = this;
      this.destroyClusterers();
      this.markers.forEach(function(marker) {
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
          this.mapData.points.forEach(function(point) {
              self.addMarker(point);
          });
      }
  };

  MarkerManager.prototype.addMarker = function(point) {
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

      marker.on('click', function() {
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

  MarkerManager.prototype.setMarkerLabel = function(marker) {
      if (this.labelsVisible) {
          marker.setLabel({
              content: '<div class="marker-label">' + marker.__data.name + '</div>',
              offset: new AMap.Pixel(0, -30)
          });
      } else {
          marker.setLabel(null);
      }
  };

  MarkerManager.prototype.setLabelsVisible = function(visible) {
      this.labelsVisible = visible;
      var self = this;
      this.markers.forEach(function(marker) {
          if (marker.getMap()) {
              self.setMarkerLabel(marker);
          } else {
              marker.setLabel(null);
          }
      });
  };

  MarkerManager.prototype.toggleLabels = function() {
      this.setLabelsVisible(!this.labelsVisible);
      return this.labelsVisible;
  };

  MarkerManager.prototype.openMarkerInfoWindow = function(marker) {
      var point = marker.__data;
      var typeLabel = this.getTypeLabel(point.type);
      if (point.type === 'center') {
          typeLabel = '中心点';
      }
      var coordLng = typeof point.lng === 'number' ? point.lng : marker.getPosition().getLng();
      var coordLat = typeof point.lat === 'number' ? point.lat : marker.getPosition().getLat();
      var coordText = coordLng.toFixed(6) + ', ' + coordLat.toFixed(6);
      var lines = point.lines && point.lines.length ? point.lines.join('，') : '—';
      var infoContainer = document.createElement('div');
      infoContainer.style.padding = '10px';
      infoContainer.style.fontSize = '13px';

      var nameEl = document.createElement('strong');
      nameEl.textContent = point.name;
      infoContainer.appendChild(nameEl);

      var typeEl = document.createElement('div');
      typeEl.textContent = '类型：' + typeLabel;
      infoContainer.appendChild(typeEl);

      var linesEl = document.createElement('div');
      linesEl.textContent = '途经线路：' + lines;
      infoContainer.appendChild(linesEl);

      var distanceEl = document.createElement('div');
      distanceEl.textContent = '距离：' + (point.distance || '—') + ' 米';
      infoContainer.appendChild(distanceEl);

      var coordEl = document.createElement('div');
      coordEl.textContent = '坐标：' + coordText;
      infoContainer.appendChild(coordEl);

      var infoWindow = new AMap.InfoWindow({
          content: infoContainer
      });
      infoWindow.open(this.map, marker.getPosition());
  };

  MarkerManager.prototype.focusMarkerOnMap = function(pid, openInfo) {
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

  MarkerManager.prototype.destroyClusterers = function() {
      Object.keys(this.typeClusterers).forEach(function(key) {
          var clusterer = this.typeClusterers[key];
          if (clusterer && typeof clusterer.setMap === 'function') {
              clusterer.setMap(null);
          }
      }, this);
      this.typeClusterers = {};
  };

  MarkerManager.prototype.createClusterRenderer = function(type) {
      var color = MapUtils.getTypeColor(type, this.mapTypeConfig);
      return function(context) {
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

  MarkerManager.prototype.getClusterRenderer = function(type) {
      if (!this.clusterRenderers[type]) {
          this.clusterRenderers[type] = this.createClusterRenderer(type);
      }
      return this.clusterRenderers[type];
  };

  MarkerManager.prototype.setActiveTypes = function(activeTypes) {
      this.activeTypes = new Set(activeTypes);
  };

  MarkerManager.prototype.setShowMarkers = function(show) {
      this.showMarkers = !!show;
  };

  MarkerManager.prototype.setSpatialFilter = function(filterFn) {
      this.spatialFilter = typeof filterFn === 'function' ? filterFn : null;
  };

  MarkerManager.prototype.getVisiblePointsData = function(count) {
      var heatCount = typeof count === 'number' ? count : 10;
      return (this.lastFilteredPoints || []).map(function(pt) {
          return { lng: pt.lng, lat: pt.lat, count: heatCount };
      });
  };

  MarkerManager.prototype.applyFilters = function() {
      var self = this;
      var needCluster = this.showMarkers;
      if (needCluster && !this.mapCore.clusterPluginReady) {
          this.mapCore.loadPlugins().then(function() {
              self.applyFilters();
          });
          return;
      }

      this.destroyClusterers();
      this.lastVisibleMarkerPids.clear();
      this.lastFilteredPoints = [];
      this.markersByType = {};

      this.markers.forEach(function(marker) {
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

          if (!self.showMarkers || !isVisible) {
              marker.setMap(null);
              marker.setLabel(null);
              return;
          }

          if (!marker.getMap()) {
              marker.setMap(self.map);
          }
          self.setMarkerLabel(marker);
          if (point.type === 'center') {
              return;
          }
          var list = self.markersByType[point.type] || [];
          list.push(marker);
          self.markersByType[point.type] = list;
      });

      if (!this.showMarkers) {
          this.mapCore.updateCityCirclesVisibility(this.lastVisibleMarkerPids);
          return;
      }

      var buckets = {};
      Object.keys(this.markersByType).forEach(function(typeKey) {
          var list = self.markersByType[typeKey] || [];
          buckets[typeKey] = buckets[typeKey] || [];
          list.forEach(function(marker) {
              var point = marker.__data;
              if (!point) return;
              var isActive = self.activeTypes.has(point.type);
              var isEnabled = self.isPointEnabled(point);
              var inRadius = true;
              if (self.mapCore.mapMode === 'around' && self.mapCore.currentRadius) {
                  inRadius = MapUtils.isWithinRadius(point, self.mapCore.center, self.mapCore.currentRadius);
              }
              var inPolygon = true;
              if (self.spatialFilter) {
                  inPolygon = self.spatialFilter(point);
              }
              var canShow = isActive && isEnabled && inRadius && inPolygon;
              if (canShow) {
                  buckets[typeKey].push(marker);
              }
          });
      });

      var clusterMaxZoom = 17;
      if (this.map.getMaxZoom) {
          clusterMaxZoom = Math.max(3, this.map.getMaxZoom() - 1);
      }

      Object.keys(buckets).forEach(function(typeKey) {
          var list = buckets[typeKey];
          self.typeClusterers[typeKey] = new AMap.MarkerClusterer(self.map, list, {
              gridSize: 80,
              maxZoom: clusterMaxZoom,
              minClusterSize: 2,
              renderClusterMarker: self.getClusterRenderer(typeKey)
          });
      });

      this.mapCore.updateCityCirclesVisibility(this.lastVisibleMarkerPids);
  };

  MarkerManager.prototype.getVisibleMarkers = function() {
      return this.markers.filter(function(marker) {
          return marker && marker.getMap();
      });
  };

  MarkerManager.prototype.computeTypeCounts = function() {
      var counts = {};
      Object.keys(this.pointsByType || {}).forEach(function(typeKey) {
          if (typeKey === 'center') return;
          counts[typeKey] = (this.pointsByType[typeKey] || []).length;
      }, this);
      return counts;
  };

  MarkerManager.prototype.getTypeCounts = function() {
      return this.computeTypeCounts();
  };

  MarkerManager.prototype.setMarkerClickHandler = function(handler) {
      this.onMarkerClick = handler;
  };

  window.MarkerManager = MarkerManager;
})(window, window.MapUtils);
