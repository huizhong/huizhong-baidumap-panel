'use strict';

System.register(['app/plugins/sdk', 'app/core/time_series2', 'app/core/utils/kbn', 'lodash', './map_renderer', './data_formatter', './geohash'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, TimeSeries, kbn, _, mapRenderer, DataFormatter, decodeGeoHash, _slicedToArray, _typeof, _createClass, panelDefaults, BaidumapCtrl;

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

            panelDefaults = {
                ak: 'QKCqsdHBbGxBnNbvUwWdUEBjonk7jUj6',
                maxDataPoints: 1,
                theme: 'normal',
                lat: 39.968539,
                lng: 116.497856,
                initialZoom: 14,
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
                typeName: 'type',
                lngName: 'longitude',
                latName: 'latitude',
                posName: 'pos',
                geohashName: 'geohash',
                extName: 'config'
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
                        return this.getPoiOption(poiType, null, {});
                    }
                }, {
                    key: 'getPoiOption',
                    value: function getPoiOption(poiType, poiConfig) {
                        var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                        var configName = 'option';
                        var typeOption = this.getPoiTypeExt(poiType, configName, defaultValue);
                        var poiOption = this.getPoiExt(poiType, poiConfig, configName, defaultValue);
                        return Object.assign({}, typeOption, poiOption);
                    }
                }, {
                    key: 'getPoiTypeExt',
                    value: function getPoiTypeExt(poiType, configName) {
                        var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                        return this.getPoiExt(poiType, null, configName, defaultValue);
                    }
                }, {
                    key: 'getPoiExt',
                    value: function getPoiExt(poiType, poiConfig, configName) {
                        var defaultValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

                        var extName = this.panel.extName;
                        if (poiConfig && extName in poiConfig && poiConfig[extName].length > 0) {
                            var extJson = JSON.parse(poiConfig[extName]);
                            if (configName in extJson) {
                                return extJson[configName];
                            }
                        }
                        if (this.panel.globalConfig && this.panel.globalConfig.length > 0) {
                            var globalConfig = JSON.parse(this.panel.globalConfig);
                            if (poiType in globalConfig && configName in globalConfig[poiType]) {
                                return globalConfig[poiType][configName];
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
                    key: 'addMarker',
                    value: function addMarker(point, BMap, data) {
                        // public/plugins/grafana-baidumap-panel/images/bike.png
                        var poiType = 'marker';
                        var markerOption = this.getPoiOption(poiType, data, {});
                        var iconUrl = this.getPoiExt(poiType, data, 'icon', '');
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
                        var pointLabel = this.getPoiExt(poiType, data, 'label', '');
                        if (pointLabel.length > 0) {
                            var label = new BMap.Label(pointLabel, { offset: new BMap.Size(20, -10) });
                            marker.setLabel(label);
                        }
                        this.markers.push(marker);

                        // this.map.setViewport(pointArray);
                        if (this.getPoiExt(poiType, data, 'enableDragging', false)) {
                            marker.enableDragging();
                        }
                        var scontent = '';
                        scontent += '<a href=""><div class="infobox" id="infobox"><div class="infobox-content" style="display:block">';

                        var detailImage = this.getPoiExt(poiType, data, 'detailIcon', '');
                        if (detailImage.length > 0) {
                            scontent += '<div class="infobox-header"><div class="infobox-header-icon"><img src="' + detailImage + '"></div>';
                        }
                        scontent += '<div class="infobox-header-name"><p>' + this.getPoiExt(poiType, data, 'name') + '</p></div>';
                        scontent += '<div class="infobox-header-type" style="min-width:250px"><p>' + this.getPoiExt(poiType, data, 'type') + '</p></div></div>';
                        scontent += '<div class="infobox-footer">' + this.getPoiExt(poiType, data, 'desc') + '</div>';
                        scontent += '<div class="infobox-footer-right"></div></div><div class="arrow"></div></div></a>';

                        var infoWindow = new BMap.InfoWindow(scontent); // 创建信息窗口对象
                        marker.addEventListener('click', function () {
                            this.map.openInfoWindow(infoWindow, point); // 开启信息窗口
                        });

                        this.map.addOverlay(marker);
                        if (this.getPoiExt(poiType, data, 'animation', false)) {
                            marker.setAnimation(BMAP_ANIMATION_BOUNCE); // 跳动的动画
                        }
                        marker.addEventListener('dragend', function (e) {
                            point = new BMap.Point(e.point.lng, e.point.lat);
                            alert('当前位置：' + e.point.lng + ', ' + e.point.lat);
                        });
                    }
                }, {
                    key: 'addNode',
                    value: function addNode(BMap) {
                        var that = this;
                        var poiList = this.data;
                        this.map.clearOverlays();
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
                                            var translatedItem = translatedItems[translateIndex];
                                            var poiType = translatedItem.gps[that.panel.typeName];
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
                                        var heatPoiType = 'heat';
                                        if (shapeMap[heatPoiType]) {
                                            var heatShapeList = shapeMap.heat;
                                            var heatmapOverlay = new BMapLib.HeatmapOverlay(Object.assign({
                                                radius: 20
                                            }, that.getPoiTypeOption('heat')));
                                            that.map.addOverlay(heatmapOverlay);
                                            heatmapOverlay.setDataSet({
                                                data: heatShapeList.map(function (v) {
                                                    return {
                                                        lng: v.points[0].lng,
                                                        lat: v.points[0].lat,
                                                        count: that.getPoiExt(heatPoiType, v.poiData, 'count', 1)
                                                    };
                                                }),
                                                max: that.getPoiTypeExt(heatPoiType, 'max', 100)
                                            });
                                        }
                                        var markerTypeName = 'marker';
                                        if (shapeMap[markerTypeName]) {
                                            var markerArray = shapeMap[markerTypeName];
                                            markerArray.forEach(function (v) {
                                                return that.addMarker(v.points[0], BMap, v.poiData);
                                            });
                                            if (that.panel.clusterPoint) {
                                                new BMapLib.MarkerClusterer(that.map, {
                                                    markers: that.markers
                                                });
                                            }
                                        }
                                        ['RidingRoute', 'DrivingRoute', 'WalkingRoute'].forEach(function (poiType) {
                                            if (poiType in shapeMap) {
                                                shapeMap[poiType].forEach(function (item) {
                                                    var points = item.points.map(function (v) {
                                                        return new BMap.Point(v.lng, v.lat);
                                                    });
                                                    var driving = new BMap[poiType](that.map, {
                                                        renderOptions: {
                                                            map: that.map,
                                                            autoViewport: false
                                                        }
                                                    });
                                                    driving.search(points[0], points.slice(-1)[0]);
                                                });
                                            }
                                        });

                                        ['Polyline', 'Polygon'].forEach(function (poiType) {
                                            if (shapeMap[poiType]) {
                                                shapeMap[poiType].forEach(function (item) {
                                                    var polyline = new BMap[poiType](item.points, Object.assign({
                                                        enableEditing: false,
                                                        enableClicking: true,
                                                        strokeWeight: 4,
                                                        strokeOpacity: 0.5,
                                                        strokeColor: 'blue'
                                                    }, that.getPoiOption(item.poiType, item.poiData, {})));
                                                    that.map.addOverlay(polyline);
                                                });
                                            }
                                        });
                                        if (shapeMap.pie || shapeMap.square) {
                                            that.map.addOverlay(new BMap.CanvasLayer({
                                                paneName: 'vertexPane',
                                                zIndex: -1,
                                                update: function update() {
                                                    var ctx = that.canvas.getContext('2d');
                                                    if (!ctx) {
                                                        return;
                                                    }
                                                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                                                    ctx.beginPath();
                                                    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                                    ['pie', 'square'].forEach(function (poiType) {
                                                        if (shapeMap[poiType]) {
                                                            shapeMap[poiType].forEach(function (item) {
                                                                var layerItem = {
                                                                    lng: item.points[0].lng,
                                                                    lat: item.points[0].lat,
                                                                    color: that.getPoiExt(poiType, item.poiData, 'color', 20),
                                                                    size: that.getPoiExt(poiType, item.poiData, 'size', 20)
                                                                };
                                                                ctx.fillStyle = getColor(layerItem.color, that.getPoiExt(poiType, null, 'alpha', 0.5));
                                                                var isPie = poiType === 'pie';
                                                                var posRect = getDotRect(that.map, parseFloat(layerItem.lng), parseFloat(layerItem.lat), layerItem.size, !isPie);
                                                                // console.log(posRect);
                                                                if (isPie) {
                                                                    ctx.ellipse(posRect.x, posRect.y, posRect.w, -posRect.h, 0, 0, 2 * Math.PI);
                                                                    ctx.fill();
                                                                    ctx.beginPath();
                                                                } else {
                                                                    ctx.fillRect(posRect.x, posRect.y, posRect.w, posRect.h);
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            }));
                                        }
                                    }
                                };

                                var shapeMap = [];
                                var layerArray = [];

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

                                                var _gpsStr$split = gpsStr.split('|'),
                                                    _gpsStr$split2 = _slicedToArray(_gpsStr$split, 2),
                                                    _lng = _gpsStr$split2[0],
                                                    _lat = _gpsStr$split2[1];

                                                var _gpsItem2 = Object.assign({}, poiList[poiIndex]);
                                                _gpsItem2.lng = parseFloat(_lng);
                                                _gpsItem2.lat = parseFloat(_lat);
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
