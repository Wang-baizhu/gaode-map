(function(window, MapUtils) {
  function MapCore(containerId, config) {
      this.containerId = containerId;
      this.config = config || {};
      this.center = this.config.center || (this.config.mapData && this.config.mapData.center) || { lng: 0, lat: 0 };
      this.zoom = this.config.zoom || 13;
      this.zooms = this.config.zooms || [3, 20];
      this.mapData = this.config.mapData || {};
      this.mapMode = (new URLSearchParams(window.location.search).get('type') || 'around').toLowerCase();
      this.currentRadius = typeof this.mapData.radius === 'number' ? this.mapData.radius : (this.config.radius || 1000);

      this.map = null;
      this.mainCircle = null;
      this.cityCircles = [];
      this.cityCircleMap = {};
      this.boundaryPolygons = [];
      this.customPolygons = [];

      this.clusterPluginReady = false;
      this.heatmapPluginReady = false;
      this._pluginPromise = null;
  }

  MapCore.prototype.initMap = function() {
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

  MapCore.prototype.loadPlugins = function() {
      var self = this;
      if (this._pluginPromise) return this._pluginPromise;

      this._pluginPromise = new Promise(function(resolve) {
          AMap.plugin(['AMap.MarkerClusterer', 'AMap.Heatmap'], function() {
              self.clusterPluginReady = true;
              self.heatmapPluginReady = true;
              resolve();
          });
      });

      return this._pluginPromise;
  };

  MapCore.prototype.setRadius = function(radius) {
      this.currentRadius = radius;
      this.updateMainCircle(radius);
      this.rebuildCityCircles(radius);
  };

  MapCore.prototype.updateMainCircle = function(radius) {
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

  MapCore.prototype.rebuildCityCircles = function(radius) {
      var self = this;
      Object.keys(this.cityCircleMap).forEach(function(pid) {
          var circle = self.cityCircleMap[pid];
          if (!circle) return;
          circle.setMap(null);
          if (radius) {
              circle.setRadius(radius);
          }
      });
      this.cityCircles = [];
      if (this.mapMode !== 'city' || !radius) return;

      (this.mapData.points || []).forEach(function(point, idx) {
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

  MapCore.prototype.updateCityCirclesVisibility = function(visiblePidSet) {
      var self = this;
      if (this.mapMode !== 'city') return;
      if (!this.currentRadius) {
          Object.keys(this.cityCircleMap).forEach(function(pid) {
              var circle = self.cityCircleMap[pid];
              if (circle) {
                  circle.setMap(null);
              }
          });
          this.cityCircles = [];
          return;
      }
      this.cityCircles = [];
      Object.keys(this.cityCircleMap).forEach(function(pid) {
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

  MapCore.prototype.clearBoundaryPolygons = function() {
      this.boundaryPolygons.forEach(function(polygon) { polygon.setMap(null); });
      this.boundaryPolygons = [];
  };

  MapCore.prototype.clearCustomPolygons = function() {
      this.customPolygons.forEach(function(polygon) { polygon.setMap(null); });
      this.customPolygons = [];
  };

  MapCore.prototype.setCustomPolygons = function(pathsList) {
      var self = this;
      this.clearCustomPolygons();
      (pathsList || []).forEach(function(path) {
          if (!path || !path.length) return;
          var polygon = new AMap.Polygon({
              path: path,
              strokeColor: '#ff6f00',
              strokeWeight: 2,
              strokeOpacity: 0.9,
              fillColor: '#ff6f00',
              fillOpacity: 0.08
          });
          polygon.setMap(self.map);
          self.customPolygons.push(polygon);
      });
      this.updateFitView();
  };

  MapCore.prototype.drawCityBoundary = function(cityCodeOrName) {
      var self = this;
      if (this.mapMode !== 'city' || !cityCodeOrName) return;
      this.clearBoundaryPolygons();

      AMap.plugin('AMap.DistrictSearch', function() {
          var ds = new AMap.DistrictSearch({
              level: 'city',
              extensions: 'all',
              subdistrict: 0
          });

          ds.search(cityCodeOrName, function(status, result) {
              if (status !== 'complete') return;
              var list = result.districtList || [];
              if (!list.length) return;

              var boundaries = list[0].boundaries || [];
              boundaries.forEach(function(path) {
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

  MapCore.prototype.updateFitView = function(overlays) {
      if (!this.map) return;
      var objects = overlays ? overlays.slice() : [];

      if (this.mainCircle) {
          objects.push(this.mainCircle);
      }
      if (this.mapMode === 'city') {
          this.cityCircles.forEach(function(circle) {
              if (circle && circle.getMap()) {
                  objects.push(circle);
              }
          });
      }
      this.boundaryPolygons.forEach(function(polygon) {
          if (polygon && polygon.getMap) {
              objects.push(polygon);
          }
      });
      this.customPolygons.forEach(function(polygon) {
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
