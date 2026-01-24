(function(window) {
  function HeatmapManager(mapCore, options) {
      this.mapCore = mapCore;
      this.map = mapCore.map;
      this.options = options || {};
      this.heatmap = null;
      this.enabled = false;
  }

  HeatmapManager.prototype.ensureLayer = function() {
      var self = this;
      if (this.heatmap) return Promise.resolve(this.heatmap);

      return this.mapCore.loadPlugins().then(function() {
          if (self.heatmap) return self.heatmap;
          var radius = self.options.radius || 30;
          var opacity = self.options.opacity || [0, 0.8];
          var gradient = self.options.gradient || {
              0.2: 'rgb(0, 255, 255)',
              0.5: 'rgb(0, 110, 255)',
              0.8: 'rgb(255, 140, 0)',
              1.0: 'rgb(255, 0, 0)'
          };

          self.heatmap = new AMap.Heatmap(self.map, {
              radius: radius,
              opacity: opacity,
              gradient: gradient
          });
          return self.heatmap;
      });
  };

  HeatmapManager.prototype.enable = function(points) {
      var self = this;
      this.enabled = true;
      return this.ensureLayer().then(function() {
          self.heatmap.show();
          self.setData(points || []);
      });
  };

  HeatmapManager.prototype.disable = function() {
      this.enabled = false;
      if (this.heatmap) {
          this.heatmap.hide();
      }
  };

  HeatmapManager.prototype.setData = function(points) {
      if (!this.enabled || !this.heatmap) return;
      var maxOverride = typeof this.options.maxCount === 'number' ? this.options.maxCount : null;
      var data = (points || []).filter(function(pt) {
          return pt && typeof pt.lng === 'number' && typeof pt.lat === 'number';
      }).map(function(pt) {
          return { lng: pt.lng, lat: pt.lat, count: pt.count || 1 };
      });
      var computedMax = data.reduce(function(max, pt) {
          var c = typeof pt.count === 'number' ? pt.count : 1;
          return Math.max(max, c);
      }, 1);
      var finalMax = maxOverride || computedMax || 1;
      this.heatmap.setDataSet({ data: data, max: finalMax });
  };

  HeatmapManager.prototype.updateFromPoints = function(points) {
      this.setData(points);
  };

  window.HeatmapManager = HeatmapManager;
})(window);
