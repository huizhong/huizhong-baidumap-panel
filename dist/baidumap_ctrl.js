'use strict';

System.register(['app/plugins/sdk', 'app/core/time_series2', 'app/core/utils/kbn', 'lodash', './map_renderer', './data_formatter', './geohash'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, TimeSeries, kbn, _, mapRenderer, DataFormatter, decodeGeoHash, _typeof, _createClass, _slicedToArray, panelDefaults, BaidumapCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    function getColor(orginBili, alpha) {
        if (typeof orginBili !== 'number') {
            return orginBili;
        }
        var bili = orginBili > 100 ? 100 : orginBili;
        // 百分之一 = (单色值范围) / 50;  单颜色的变化范围只在50%之内
        var one = (255 + 255) / 100;
        var r = 0;
        var g = 0;
        var b = 0;

        var yellowValue = 50;
        var fullRedValue = 95;
        var darkRedWeight = 0.6;

        if (bili <= yellowValue) {
            // 比例小于yellowValue的时候红色是越来越多的,直到红色为255时(红+绿)变为黄色.
            r = one * bili / yellowValue * 50;
            g = 255;
        } else if (bili > yellowValue && bili <= fullRedValue) {
            // 比例大于yellowValue的时候绿色是越来越少的,直到fullRedValue 变为纯红
            g = 255 - (bili - yellowValue) / (fullRedValue - yellowValue) * 50 * one;
            r = 255;
        } else {
            // 比例大于fullRedValue 开始转为暗红
            g = 0;
            r = 255 * (1 - darkRedWeight * (bili - fullRedValue) / (100 - fullRedValue));
        }
        r = parseInt(r, 10); // 取整
        g = parseInt(g, 10); // 取整
        b = parseInt(b, 10); // 取整
        return 'rgb(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    function getFilterColor(originOption) {
        var styleOption = {};
        ['fillColor', 'strokeColor'].forEach(function (keyName) {
            if (originOption[keyName]) {
                styleOption[keyName] = getColor(originOption[keyName], 0.5);
            }
        });
        return Object.assign({}, originOption, styleOption);
    }

    function filterCtx(ctx, originOption) {
        var usePolyOption = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        var sourceOption = Object.assign(usePolyOption ? getDefaultPolyOption() : {}, originOption);
        var styleOption = getFilterColor(sourceOption);
        [['strokeWeight', 'lineWidth'], ['fillColor', 'fillStyle'], ['strokeColor', 'strokeStyle'], ['strokeOpacity', 'globalAlpha']].forEach(function (keyMap) {
            var _keyMap = _slicedToArray(keyMap, 2),
                sourceName = _keyMap[0],
                targetName = _keyMap[1];

            var keyValue = styleOption[sourceName];
            delete styleOption[sourceName];
            styleOption[targetName] = keyValue;
        });
        Object.assign(ctx, styleOption);
    }

    // 获取色块对应的矩形相对于地图的像素值
    function getDotRect(mp, lng, lat) {
        var squareSize = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 20;
        var isCenterPoint = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

        var standardLen = 111700;
        var xScale = Math.cos(lat * Math.PI / 180);
        var lngDelta = squareSize / (standardLen * xScale);
        var latDelta = squareSize / standardLen;

        var pixel = mp.pointToPixel(isCenterPoint ? new window.BMap.Point(lng - lngDelta / 2, lat - latDelta / 2) : new window.BMap.Point(lng, lat));
        var pixel2 = mp.pointToPixel(isCenterPoint ? new window.BMap.Point(lng + lngDelta / 2, lat + latDelta / 2) : new window.BMap.Point(lng + lngDelta, lat + latDelta));
        return {
            x: pixel.x,
            y: pixel.y,
            w: pixel2.x - pixel.x,
            h: pixel2.y - pixel.y
        };
    }

    function getDefaultPolyOption() {
        return {
            strokeWeight: 3,
            strokeOpacity: 0.6,
            strokeColor: 'blue',
            fillColor: 'red',
            fillOpacity: 0.4
        };
    }

    function isPointInCircle(checkPixel, circlePixel, circleRadius) {
        return (checkPixel.x - circlePixel.x) * (checkPixel.x - circlePixel.x) + (checkPixel.y - circlePixel.y) * (checkPixel.y - circlePixel.y) <= circleRadius * circleRadius;
    }

    function isPointInRect(checkPixel, sourceCheckRect) {
        var checkRect = Object.assign({}, sourceCheckRect);
        if (checkRect.w < 0) {
            checkRect.x += checkRect.w;
            checkRect.w *= -1;
        }
        if (checkRect.h < 0) {
            checkRect.y += checkRect.h;
            checkRect.h *= -1;
        }
        return checkPixel.x >= checkRect.x && checkPixel.x <= checkRect.x + checkRect.w && checkPixel.y >= checkRect.y && checkPixel.y <= checkRect.y + checkRect.h;
    }

    function isPointInPoly(checkPixel, polyPoints) {
        var x = checkPixel.x;
        var y = checkPixel.y;

        var inside = false;
        for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            var xi = polyPoints[i].x;
            var yi = polyPoints[i].y;
            var xj = polyPoints[j].x;
            var yj = polyPoints[j].y;

            var intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    }

    return {
        setters: [function (_appPluginsSdk) {
            MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
        }, function (_appCoreTime_series) {
            TimeSeries = _appCoreTime_series.default;
        }, function (_appCoreUtilsKbn) {
            kbn = _appCoreUtilsKbn.default;
        }, function (_lodash) {
            _ = _lodash.default;
        }, function (_map_renderer) {
            mapRenderer = _map_renderer.default;
        }, function (_data_formatter) {
            DataFormatter = _data_formatter.default;
        }, function (_geohash) {
            decodeGeoHash = _geohash.default;
        }],
        execute: function () {
            _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
                return typeof obj;
            } : function (obj) {
                return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };

            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            _slicedToArray = function () {
                function sliceIterator(arr, i) {
                    var _arr = [];
                    var _n = true;
                    var _d = false;
                    var _e = undefined;

                    try {
                        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                            _arr.push(_s.value);

                            if (i && _arr.length === i) break;
                        }
                    } catch (err) {
                        _d = true;
                        _e = err;
                    } finally {
                        try {
                            if (!_n && _i["return"]) _i["return"]();
                        } finally {
                            if (_d) throw _e;
                        }
                    }

                    return _arr;
                }

                return function (arr, i) {
                    if (Array.isArray(arr)) {
                        return arr;
                    } else if (Symbol.iterator in Object(arr)) {
                        return sliceIterator(arr, i);
                    } else {
                        throw new TypeError("Invalid attempt to destructure non-iterable instance");
                    }
                };
            }();

            panelDefaults = {
                ak: 'QKCqsdHBbGxBnNbvUwWdUEBjonk7jUj6',
                maxDataPoints: 1,
                theme: '',
                lat: 39.968539,
                lng: 116.497856,
                initialZoom: 14,
                autoFocusCenterDistance: 10000,
                valueName: 'current',
                locationData: 'json result',
                gpsType: '百度坐标系',
                esMetric: 'Count',
                decimals: 0,
                navigation: true,
                scale: true,
                hideEmpty: false,
                overviewMap: false,
                hideZero: false,
                mapType: false,
                traffic: false,
                clusterPoint: false,
                globalConfig: '',
                enableMapClick: false,

                typeName: 'type',
                lngName: 'longitude',
                latName: 'latitude',
                posName: 'pos',
                geohashName: 'geohash',
                configName: 'config',
                contentName: 'content',

                circleName: 'circle',
                squareName: 'square',
                polygonName: 'polygon',
                polylineName: 'polyline',
                pointName: 'point',
                labelName: 'label',
                bdLabelName: 'Label',
                bdPolylineName: 'Polyline',
                bdPolygonName: 'Polygon',
                bdCircleName: 'Circle',
                bdMarkerName: 'Marker',
                bdRidingRouteName: 'RidingRoute',
                bdWalkingRouteName: 'WalkingRoute',
                bdDrivingRouteName: 'DrivingRoute',
                bdHeatRouteName: 'Heat',
                centerName: 'center',
                maskColor: '',

                contentOption: 'contentOption',
                contentTitle: 'contentTitle',
                heatCount: 'heatCount',
                heatMax: 'heatMax',
                labelStyle: 'labelStyle',
                labelTitle: 'labelTitle',
                circleRadius: 'radius',
                pointSize: 'size',
                squareLength: 'length',
                fillColor: 'fillColor',
                isStroke: 'isStroke',
                isFill: 'isFill',
                markerIcon: 'markerIcon',
                markerLabel: 'markerLabel',
                markerEnableDragging: 'markerEnableDragging',
                markerAnimation: 'markerAnimation'
            };

            BaidumapCtrl = function (_MetricsPanelCtrl) {
                _inherits(BaidumapCtrl, _MetricsPanelCtrl);

                function BaidumapCtrl($scope, $injector, contextSrv) {
                    _classCallCheck(this, BaidumapCtrl);

                    var _this = _possibleConstructorReturn(this, (BaidumapCtrl.__proto__ || Object.getPrototypeOf(BaidumapCtrl)).call(this, $scope, $injector));

                    _this.setMapProvider(contextSrv);
                    _.defaults(_this.panel, panelDefaults);

                    _this.dataFormatter = new DataFormatter(_this, kbn);
                    _this.markers = [];
                    _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
                    _this.events.on('data-received', _this.onDataReceived.bind(_this));
                    _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));
                    _this.events.on('data-snapshot-load', _this.onDataSnapshotLoad.bind(_this));
                    // this.loadLocationDataFromFile();
                    return _this;
                }

                _createClass(BaidumapCtrl, [{
                    key: 'getPoiTypeOption',
                    value: function getPoiTypeOption(poiType) {
                        return this.getPoiOption(poiType, null);
                    }
                }, {
                    key: 'getPoiOption',
                    value: function getPoiOption(poiType, poiConfig) {
                        var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

                        var configName = 'option';
                        var typeOption = this.getPoiTypeConfig(poiType, configName, {});
                        var poiOption = this.getPoiConfig(poiType, poiConfig, configName, {});
                        return Object.assign(defaultValue, typeOption, poiOption);
                    }
                }, {
                    key: 'getPoiTypeConfig',
                    value: function getPoiTypeConfig(poiType, configName) {
                        var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                        return this.getPoiConfig(poiType, null, configName, defaultValue);
                    }
                }, {
                    key: 'getPoiContent',
                    value: function getPoiContent(poiType, poiItem) {
                        var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                        var contentName = this.panel.contentName;
                        return this.getPoiConfig(poiType, poiItem, contentName, defaultValue);
                    }
                }, {
                    key: 'getPoiConfig',
                    value: function getPoiConfig(poiType, poiItem, configKey) {
                        var defaultValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

                        if (!poiType) {
                            return defaultValue;
                        }
                        if (poiItem && configKey in poiItem) {
                            return poiItem[configKey];
                        }
                        var configName = this.panel.configName;
                        if (poiItem && configName in poiItem && poiItem[configName].length > 0) {
                            var extJson = JSON.parse(poiItem[configName]);
                            if (configKey in extJson) {
                                return extJson[configKey];
                            }
                        }
                        if (this.panel.globalConfig && this.panel.globalConfig.length > 0) {
                            var globalConfig = JSON.parse(this.panel.globalConfig);
                            if (poiType in globalConfig && configKey in globalConfig[poiType]) {
                                return globalConfig[poiType][configKey];
                            }
                        }
                        return defaultValue;
                    }
                }, {
                    key: 'setMapProvider',
                    value: function setMapProvider(contextSrv) {
                        //    this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
                        this.tileServer = 'CartoDB Positron';
                        this.setMapSaturationClass();
                    }
                }, {
                    key: 'setMapSaturationClass',
                    value: function setMapSaturationClass() {
                        if (this.tileServer === 'CartoDB Dark') {
                            this.saturationClass = 'map-darken';
                        } else {
                            this.saturationClass = '';
                        }
                    }
                }, {
                    key: 'loadLocationDataFromFile',
                    value: function loadLocationDataFromFile(reload) {
                        if (this.map && !reload) return;

                        if (this.panel.snapshotLocationData) {
                            this.locations = this.panel.snapshotLocationData;
                            return;
                        }

                        if (this.panel.locationData === 'jsonp endpoint') {} else if (this.panel.locationData === 'json endpoint') {
                            if (!this.panel.jsonUrl) return;
                        } else if (this.panel.locationData === 'table') {
                            // .. Do nothing

                        } else if (this.panel.locationData !== 'geohash' && this.panel.locationData !== 'json result') {}
                    }
                }, {
                    key: 'reloadLocations',
                    value: function reloadLocations(res) {
                        this.locations = res;
                        this.refresh();
                    }
                }, {
                    key: 'onPanelTeardown',
                    value: function onPanelTeardown() {
                        if (this.map) delete this.map;
                    }
                }, {
                    key: 'onInitEditMode',
                    value: function onInitEditMode() {
                        this.addEditorTab('Baidumap', 'public/plugins/grafana-baidumap-panel/partials/editor.html', 2);
                    }
                }, {
                    key: 'onDataReceived',
                    value: function onDataReceived(dataList) {
                        if (!dataList) return;
                        if (this.dashboard.snapshot && this.locations) {
                            this.panel.snapshotLocationData = this.locations;
                        }

                        var data = [];
                        if (this.panel.locationData === 'geohash') {
                            this.dataFormatter.setGeohashValues(dataList, data);
                        } else if (this.panel.locationData === 'table') {
                            var tableData = dataList.map(DataFormatter.tableHandler.bind(this));
                            this.dataFormatter.setTableValues(tableData, data);
                        } else if (this.panel.locationData === 'json result') {
                            var _tableData = dataList.map(DataFormatter.tableHandlers.bind(this));
                            this.dataFormatter.setTableValues(_tableData, data);
                        } else {
                            var _tableData2 = dataList.map(DataFormatter.tableHandler.bind(this));
                            this.dataFormatter.setTableValues(_tableData2, data);
                        }
                        // const datas = this.filterEmptyAndZeroValues(data);

                        var datas = data;
                        if (_typeof(this.data) === 'object') this.data.splice(0, this.data.length);
                        this.markers.splice(0, this.markers.length);
                        if (datas.length) {
                            this.data = datas;
                            this.map ? this.addNode(this.BMap) : this.render();
                        } else {
                            if (this.map) this.map.clearOverlays();
                            this.render();
                        }
                    }
                }, {
                    key: 'getPoiInfoWindowHandler',
                    value: function getPoiInfoWindowHandler(poiType, point, poiItem) {
                        var defaultContent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

                        var that = this;
                        return function (e) {
                            var clickPoint = point;
                            if (!clickPoint) {
                                clickPoint = e.point;
                            }
                            var poiContent = that.getPoiContent(poiType, poiItem, defaultContent);
                            if (!poiContent) {
                                return;
                            }
                            var infoWindow = new BMap.InfoWindow(poiContent, that.getPoiConfig(poiType, poiItem, that.panel.contentOption, {
                                'title': that.getPoiConfig(poiType, poiItem, that.panel.contentTitle, clickPoint.lng + '|' + clickPoint.lat)
                            })); // 创建信息窗口对象
                            that.map.openInfoWindow(infoWindow, clickPoint);
                        };
                    }
                }, {
                    key: 'addMarker',
                    value: function addMarker(poiType, point, BMap, data) {

                        // public/plugins/grafana-baidumap-panel/images/bike.png
                        var markerOption = this.getPoiOption(poiType, data);
                        var iconUrl = this.getPoiConfig(poiType, data, this.panel.markerIcon, '');
                        if (Number.isInteger(iconUrl)) {
                            markerOption.icon = new BMap.Icon('http://api.map.baidu.com/img/markers.png', new BMap.Size(23, 25), {
                                offset: new BMap.Size(10, 25), // 指定定位位置
                                imageOffset: new BMap.Size(0, 25 * (10 - iconUrl % 10) - 10 * 25) // 设置图片偏移
                            });
                        } else if (iconUrl.length > 0) {
                            markerOption.icon = new BMap.Icon(iconUrl, new window.BMap.Size(24, 28), {
                                imageSize: new window.BMap.Size(24, 28),
                                anchor: new window.BMap.Size(12, 28)
                            });
                        }
                        var marker = new BMap.Marker(point, markerOption);
                        var pointLabel = this.getPoiConfig(poiType, data, this.panel.markerLabel, '');
                        if (pointLabel.length > 0) {
                            var label = new BMap.Label(pointLabel, { offset: new BMap.Size(20, -10) });
                            marker.setLabel(label);
                        }
                        this.markers.push(marker);

                        // this.map.setViewport(pointArray);
                        if (this.getPoiConfig(poiType, data, this.panel.markerEnableDragging, false)) {
                            marker.enableDragging();
                        }
                        marker.addEventListener('click', this.getPoiInfoWindowHandler(poiType, point, data));

                        this.map.addOverlay(marker);
                        if (this.getPoiConfig(poiType, data, this.panel.markerAnimation, false)) {
                            marker.setAnimation(BMAP_ANIMATION_BOUNCE); // 跳动的动画
                        }
                        marker.addEventListener('dragend', function (e) {
                            alert('当前位置：' + e.point.lng + ', ' + e.point.lat);
                        });
                    }
                }, {
                    key: 'addNode',
                    value: function addNode(BMap) {
                        var that = this;
                        var poiList = this.data;
                        this.map.clearOverlays();
                        this.clickHandler = [];
                        console.log(poiList);
                        if (poiList) {
                            (function () {
                                var getMapSourceId = function getMapSourceId() {
                                    var sourceGps = that.panel.gpsType;
                                    var sourceGpsId = 5;
                                    if (sourceGps === 'WGS84') {
                                        sourceGpsId = 1;
                                    } else if (sourceGps === 'GCJ02') {
                                        sourceGpsId = 3;
                                    }
                                    return sourceGpsId;
                                };

                                var translateOne = function translateOne(poiIndex, gpsIndex, gps) {
                                    rawLength += 1;
                                    // 转换坐标
                                    var sourceGpsId = getMapSourceId();
                                    if (sourceGpsId === 5) {
                                        setTimeout(function () {
                                            translateCallback(poiIndex, gpsIndex, gps, { lng: gps.lng, lat: gps.lat });
                                        }, 1);
                                    } else {
                                        var point = new BMap.Point(gps.lng, gps.lat);
                                        sourcePointList.push(point);
                                        callbackList.push(translateCallback.bind(this, poiIndex, gpsIndex, gps));
                                    }
                                };

                                var translateCallback = function translateCallback(myPoiIndex, myGpsIndex, myGps, translatedData) {
                                    var lng = translatedData.lng,
                                        lat = translatedData.lat;

                                    translatedItems.push({
                                        poiIndex: myPoiIndex,
                                        gpsIndex: myGpsIndex,
                                        point: new BMap.Point(lng, lat),
                                        gps: myGps
                                    });

                                    if (translatedItems.length === rawLength) {
                                        translatedItems.sort(function (a, b) {
                                            return (a.poiIndex - b.poiIndex) * 1000000 + (a.gpsIndex - b.gpsIndex);
                                        });
                                        for (var translateIndex = 0; translateIndex < translatedItems.length; translateIndex++) {
                                            var _pointTypeName = that.panel.pointName;

                                            var translatedItem = translatedItems[translateIndex];
                                            var poiType = translatedItem.gps[that.panel.typeName] || _pointTypeName;

                                            var poiIndexKey = 'key_' + translatedItem.poiIndex;
                                            var pointItem = translatedItem.point;
                                            if (!(poiType in shapeMap)) {
                                                shapeMap[poiType] = [];
                                            }
                                            var shapeList = shapeMap[poiType];
                                            if (shapeList.length > 0 && shapeList[shapeList.length - 1].poiIndexKey === poiIndexKey) {
                                                shapeList[shapeList.length - 1].points.push(pointItem);
                                            } else {
                                                shapeList.push({
                                                    poiIndexKey: poiIndexKey,
                                                    poiType: poiType,
                                                    poiData: translatedItem.gps,
                                                    points: [pointItem]
                                                });
                                            }
                                        }
                                        console.log('shapeMap', shapeMap);

                                        var pointTypeName = 'Point';
                                        if (shapeMap[pointTypeName]) {
                                            var pointArray = shapeMap[pointTypeName];
                                            var points = [];
                                            pointArray.forEach(function (v) {
                                                v.points.forEach(function (point) {
                                                    point.poiData = v.poiData;
                                                    points.push(point);
                                                });
                                            });
                                            var pointCollection = new BMap.PointCollection(points, getFilterColor(that.getPoiTypeOption(pointTypeName)));
                                            pointCollection.addEventListener('click', function (e) {
                                                var poiData = e.point.poiData;
                                                delete e.point[poiData];
                                                that.getPoiInfoWindowHandler(pointTypeName, e.point, poiData)(e);
                                            });
                                            that.map.addOverlay(pointCollection);
                                        }

                                        var heatPoiType = that.panel.bdHeatRouteName;
                                        if (shapeMap[heatPoiType]) {
                                            var heatShapeList = shapeMap[heatPoiType];
                                            var heatmapOverlay = new BMapLib.HeatmapOverlay(Object.assign({
                                                radius: 20
                                            }, that.getPoiTypeOption(heatPoiType)));
                                            that.map.addOverlay(heatmapOverlay);
                                            var dataList = [];
                                            heatShapeList.forEach(function (v) {
                                                v.points.forEach(function (point) {
                                                    dataList.push({
                                                        lng: point.lng,
                                                        lat: point.lat,
                                                        count: that.getPoiConfig(heatPoiType, v.poiData, that.panel.heatCount, 1)
                                                    });
                                                });
                                            });
                                            heatmapOverlay.setDataSet({
                                                data: dataList,
                                                max: that.getPoiTypeConfig(heatPoiType, that.panel.heatMax, 100)
                                            });
                                        }

                                        var labelTypeName = that.panel.bdLabelName;
                                        if (shapeMap[labelTypeName]) {
                                            var labelArray = shapeMap[labelTypeName];
                                            labelArray.forEach(function (v) {
                                                v.points.forEach(function (point) {
                                                    var labelText = that.getPoiContent(labelTypeName, v.poiData);
                                                    var labelItem = new BMap.Label(labelText, {
                                                        position: point,
                                                        enableMassClear: true
                                                    });
                                                    that.map.addOverlay(labelItem);
                                                    labelItem.setStyle(that.getPoiConfig(labelTypeName, v.poiData, that.panel.labelStyle, {}));
                                                    labelItem.setTitle(that.getPoiConfig(labelTypeName, v.poiData, that.panel.labelTitle, ''));
                                                    labelItem.addEventListener('click', that.getPoiInfoWindowHandler(labelTypeName, point, v.poiData));
                                                    // that.addlabel(labelTypeName, label, BMap, v.poiData);
                                                });
                                            });
                                        }
                                        var markerTypeName = that.panel.bdMarkerName;
                                        if (shapeMap[markerTypeName]) {
                                            var markerArray = shapeMap[markerTypeName];
                                            markerArray.forEach(function (v) {
                                                v.points.forEach(function (point) {
                                                    that.addMarker(markerTypeName, point, BMap, v.poiData);
                                                });
                                            });
                                            if (that.panel.clusterPoint) {
                                                new BMapLib.MarkerClusterer(that.map, {
                                                    markers: that.markers
                                                });
                                            }
                                        }

                                        [that.panel.bdRidingRouteName, that.panel.bdDrivingRouteName, that.panel.bdWalkingRouteName].forEach(function (poiType) {
                                            if (poiType in shapeMap) {
                                                var poiTypeMap = {};
                                                poiTypeMap[that.panel.bdRidingRouteName] = 'RidingRoute';
                                                poiTypeMap[that.panel.bdDrivingRouteName] = 'DrivingRoute';
                                                poiTypeMap[that.panel.bdWalkingRouteName] = 'WalkingRoute';
                                                shapeMap[poiType].forEach(function (item) {
                                                    var points = item.points;
                                                    for (var pointIndex = 0; pointIndex < points.length - 1; pointIndex++) {
                                                        var driving = new BMap[poiTypeMap[poiType]](that.map, {
                                                            renderOptions: {
                                                                map: that.map,
                                                                autoViewport: false
                                                            }
                                                        });
                                                        driving.search(points[pointIndex], points[pointIndex + 1]);
                                                    }
                                                });
                                            }
                                        });
                                        var lastCenterPoint = that.centerPoint;
                                        var centerPointCount = 0,
                                            centerPointLngTotal = 0,
                                            centerPointLatTotal = 0;

                                        [that.panel.centerName].forEach(function (poiType) {
                                            if (poiType in shapeMap) {
                                                shapeMap[poiType].forEach(function (item) {
                                                    item.points.forEach(function (point) {
                                                        centerPointCount += 1;
                                                        centerPointLngTotal += point.lng;
                                                        centerPointLatTotal += point.lat;
                                                    });
                                                });
                                            }
                                        });
                                        if (centerPointCount > 0) {
                                            that.centerPoint = new BMap.Point(centerPointLngTotal / centerPointCount, centerPointLatTotal / centerPointCount);
                                        } else {
                                            that.centerPoint = new BMap.Point(that.panel.lng, that.panel.lat);
                                        }
                                        if (that.panel.autoFocusCenterDistance >= 0 && (!lastCenterPoint || that.map.getDistance(lastCenterPoint, that.centerPoint) > that.panel.autoFocusCenterDistance)) {
                                            that.panToCenterPoint();
                                        }
                                        [that.panel.bdPolylineName, that.panel.bdPolygonName, that.panel.bdCircleName].forEach(function (poiType) {
                                            if (shapeMap[poiType]) {
                                                var poiTypeMap = {};
                                                poiTypeMap[that.panel.bdPolylineName] = 'Polyline';
                                                poiTypeMap[that.panel.bdPolygonName] = 'Polygon';
                                                poiTypeMap[that.panel.bdCircleName] = 'Circle';
                                                shapeMap[poiType].forEach(function (item) {
                                                    var poiOption = Object.assign(getDefaultPolyOption(), getFilterColor(that.getPoiOption(item.poiType, item.poiData)));
                                                    var circleRadius = that.getPoiConfig(item.poiType, item.poiData, that.panel.circleRadius, 20);
                                                    if (poiType === that.panel.bdCircleName) {
                                                        item.points.forEach(function (point) {
                                                            var shape = new BMap[poiTypeMap[poiType]](point, circleRadius, poiOption);
                                                            that.map.addOverlay(shape);
                                                            shape.addEventListener('click', that.getPoiInfoWindowHandler(poiType, point, item.poiData));
                                                        });
                                                    } else {
                                                        var shape = new BMap[poiTypeMap[poiType]](item.points, poiOption);
                                                        that.map.addOverlay(shape);
                                                        shape.addEventListener('click', that.getPoiInfoWindowHandler(poiType, null, item.poiData));
                                                    }
                                                });
                                            }
                                        });
                                        var labelPoiTypes = [that.panel.labelName];
                                        var linePoiTypes = [that.panel.polygonName, that.panel.polylineName];
                                        var dotPoiTypes = [that.panel.squareName, that.panel.circleName, that.panel.pointName];
                                        var canvasTypes = [].concat(labelPoiTypes, dotPoiTypes, linePoiTypes);

                                        var canvasLayerUpdater = function canvasLayerUpdater(canvasLayer) {
                                            var ctx = canvasLayer.canvas.getContext('2d');
                                            if (!ctx) {
                                                return [];
                                            }
                                            var matchItems = [];
                                            ctx.save();
                                            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                            if (that.panel.maskColor) {
                                                ctx.beginPath();
                                                ctx.fillStyle = that.panel.maskColor;
                                                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                                ctx.closePath();
                                            }
                                            ctx.restore();
                                            linePoiTypes.forEach(function (poiType) {
                                                if (shapeMap[poiType]) {
                                                    shapeMap[poiType].forEach(function (item) {
                                                        ctx.save();
                                                        ctx.beginPath();
                                                        var poiOption = that.getPoiOption(poiType, item.poiData);
                                                        filterCtx(ctx, poiOption);
                                                        var startPoint = that.map.pointToPixel(item.points[0]);
                                                        ctx.moveTo(startPoint.x, startPoint.y);
                                                        for (var pointIndex = 1; pointIndex < item.points.length; pointIndex++) {
                                                            var linePoint = that.map.pointToPixel(item.points[pointIndex]);
                                                            ctx.lineTo(linePoint.x, linePoint.y);
                                                        }
                                                        if (poiType === that.panel.polylineName) {
                                                            ctx.stroke();
                                                        } else if (poiType === that.panel.polygonName) {
                                                            ctx.closePath();
                                                            if (that.getPoiConfig(poiType, item.poiData, that.panel.isStroke, true)) {
                                                                ctx.stroke();
                                                            }
                                                            if (poiOption.fillOpacity) {
                                                                ctx.globalAlpha = poiOption.fillOpacity;
                                                            }
                                                            if (that.getPoiConfig(poiType, item.poiData, that.panel.isFill, true)) {
                                                                ctx.fill();
                                                            }
                                                        }
                                                        ctx.restore();
                                                    });
                                                }
                                            });
                                            dotPoiTypes.forEach(function (poiType) {
                                                if (shapeMap[poiType]) {
                                                    shapeMap[poiType].forEach(function (item) {
                                                        item.points.forEach(function (point) {
                                                            ctx.save();
                                                            var isCircle = poiType === that.panel.circleName;
                                                            var isPoint = poiType === that.panel.pointName;
                                                            var layerItem = {
                                                                lng: point.lng,
                                                                lat: point.lat,
                                                                size: that.getPoiConfig(poiType, item.poiData, isCircle ? that.panel.circleRadius : isPoint ? that.panel.pointSize : that.panel.squareLength, isCircle ? 10 : isPoint ? 5 : 20)
                                                            };
                                                            ctx.beginPath();
                                                            filterCtx(ctx, that.getPoiOption(poiType, item.poiData, isPoint ? {
                                                                'fillColor': getColor(that.getPoiConfig(poiType, item.poiData, that.panel.fillColor, 'blue'), 0.4)
                                                            } : {}));
                                                            var posRect = getDotRect(that.map, parseFloat(layerItem.lng), parseFloat(layerItem.lat), layerItem.size, !isCircle);
                                                            if (isPoint) {
                                                                ctx.arc(posRect.x, posRect.y, layerItem.size, 0, 2 * Math.PI);
                                                            } else if (isCircle) {
                                                                ctx.arc(posRect.x, posRect.y, posRect.w, 0, 2 * Math.PI);
                                                            } else {
                                                                ctx.rect(posRect.x, posRect.y, posRect.w, posRect.h);
                                                            }
                                                            ctx.closePath();
                                                            if (!isPoint) {
                                                                if (that.getPoiConfig(poiType, item.poiData, that.panel.isStroke, true)) {
                                                                    ctx.stroke();
                                                                }
                                                            }
                                                            if (that.getPoiConfig(poiType, item.poiData, that.panel.isFill, true)) {
                                                                ctx.fill();
                                                            }
                                                            ctx.restore();
                                                        });
                                                    });
                                                }
                                            });
                                            labelPoiTypes.forEach(function (poiType) {
                                                if (shapeMap[poiType]) {
                                                    shapeMap[poiType].forEach(function (item) {
                                                        ctx.save();
                                                        ctx.beginPath();
                                                        var labelText = that.getPoiContent(poiType, item.poiData);
                                                        var poiOption = that.getPoiOption(poiType, item.poiData);
                                                        filterCtx(ctx, poiOption, false);
                                                        for (var pointIndex = 0; pointIndex < item.points.length; pointIndex++) {
                                                            ctx.beginPath();
                                                            var labelPoint = that.map.pointToPixel(item.points[pointIndex]);
                                                            ctx.fillText(labelText, labelPoint.x, labelPoint.y);
                                                        }
                                                        ctx.restore();
                                                    });
                                                }
                                            });
                                            return matchItems;
                                        };

                                        var canvasLayerPointChecker = function canvasLayerPointChecker(checkPoint) {
                                            var checkPixel = that.map.pointToPixel(checkPoint);
                                            var matchItems = [];
                                            dotPoiTypes.reverse().forEach(function (poiType) {
                                                if (shapeMap[poiType]) {
                                                    shapeMap[poiType].forEach(function (item) {
                                                        item.points.forEach(function (point) {
                                                            var isCircle = poiType === that.panel.circleName;
                                                            var isPoint = poiType === that.panel.pointName;
                                                            var layerItem = {
                                                                lng: point.lng,
                                                                lat: point.lat,
                                                                size: that.getPoiConfig(poiType, item.poiData, isCircle ? that.panel.circleRadius : isPoint ? that.panel.pointSize : that.panel.squareLength, isCircle ? 10 : isPoint ? 5 : 20)
                                                            };
                                                            var posRect = getDotRect(that.map, parseFloat(layerItem.lng), parseFloat(layerItem.lat), layerItem.size, !isCircle);
                                                            if (isPoint) {
                                                                if (isPointInCircle(checkPixel, posRect, layerItem.size)) {
                                                                    matchItems.push([checkPoint, poiType, item.poiData, point]);
                                                                }
                                                            } else if (isCircle) {
                                                                if (isPointInCircle(checkPixel, posRect, posRect.w)) {
                                                                    matchItems.push([checkPoint, poiType, item.poiData, point]);
                                                                }
                                                            } else if (isPointInRect(checkPixel, posRect)) {
                                                                matchItems.push([checkPoint, poiType, item.poiData, point]);
                                                            }
                                                        });
                                                    });
                                                }
                                            });
                                            linePoiTypes.reverse().forEach(function (poiType) {
                                                if (shapeMap[poiType]) {
                                                    shapeMap[poiType].forEach(function (item) {
                                                        if (poiType === that.panel.polygonName && isPointInPoly(checkPixel, item.points.map(function (p) {
                                                            return that.map.pointToPixel(p);
                                                        }))) {
                                                            matchItems.push([checkPoint, poiType, item.poiData, item.points]);
                                                        }
                                                    });
                                                }
                                            });
                                            return matchItems;
                                        };

                                        if (canvasTypes.some(function (canvasType) {
                                            return shapeMap[canvasType];
                                        }) || that.panel.maskColor) {
                                            var canvasLayer = new BMap.CanvasLayer({
                                                paneName: 'mapPane',
                                                zIndex: -999,
                                                update: function update() {
                                                    canvasLayerUpdater(this);
                                                }
                                            });
                                            that.map.addOverlay(canvasLayer);
                                            that.clickHandler.push(function (event) {
                                                var matchItems = canvasLayerPointChecker(event.point);
                                                matchItems = matchItems.filter(function (matchItem) {
                                                    return that.getPoiContent(matchItem[1], matchItem[2]);
                                                });
                                                if (matchItems.length > 0) {
                                                    var matchItem = matchItems[0];
                                                    that.getPoiInfoWindowHandler(matchItem[1], event.point, matchItem[2])(event);
                                                }
                                            });
                                        }
                                    }
                                };

                                var shapeMap = [];
                                var sourcePointList = [];
                                var callbackList = [];

                                var rawLength = 0;
                                var translatedItems = [];

                                var _loop = function _loop(i) {
                                    var poiIndex = i;
                                    setTimeout(function () {
                                        if (poiList[poiIndex] && poiList[poiIndex][that.panel.lngName] && poiList[poiIndex][that.panel.latName] && poiList[poiIndex][that.panel.lngName] > 0 && poiList[poiIndex][that.panel.latName] > 0) {
                                            var gpsItem = Object.assign({}, poiList[poiIndex]);
                                            gpsItem.lng = parseFloat(poiList[poiIndex][that.panel.lngName]);
                                            gpsItem.lat = parseFloat(poiList[poiIndex][that.panel.latName]);
                                            translateOne(poiIndex, 0, gpsItem, BMap);
                                        } else if (poiList[poiIndex][that.panel.geohashName] && poiList[poiIndex][that.panel.geohashName].length > 0) {
                                            var _decodeGeoHash = decodeGeoHash(poiList[poiIndex][that.panel.geohashName]),
                                                lng = _decodeGeoHash.longitude,
                                                lat = _decodeGeoHash.latitude;

                                            var _gpsItem = Object.assign({}, poiList[poiIndex], { lng: lng, lat: lat });
                                            translateOne(poiIndex, 0, _gpsItem, BMap);
                                        } else if (poiList[poiIndex][that.panel.posName] && poiList[poiIndex][that.panel.posName].length > 0) {
                                            var gpsList = poiList[poiIndex][that.panel.posName].split(';');
                                            for (var gpsIndex = 0; gpsIndex < gpsList.length; gpsIndex++) {
                                                var gpsStr = gpsList[gpsIndex];
                                                var items = gpsStr.split('|');
                                                if (items.length === 1) {
                                                    items = gpsStr.split(',');
                                                }

                                                var _items = items,
                                                    _items2 = _slicedToArray(_items, 2),
                                                    _lng = _items2[0],
                                                    _lat = _items2[1];

                                                var _gpsItem2 = Object.assign({}, poiList[poiIndex]);
                                                _gpsItem2.lng = parseFloat(_lng.trim());
                                                _gpsItem2.lat = parseFloat(_lat.trim());
                                                translateOne(poiIndex, gpsIndex, _gpsItem2, BMap);
                                            }
                                        }
                                        if (sourcePointList.length > 0) {
                                            var convertor = new BMap.Convertor();
                                            var groupSize = 10;

                                            var _loop2 = function _loop2(groupIndex) {
                                                var pointList = [];
                                                for (var pointIndex = 0; pointIndex < groupSize && pointIndex + groupIndex < sourcePointList.length; pointIndex++) {
                                                    pointList.push(sourcePointList[groupIndex + pointIndex]);
                                                }
                                                convertor.translate(pointList, getMapSourceId(), 5, function (result) {
                                                    if (result.status === 0) {
                                                        for (var index = 0; index < result.points.length; index++) {
                                                            callbackList[groupIndex + index](result.points[index]);
                                                        }
                                                    } else {
                                                        console.error('gps translate error', pointList);
                                                    }
                                                });
                                            };

                                            for (var groupIndex = 0; groupIndex < sourcePointList.length; groupIndex += groupSize) {
                                                _loop2(groupIndex);
                                            }
                                        }
                                    }, 10);
                                };

                                for (var i = 0; i < poiList.length; i++) {
                                    _loop(i);
                                }
                            })();
                        }
                    }
                }, {
                    key: 'panToCenterPoint',
                    value: function panToCenterPoint() {
                        if (this.centerPoint) {
                            this.map.panTo(this.centerPoint);
                        }
                    }
                }, {
                    key: 'filterEmptyAndZeroValues',
                    value: function filterEmptyAndZeroValues(data) {
                        var _this2 = this;

                        return _.filter(data, function (o) {
                            return !(_this2.panel.hideEmpty && _.isNil(o.value)) && !(_this2.panel.hideZero && o.value === 0);
                        });
                    }
                }, {
                    key: 'onDataSnapshotLoad',
                    value: function onDataSnapshotLoad(snapshotData) {
                        this.onDataReceived(snapshotData);
                    }
                }, {
                    key: 'seriesHandler',
                    value: function seriesHandler(seriesData) {
                        var series = new TimeSeries({
                            datapoints: seriesData.datapoints,
                            alias: seriesData.target
                        });

                        series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
                        return series;
                    }
                }, {
                    key: 'setNewMapCenter',
                    value: function setNewMapCenter() {
                        this.render();
                    }
                }, {
                    key: 'setZoom',
                    value: function setZoom() {
                        this.map.setZoom(parseInt(this.panel.initialZoom, 10) || 1);
                    }
                }, {
                    key: 'setStyle',
                    value: function setStyle() {
                        this.map.setMapStyle({ style: this.panel.theme });
                    }
                }, {
                    key: 'setAK',
                    value: function setAK() {
                        var x = document.body;
                        var s = document.getElementsByTagName('script');
                        var len = s.length;
                        x.removeChild(s[len - 1]);
                        delete this.map;
                        this.render();
                    }
                }, {
                    key: 'navigationControl',
                    value: function navigationControl() {
                        if (this.panel.navigation == true) {
                            this.map.addControl(this.navigationSwitch);
                        } else {
                            this.map.removeControl(this.navigationSwitch);
                        }
                    }
                }, {
                    key: 'scaleControl',
                    value: function scaleControl() {
                        if (this.panel.scale == true) {
                            this.map.addControl(this.scaleSwitch);
                        } else {
                            this.map.removeControl(this.scaleSwitch);
                        }
                    }
                }, {
                    key: 'overviewMapControl',
                    value: function overviewMapControl() {
                        if (this.panel.overviewMap === true) {
                            this.map.addControl(this.overviewMapSwitch);
                        } else {
                            this.map.removeControl(this.overviewMapSwitch);
                        }
                    }
                }, {
                    key: 'mapTypeControl',
                    value: function mapTypeControl() {
                        if (this.panel.mapType === true) {
                            this.map.addControl(this.mapTypeSwitch);
                        } else {
                            this.map.removeControl(this.mapTypeSwitch);
                        }
                    }
                }, {
                    key: 'trafficControl',
                    value: function trafficControl() {
                        if (this.panel.traffic === true) {
                            this.map.addControl(this.trafficSwitch);
                        } else {
                            this.map.removeControl(this.trafficSwitch);
                        }
                    }
                }, {
                    key: 'resize',
                    value: function resize() {}
                }, {
                    key: 'toggleStickyLabels',
                    value: function toggleStickyLabels() {
                        console.log(this.panel.stickyLabels);
                    }
                }, {
                    key: 'changeLocationData',
                    value: function changeLocationData() {
                        if (this.panel.locationData === 'geohash') {
                            this.render();
                        }
                    }
                }, {
                    key: 'link',
                    value: function link(scope, elem, attrs, ctrl) {
                        mapRenderer(scope, elem, attrs, ctrl);
                    }
                }]);

                return BaidumapCtrl;
            }(MetricsPanelCtrl);

            _export('default', BaidumapCtrl);

            BaidumapCtrl.templateUrl = 'module.html';
        }
    };
});
//# sourceMappingURL=baidumap_ctrl.js.map
