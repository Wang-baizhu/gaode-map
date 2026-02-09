(function (window, MapUtils) {
    function FilterPanel(markerManager, config) {
        this.markerManager = markerManager;
        this.mapCore = (config && config.mapCore) || markerManager.mapCore;
        this.mapData = (config && config.mapData) || {};
        this.mapTypeConfig = (config && config.mapTypeConfig) || {};
        this.heatmapManager = (config && config.heatmapManager) || null;
        this.flatMode = (config && config.flatMode) || false;

        this.filterGroups = [];
        this.typeCountMap = {};
        this.groupCountMap = {};
        this.pointRowMap = {};
        this.groupExpandState = {};
        this.typeExpandState = {};
        this.heatmapEnabled = false;
        this.onFiltersChange = null;

        this.poiTotalCountEl = document.getElementById('poiTotalCount');
        this.toggleAllPoiBtn = document.getElementById('toggleAllPoi');
        this.radiusSlider = document.getElementById('radiusSlider');
        this.radiusValue = document.getElementById('radiusValue');
        this.toggleNamesBtn = document.getElementById('toggleNames');
        this.toggleAllBtn = document.getElementById('toggleAll');
        this.toggleExpandAllBtn = document.getElementById('toggleExpandAll');
        this.toggleHeatmapBtn = document.getElementById('toggleHeatmap');
        this.heatmapCountSlider = document.getElementById('heatmapCountSlider');
        this.heatmapCountValue = document.getElementById('heatmapCountValue');

        this.markerManager.setMarkerClickHandler(function (pid) {
            this.focusPointInPanel(pid, false);
        }.bind(this));
    }

    FilterPanel.prototype.init = function () {
        this.initRadiusControl();
        this.buildFilters();
        Object.keys(this.groupExpandState).forEach(function (gid) {
            this.setGroupExpanded(gid, false);
        }, this);
        this.attachFilterListeners();
        this.updateExpandAllButtonText();
        if (this.toggleNamesBtn) {
            this.toggleNamesBtn.textContent = this.markerManager.labelsVisible ? '隐藏名称' : '显示名称';
        }
        this.updateActiveTypes();
        this.updateTypeCountDisplay();
        this.updateHeatmapButtonText();
        this.updateHeatmapCountDisplay();
        if (this.heatmapManager && this.heatmapCountSlider) {
            var maxCount = Number(this.heatmapCountSlider.max) || 100;
            this.heatmapManager.options.maxCount = maxCount;
        }
    };

    FilterPanel.prototype.initRadiusControl = function () {
        if (!this.radiusSlider) return;
        var sliderMax = parseInt(this.radiusSlider.max, 10);
        if (this.mapCore.currentRadius > sliderMax) {
            this.radiusSlider.max = this.mapCore.currentRadius;
        }
        this.updateRadiusDisplay();
    };

    FilterPanel.prototype.updateRadiusDisplay = function () {
        if (!this.radiusSlider || !this.radiusValue) return;
        if (!this.mapCore.currentRadius) {
            this.radiusValue.textContent = '关闭';
        } else {
            this.radiusValue.textContent = parseInt(this.mapCore.currentRadius, 10) + ' 米';
        }
        this.radiusSlider.value = this.mapCore.currentRadius;
    };

    FilterPanel.prototype.buildFilters = function () {
        var container = document.getElementById('filtersContainer');
        if (!container) return;
        var pointsByType = this.markerManager.getPointsByType();
        var existingTypes = this.markerManager.getExistingTypes();

        container.innerHTML = '';
        this.filterGroups = [];
        this.typeCountMap = {};
        this.groupCountMap = {};
        this.pointRowMap = {};

        if (this.flatMode) {
            var flatItems = [];
            (this.mapTypeConfig.groups || []).forEach(function (group) {
                (group.items || []).forEach(function (item) {
                    flatItems.push({
                        groupId: group.id,
                        item: item
                    });
                });
            });

            flatItems.forEach(function (entry) {
                var item = entry.item;
                var section = document.createElement('div');
                section.className = 'filter-section poi-type-card';

                var header = document.createElement('div');
                header.className = 'poi-type-header';

                var titleWrap = document.createElement('div');
                titleWrap.className = 'poi-type-title';

                var colorDot = document.createElement('span');
                colorDot.className = 'color-dot';
                colorDot.style.background = item.color || '#888';

                var titleText = document.createElement('span');
                titleText.textContent = item.label;

                titleWrap.appendChild(colorDot);
                titleWrap.appendChild(titleText);

                var actions = document.createElement('div');
                actions.className = 'poi-type-actions';

                var countSpan = document.createElement('span');
                countSpan.className = 'type-count badge';
                countSpan.textContent = '(0)';
                this.typeCountMap[item.id] = countSpan;
                actions.appendChild(countSpan);

                var toggleInput = document.createElement('input');
                toggleInput.type = 'checkbox';
                toggleInput.id = 'flat-' + item.id;
                toggleInput.value = item.id;
                toggleInput.className = 'type-checkbox';
                toggleInput.checked = item.defaultChecked !== false && existingTypes.has(item.id);
                toggleInput.style.display = 'none';

                var expandBtn = document.createElement('button');
                expandBtn.className = 'expand-btn';
                expandBtn.dataset.typeExpandBtn = item.id;
                expandBtn.title = '展开子项';
                var expandIcon = document.createElement('img');
                expandIcon.src = '/static/images/chevron.svg';
                expandIcon.alt = '展开';
                expandIcon.className = 'expand-icon';
                expandBtn.appendChild(expandIcon);
                actions.appendChild(expandBtn);

                header.appendChild(titleWrap);
                header.appendChild(actions);

                var pointList = document.createElement('div');
                pointList.className = 'point-list';
                pointList.dataset.typeId = item.id;
                pointList.id = 'type-list-' + item.id;

                (pointsByType[item.id] || []).forEach(function (pt) {
                    var row = document.createElement('div');
                    row.className = 'point-item';
                    row.dataset.pid = pt._pid;
                    row.dataset.typeId = item.id;
                    row.dataset.groupId = entry.groupId;

                    var pointToggle = document.createElement('input');
                    pointToggle.type = 'checkbox';
                    pointToggle.checked = this.markerManager.isPointEnabled(pt);
                    pointToggle.addEventListener('change', function () {
                        var disabled = !pointToggle.checked;
                        this.markerManager.setPointDisabled(pt._pid, disabled);
                        this.applyFilters();
                        this.updateTypeCountDisplay();
                        row.classList.toggle('disabled', disabled);
                    }.bind(this));

                    var nameSpan = document.createElement('span');
                    nameSpan.className = 'point-name';
                    nameSpan.textContent = pt.name;
                    nameSpan.addEventListener('click', function () {
                        var typeCheckbox = document.getElementById('flat-' + item.id);
                        if (typeCheckbox && !typeCheckbox.checked) {
                            typeCheckbox.checked = true;
                            this.updateActiveTypes();
                        }
                        this.markerManager.focusMarkerOnMap(pt._pid, true);
                        this.focusPointInPanel(pt._pid, false);
                    }.bind(this));

                    row.appendChild(pointToggle);
                    row.appendChild(nameSpan);
                    row.classList.toggle('disabled', !this.markerManager.isPointEnabled(pt));
                    pointList.appendChild(row);
                    this.pointRowMap[pt._pid] = row;
                }.bind(this));

                this.typeExpandState[item.id] = false;
                section.appendChild(header);
                section.appendChild(toggleInput);
                if (pointList.childElementCount > 0) {
                    pointList.classList.add('collapsed');
                    section.appendChild(pointList);
                } else {
                    expandBtn.style.visibility = 'hidden';
                }

                container.appendChild(section);
            }.bind(this));

            return;
        }

        (this.mapTypeConfig.groups || []).forEach(function (group) {
            var section = document.createElement('div');
            section.className = 'filter-section poi-group-card';

            var header = document.createElement('div');
            header.className = 'poi-group-header';

            var titleSpan = document.createElement('div');
            titleSpan.className = 'poi-group-title';
            titleSpan.textContent = group.title;

            var groupCount = 0;
            (group.items || []).forEach(function (item) {
                groupCount += (pointsByType[item.id] || []).length;
            });

            var actions = document.createElement('div');
            actions.className = 'poi-group-actions';

            var groupCountSpan = document.createElement('span');
            groupCountSpan.className = 'group-count badge';
            groupCountSpan.textContent = '' + groupCount;
            actions.appendChild(groupCountSpan);
            this.groupCountMap[group.id] = groupCountSpan;

            var toggleLabel = document.createElement('label');
            toggleLabel.className = 'toggle';
            toggleLabel.title = '全选/隐藏';

            var toggleInput = document.createElement('input');
            toggleInput.type = 'checkbox';
            toggleInput.id = group.toggleId;
            toggleInput.className = 'group-toggle';

            var toggleSlider = document.createElement('span');
            toggleSlider.className = 'toggle-slider';

            toggleLabel.appendChild(toggleInput);
            toggleLabel.appendChild(toggleSlider);
            actions.appendChild(toggleLabel);

                var expandBtn = document.createElement('button');
                expandBtn.className = 'expand-btn';
                expandBtn.dataset.expandBtn = group.id;
                expandBtn.title = '展开';
                var expandIcon = document.createElement('img');
                expandIcon.src = '/static/images/chevron.svg';
                expandIcon.alt = '展开';
                expandIcon.className = 'expand-icon';
                expandBtn.appendChild(expandIcon);
                actions.appendChild(expandBtn);

            header.appendChild(titleSpan);
            header.appendChild(actions);

            var groupDiv = document.createElement('div');
            groupDiv.className = 'filter-group';
            groupDiv.id = group.filtersId;

            var groupContent = document.createElement('div');
            groupContent.className = 'group-content';
            groupContent.id = group.id + '-content';

            (group.items || []).forEach(function (item) {
                var itemContainer = document.createElement('div');
                itemContainer.className = 'type-block';

                var option = document.createElement('div');
                option.className = 'filter-option';

                var input = document.createElement('input');
                input.type = 'checkbox';
                input.id = group.id + '-' + item.id;
                input.value = item.id;
                input.className = 'type-checkbox';
                input.checked = item.defaultChecked !== false && existingTypes.has(item.id);

                var indicator = document.createElement('div');
                indicator.className = 'color-indicator';
                indicator.style.background = item.color || '#888';

                var label = document.createElement('label');
                label.htmlFor = input.id;
                var labelText = document.createElement('span');
                labelText.textContent = item.label;
                var countSpan = document.createElement('span');
                countSpan.className = 'type-count';
                countSpan.textContent = '(0)';
                this.typeCountMap[item.id] = countSpan;
                label.appendChild(labelText);
                label.appendChild(countSpan);

                var typeExpandBtn = document.createElement('button');
                typeExpandBtn.className = 'expand-btn';
                typeExpandBtn.dataset.typeExpandBtn = item.id;
                typeExpandBtn.title = '收起子项';
                var typeExpandIcon = document.createElement('img');
                typeExpandIcon.src = '/static/images/chevron.svg';
                typeExpandIcon.alt = '展开';
                typeExpandIcon.className = 'expand-icon';
                typeExpandBtn.appendChild(typeExpandIcon);
                typeExpandBtn.classList.add('expanded');

                option.appendChild(input);
                option.appendChild(indicator);
                option.appendChild(label);
                option.appendChild(typeExpandBtn);

                var pointList = document.createElement('div');
                pointList.className = 'point-list';
                pointList.dataset.typeId = item.id;
                pointList.id = 'type-list-' + item.id;

                (pointsByType[item.id] || []).forEach(function (pt) {
                    var row = document.createElement('div');
                    row.className = 'point-item';
                    row.dataset.pid = pt._pid;
                    row.dataset.typeId = item.id;
                    row.dataset.groupId = group.id;

                    var pointToggle = document.createElement('input');
                    pointToggle.type = 'checkbox';
                    pointToggle.checked = this.markerManager.isPointEnabled(pt);
                    pointToggle.addEventListener('change', function () {
                        var disabled = !pointToggle.checked;
                        this.markerManager.setPointDisabled(pt._pid, disabled);
                        this.applyFilters();
                        this.updateTypeCountDisplay();
                        row.classList.toggle('disabled', disabled);
                    }.bind(this));

                    var nameSpan = document.createElement('span');
                    nameSpan.className = 'point-name';
                    nameSpan.textContent = pt.name;
                    nameSpan.addEventListener('click', function () {
                        var typeCheckbox = document.getElementById(group.id + '-' + item.id);
                        if (typeCheckbox && !typeCheckbox.checked) {
                            typeCheckbox.checked = true;
                            this.updateActiveTypes();
                            this.updateToggleButtonText('#' + group.filtersId, group.toggleId);
                        }
                        this.markerManager.focusMarkerOnMap(pt._pid, true);
                        this.focusPointInPanel(pt._pid, false);
                    }.bind(this));

                    row.appendChild(pointToggle);
                    row.appendChild(nameSpan);
                    // meta info removed
                    row.classList.toggle('disabled', !this.markerManager.isPointEnabled(pt));
                    pointList.appendChild(row);
                    this.pointRowMap[pt._pid] = row;
                }.bind(this));

                this.typeExpandState[item.id] = true;
                itemContainer.appendChild(option);
                if (pointList.childElementCount > 0) {
                    itemContainer.appendChild(pointList);
                } else {
                    typeExpandBtn.style.visibility = 'hidden';
                }
                groupDiv.appendChild(itemContainer);
            }.bind(this));

            section.appendChild(header);
            groupContent.appendChild(groupDiv);
            section.appendChild(groupContent);
            container.appendChild(section);

            this.groupExpandState[group.id] = false;
            this.filterGroups.push({ group: '#' + group.filtersId, button: group.toggleId, groupId: group.id, expandBtn: expandBtn });
            this.updateToggleButtonText('#' + group.filtersId, group.toggleId);
        }.bind(this));
    };

    FilterPanel.prototype.syncPointsWithType = function (typeId, enabled) {
        var list = this.markerManager.getPointsByType()[typeId] || [];
        var self = this;
        list.forEach(function (pt) {
            self.markerManager.setPointDisabled(pt._pid, !enabled);
            var row = self.pointRowMap[pt._pid];
            if (row) {
                var pointToggle = row.querySelector('input[type="checkbox"]');
                if (pointToggle) {
                    pointToggle.checked = enabled;
                }
                row.classList.toggle('disabled', !enabled);
            }
        });
        this.setTypeExpanded(typeId, enabled ? (this.typeExpandState[typeId] !== false) : false);
        this.updateTypeCountDisplay();
    };

    FilterPanel.prototype.setGroupExpanded = function (groupId, expanded) {
        this.groupExpandState[groupId] = expanded;
        var content = document.getElementById(groupId + '-content');
        var btn = document.querySelector('[data-expand-btn="' + groupId + '"]');
        if (content) {
            if (expanded) {
                content.classList.remove('collapsed');
            } else {
                content.classList.add('collapsed');
            }
        }
        if (btn) {
            btn.title = expanded ? '收起' : '展开';
            btn.classList.toggle('expanded', expanded);
        }
    };

    FilterPanel.prototype.updateExpandAllButtonText = function () {
        if (!this.toggleExpandAllBtn) return;
        var keys = this.flatMode ? Object.keys(this.typeExpandState) : Object.keys(this.groupExpandState);
        var allExpanded = keys.length && keys.every(function (k) {
            return this.flatMode ? this.typeExpandState[k] !== false : this.groupExpandState[k];
        }, this);
        this.toggleExpandAllBtn.textContent = allExpanded ? '全部收起' : '全部展开';
        this.toggleExpandAllBtn.title = allExpanded ? '全部收起' : '全部展开';
    };

    FilterPanel.prototype.toggleAllGroupExpand = function () {
        if (this.flatMode) {
            var typeKeys = Object.keys(this.typeExpandState);
            var targetExpand = typeKeys.some(function (k) { return !this.typeExpandState[k]; }, this);
            typeKeys.forEach(function (k) {
                this.setTypeExpanded(k, targetExpand);
            }, this);
        } else {
            var keys = Object.keys(this.groupExpandState);
            var targetExpand = keys.some(function (k) { return !this.groupExpandState[k]; }, this);
            var self = this;
            keys.forEach(function (k) {
                self.setGroupExpanded(k, targetExpand);
            });
        }
        this.updateExpandAllButtonText();
    };

    FilterPanel.prototype.setTypeExpanded = function (typeId, expanded) {
        this.typeExpandState[typeId] = expanded;
        var listEl = document.getElementById('type-list-' + typeId);
        var btn = document.querySelector('[data-type-expand-btn="' + typeId + '"]');
        if (listEl) {
            if (expanded) {
                listEl.classList.remove('collapsed');
            } else {
                listEl.classList.add('collapsed');
            }
        }
        if (btn) {
            btn.title = expanded ? '收起子项' : '展开子项';
            btn.classList.toggle('expanded', expanded);
        }
    };

    FilterPanel.prototype.attachFilterListeners = function () {
        var self = this;
        if (this.flatMode) {
            var flatCheckboxes = document.querySelectorAll('#filtersContainer input[type="checkbox"].type-checkbox');
            flatCheckboxes.forEach(function (checkbox) {
                checkbox.addEventListener('change', function () {
                    self.syncPointsWithType(checkbox.value, checkbox.checked);
                    self.updateActiveTypes();
                    self.updateToggleAllPoiText();
                });
            });

            var headers = document.querySelectorAll('#filtersContainer .poi-type-header');
            headers.forEach(function (header) {
                header.addEventListener('click', function () {
                    var card = header.closest('.poi-type-card');
                    if (!card) return;
                    var checkbox = card.querySelector('input[type="checkbox"].type-checkbox');
                    if (!checkbox) return;
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                });
            });

            var typeExpandBtns = document.querySelectorAll('#filtersContainer .expand-btn[data-type-expand-btn]');
            typeExpandBtns.forEach(function (btn) {
                btn.addEventListener('click', function (event) {
                    if (event && event.stopPropagation) {
                        event.stopPropagation();
                    }
                    var typeId = btn.dataset.typeExpandBtn;
                    self.setTypeExpanded(typeId, !self.typeExpandState[typeId]);
                    self.updateExpandAllButtonText();
                });
            });
        } else {
        this.filterGroups.forEach(function (item) {
            var checkboxes = document.querySelectorAll(item.group + ' input[type="checkbox"].type-checkbox');
            checkboxes.forEach(function (checkbox) {
                checkbox.addEventListener('change', function () {
                    self.syncPointsWithType(checkbox.value, checkbox.checked);
                    self.updateActiveTypes();
                    self.updateToggleButtonText(item.group, item.button);
                });
            });

            var typeExpandBtns = document.querySelectorAll(item.group + ' .expand-btn[data-type-expand-btn]');
            typeExpandBtns.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var typeId = btn.dataset.typeExpandBtn;
                    self.setTypeExpanded(typeId, !self.typeExpandState[typeId]);
                });
            });

            var toggleBtn = document.getElementById(item.button);
            if (toggleBtn) {
                toggleBtn.addEventListener('change', function () {
                    self.toggleAllInGroup(item.group, item.button, toggleBtn.checked);
                });
            }

            if (item.expandBtn) {
                item.expandBtn.addEventListener('click', function () {
                    var target = !self.groupExpandState[item.groupId];
                    self.setGroupExpanded(item.groupId, target);
                    self.updateExpandAllButtonText();
                });
            }
        });
        }

        if (this.toggleExpandAllBtn) {
            this.toggleExpandAllBtn.addEventListener('click', function () {
                self.toggleAllGroupExpand();
            });
        }

        if (this.toggleNamesBtn) {
            this.toggleNamesBtn.addEventListener('click', function () {
                var visible = self.markerManager.toggleLabels();
                self.toggleNamesBtn.textContent = visible ? '隐藏名称' : '显示名称';
            });
        }

        if (this.toggleAllBtn) {
            this.toggleAllBtn.addEventListener('click', function () {
                self.toggleAllTypes();
            });
        }

        if (!this.toggleAllPoiBtn) {
            this.toggleAllPoiBtn = document.getElementById('toggleAllPoi');
        }

        if (this.toggleAllPoiBtn) {
            this.toggleAllPoiBtn.addEventListener('click', function () {
                self.toggleAllTypes();
                self.updateToggleAllPoiText();
            });
        }

        if (this.toggleHeatmapBtn && this.heatmapManager) {
            this.toggleHeatmapBtn.addEventListener('click', function () {
                self.toggleHeatmap();
            });
        }

        if (this.heatmapCountSlider) {
            this.heatmapCountSlider.addEventListener('input', function () {
                self.updateHeatmapCountDisplay();
                if (self.heatmapEnabled) {
                    self.refreshHeatmap();
                }
            });
        }

        if (this.radiusSlider) {
            var radiusThrottleTimer = null;
            this.radiusSlider.addEventListener('input', function () {
                var radius = Number(self.radiusSlider.value);
                self.updateRadiusDisplay(); // UI update is fast

                if (radiusThrottleTimer) return;
                radiusThrottleTimer = setTimeout(function () {
                    self.mapCore.setRadius(radius);
                    self.markerManager.applyFilters();
                    self.updateTypeCountDisplay();
                    self.mapCore.updateFitView(self.markerManager.getVisibleMarkers());
                    self.refreshHeatmap();
                    radiusThrottleTimer = null;
                }, 50); // 50ms throttle
            });
        }
    };

    FilterPanel.prototype.updateToggleButtonText = function (groupId, buttonId) {
        var checkboxes = document.querySelectorAll(groupId + ' input[type="checkbox"].type-checkbox');
        var allChecked = true;
        var anyChecked = false;
        checkboxes.forEach(function (cb) {
            if (!cb.checked) allChecked = false;
            if (cb.checked) anyChecked = true;
        });

        var toggle = document.getElementById(buttonId);
        if (toggle) {
            if (allChecked) {
                toggle.checked = true;
                toggle.indeterminate = false;
            } else if (!anyChecked) {
                toggle.checked = false;
                toggle.indeterminate = false;
            } else {
                toggle.checked = false;
                toggle.indeterminate = true;
            }
        }
    };

    FilterPanel.prototype.toggleAllInGroup = function (groupId, buttonId, targetChecked) {
        var checkboxes = document.querySelectorAll(groupId + ' input[type="checkbox"].type-checkbox');
        var allChecked = true;
        checkboxes.forEach(function (cb) {
            if (!cb.checked) allChecked = false;
        });

        var desired = typeof targetChecked === 'boolean' ? targetChecked : !allChecked;
        checkboxes.forEach(function (cb) {
            if (cb.checked !== desired) {
                cb.checked = desired;
                cb.dispatchEvent(new Event('change'));
            }
        });
        this.updateToggleButtonText(groupId, buttonId);
    };

    FilterPanel.prototype.toggleAllTypes = function () {
        var allChecked = true;
        var selectors = [];
        if (this.flatMode) {
            selectors = ['#filtersContainer input[type="checkbox"].type-checkbox'];
        } else {
            selectors = this.filterGroups.map(function (item) {
                return item.group + ' input[type="checkbox"].type-checkbox';
            });
        }

        selectors.forEach(function (selector) {
            var checkboxes = document.querySelectorAll(selector);
            checkboxes.forEach(function (cb) {
                if (!cb.checked) allChecked = false;
            });
        });

        selectors.forEach(function (selector) {
            var checkboxes = document.querySelectorAll(selector);
            checkboxes.forEach(function (cb) {
                cb.checked = !allChecked;
                cb.dispatchEvent(new Event('change'));
            });
        });
    };

    FilterPanel.prototype.updateActiveTypes = function () {
        var activeTypes = new Set();
        if (this.flatMode) {
            var checkboxes = document.querySelectorAll('#filtersContainer input[type="checkbox"].type-checkbox');
            checkboxes.forEach(function (checkbox) {
                if (checkbox.checked) {
                    activeTypes.add(checkbox.value);
                }
            });
        } else {
            this.filterGroups.forEach(function (item) {
                var checkboxes = document.querySelectorAll(item.group + ' input[type="checkbox"].type-checkbox');
                checkboxes.forEach(function (checkbox) {
                    if (checkbox.checked) {
                        activeTypes.add(checkbox.value);
                    }
                });
            });
        }
        this.markerManager.setActiveTypes(activeTypes);
        this.applyFilters();
    };

    FilterPanel.prototype.applyFilters = function () {
        this.markerManager.applyFilters();
        this.mapCore.updateFitView(this.markerManager.getVisibleMarkers());
        this.updateTypeCountDisplay();
        this.refreshHeatmap();
        if (typeof this.onFiltersChange === 'function') {
            this.onFiltersChange();
        }
    };

    FilterPanel.prototype.updateHeatmapCountDisplay = function () {
        if (!this.heatmapCountSlider || !this.heatmapCountValue) return;
        var val = Number(this.heatmapCountSlider.value || 0);
        this.heatmapCountValue.textContent = val;
    };

    FilterPanel.prototype.updateTypeCountDisplay = function () {
        var counts = this.markerManager.getTypeCounts();
        var visibleCounts = this.computeVisibleCounts ? this.computeVisibleCounts() : {};
        var total = 0;
        Object.keys(this.typeCountMap).forEach(function (typeKey) {
            var span = this.typeCountMap[typeKey];
            if (!span) return;
            var count = counts[typeKey] || 0;
            span.textContent = '' + count;
            total += count;
        }, this);

        (this.mapTypeConfig.groups || []).forEach(function (group) {
            var groupTotal = 0;
            (group.items || []).forEach(function (item) {
                groupTotal += counts[item.id] || 0;
            });
            var groupSpan = this.groupCountMap[group.id];
            if (groupSpan) {
                groupSpan.textContent = '' + groupTotal;
            }
        }, this);

        if (this.poiTotalCountEl) {
            this.poiTotalCountEl.textContent = '总数 ' + total;
        }

        if (this.flatMode) {
            var typeCheckboxes = document.querySelectorAll('#filtersContainer input[type="checkbox"].type-checkbox');
            typeCheckboxes.forEach(function (checkbox) {
                var typeId = checkbox.value;
                var count = counts[typeId] || 0;
                var visible = visibleCounts[typeId] || 0;
                var countEl = checkbox.closest('.poi-type-card');
                if (countEl) {
                    var badge = countEl.querySelector('.type-count');
                    if (badge) {
                        if (visible > 0 && visible < count) {
                            badge.textContent = '' + visible + '/' + count;
                        } else {
                            badge.textContent = '' + count;
                        }
                    }
                    countEl.classList.toggle('is-visible', visible > 0);
                    countEl.classList.toggle('is-hidden', visible === 0);
                    countEl.classList.toggle('is-partial', visible > 0 && visible < count);
                }
                if (checkbox.checked) {
                    checkbox.indeterminate = false;
                }
            });
            this.updateToggleAllPoiText();
        }
    };

    FilterPanel.prototype.computeVisibleCounts = function () {
        var counts = {};
        var pointsByType = this.markerManager.getPointsByType() || {};
        Object.keys(pointsByType).forEach(function (typeKey) {
            if (typeKey === 'center') return;
            var list = pointsByType[typeKey] || [];
            var visible = 0;
            list.forEach(function (pt) {
                if (this.markerManager.isPointEnabled(pt)) {
                    visible += 1;
                }
            }, this);
            counts[typeKey] = visible;
        }, this);
        return counts;
    };

    FilterPanel.prototype.updateToggleAllPoiText = function () {
        if (!this.toggleAllPoiBtn) return;
        var counts = this.markerManager.getTypeCounts() || {};
        var typeIds = Object.keys(counts).filter(function (key) {
            return counts[key] > 0;
        });
        if (!typeIds.length) {
            this.toggleAllPoiBtn.textContent = '全部显示';
            return;
        }

        var allChecked = true;
        typeIds.forEach(function (typeId) {
            var cb = document.getElementById('flat-' + typeId);
            if (cb && !cb.checked) {
                allChecked = false;
            }
        });
        this.toggleAllPoiBtn.textContent = allChecked ? '全部隐藏' : '全部显示';
    };

    FilterPanel.prototype.focusPointInPanel = function (pid, autoCenter) {
        var targetPid = pid;
        if (!targetPid) return;
        var row = this.pointRowMap[targetPid];
        if (!row) return;
        if (this.flatMode) {
            var typeId = row.dataset.typeId;
            this.setTypeExpanded(typeId, true);
            this.updateExpandAllButtonText();
        } else {
            var groupId = row.dataset.groupId;
            this.setGroupExpanded(groupId, true);
            this.updateExpandAllButtonText();
        }

        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.markRowHighlight(row);

        if (autoCenter !== false) {
            this.markerManager.focusMarkerOnMap(targetPid, false);
        }
    };

    FilterPanel.prototype.markRowHighlight = function (rowEl) {
        if (!rowEl) return;
        rowEl.classList.add('highlight-row');
        setTimeout(function () {
            rowEl.classList.remove('highlight-row');
        }, 1500);
    };

    FilterPanel.prototype.toggleHeatmap = function () {
        var self = this;
        if (!this.heatmapManager) return;
        this.heatmapEnabled = !this.heatmapEnabled;

        if (this.heatmapEnabled) {
            this.markerManager.setShowMarkers(false);
            this.markerManager.applyFilters();
            this.heatmapManager.enable(this.markerManager.getVisiblePointsData(this.getHeatmapCount())).then(function () {
                self.refreshHeatmap();
                self.mapCore.updateFitView(self.markerManager.getVisibleMarkers());
            });
        } else {
            this.heatmapManager.disable();
            this.markerManager.setShowMarkers(true);
            this.markerManager.applyFilters();
            this.mapCore.updateFitView(self.markerManager.getVisibleMarkers());
        }

        this.updateHeatmapButtonText();
    };

    FilterPanel.prototype.refreshHeatmap = function () {
        if (!this.heatmapEnabled || !this.heatmapManager) return;
        var points = this.markerManager.getVisiblePointsData(this.getHeatmapCount());
        this.heatmapManager.updateFromPoints(points);
    };

    FilterPanel.prototype.getHeatmapCount = function () {
        if (!this.heatmapCountSlider) return 10;
        var val = Number(this.heatmapCountSlider.value || 10);
        if (Number.isNaN(val)) return 10;
        return Math.max(1, Math.min(100, val));
    };

    FilterPanel.prototype.updateHeatmapButtonText = function () {
        if (!this.toggleHeatmapBtn) return;
        this.toggleHeatmapBtn.textContent = this.heatmapEnabled ? '关闭热力图' : '开启热力图';
    };

    window.FilterPanel = FilterPanel;
})(window, window.MapUtils);
