'use strict';

System.register(['app/plugins/sdk', 'app/core/time_series2', 'app/core/utils/kbn', 'lodash', './map_renderer', './data_formatter'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, TimeSeries, kbn, _, mapRenderer, DataFormatter, _slicedToArray, _typeof, _createClass, panelDefaults, BaidumapCtrl;

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
                mapType: true,
                clusterPoint: false,
                globalConfig: '',
                typeName: 'type',
                posName: 'pos',
                extName: 'ext'
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
                    key: 'getPoiOption',
                    value: function getPoiOption(poiType, poiConfig) {
                        var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                        var configName = 'option';
                        var poiOption = this.getPoiExt(poiType, poiConfig, configName, defaultValue);
                        var typeOption = this.getPoiExt(poiType, poiConfig, configName, defaultValue);
                        return Object.assign({}, typeOption, poiOption);
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
                        scontent += '<div class="infobox-header"><div class="infobox-header-icon"><img src="' + this.getPoiExt(poiType, data, 'detail-icon', 'public/plugins/grafana-baidumap-panel/images/bike.png') + '"></div>';
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
                            marker.setAnimation(BMAP_ANIMATION_BOUNCE); //跳动的动画
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
                                var translateOne = function translateOne(poiIndex, gpsIndex, gps, BMap) {
                                    rawLength += 1;

                                    function translateCallback(returnedData) {
                                        if (returnedData.status == 0) {
                                            translatedItems.push({
                                                poiIndex: poiIndex,
                                                gpsIndex: gpsIndex,
                                                point: returnedData.points[0],
                                                gps: gps
                                            });

                                            if (translatedItems.length == rawLength) {
                                                translatedItems.sort(function (a, b) {
                                                    return (a.poiIndex - b.poiIndex) * 1000000 + (a.gpsIndex - b.gpsIndex);
                                                });
                                                for (var translateIndex = 0; translateIndex < translatedItems.length; translateIndex++) {
                                                    var translatedItem = translatedItems[translateIndex];
                                                    var poiType = translatedItem.gps[that.panel.typeName];
                                                    var poiIndexKey = 'key_' + translatedItem.poiIndex;
                                                    if (poiType === 'heat') {
                                                        var heatPoint = {
                                                            lng: translatedItem.point.lng,
                                                            lat: translatedItem.point.lat,
                                                            count: that.getPoiExt(poiType, translatedItem.gps, 'count', 1)
                                                        };
                                                        heatArray.push(heatPoint);
                                                    } else if (poiType === 'line' || poiType === 'polygon') {
                                                        var pointItem = translatedItem.point;
                                                        if (poiIndexKey in lineMap) {
                                                            lineMap[poiIndexKey].points.push(pointItem);
                                                        } else {
                                                            var option = Object.assign({}, that.getPoiOption(poiType, translatedItem.gps, {}));
                                                            lineMap[poiIndexKey] = {
                                                                poiType: poiType,
                                                                option: option,
                                                                points: [pointItem]
                                                            };
                                                        }
                                                    } else if (poiType === 'pie' || poiType === 'block') {
                                                        var layerItem = {
                                                            lng: translatedItem.point.lng,
                                                            lat: translatedItem.point.lat,
                                                            color: that.getPoiExt(poiType, translatedItem.gps, 'color', 20),
                                                            size: that.getPoiExt(poiType, translatedItem.gps, 'size', 20),
                                                            type: poiType
                                                        };
                                                        layerArray.push(layerItem);
                                                    } else {
                                                        markerArray.push({ point: translatedItem.point, data: translatedItem.gps });
                                                    }
                                                }
                                                console.log('markerArray', markerArray);
                                                console.log('lineMap', lineMap);
                                                console.log('heatArray', heatArray);
                                                console.log('layerArray', layerArray);

                                                if (heatArray.length > 0) {
                                                    var isSupportCanvas = function isSupportCanvas() {
                                                        var elem = document.createElement('canvas');
                                                        return !!(elem.getContext && elem.getContext('2d'));
                                                    };

                                                    // 热力图
                                                    if (!isSupportCanvas()) {
                                                        alert('热力图目前只支持有canvas支持的浏览器,您所使用的浏览器不能使用热力图功能~');
                                                    }
                                                    // http://xcx1024.com/ArtInfo/271881.html
                                                    var heatmapOverlay = new BMapLib.HeatmapOverlay(Object.assign({
                                                        radius: 20
                                                    }, that.getPoiOption('heat', null, {})));
                                                    that.map.addOverlay(heatmapOverlay);
                                                    heatmapOverlay.setDataSet({
                                                        data: heatArray,
                                                        max: that.getPoiExt('heat', null, 'max', 100)
                                                    });

                                                    // 判断浏览区是否支持canvas
                                                }
                                                var lineCount = Object.keys(lineMap).length;
                                                if (lineCount > 0) {
                                                    for (var _i = 0; _i < lineCount; _i++) {
                                                        var lines = Object.values(lineMap)[_i];
                                                        if (lines.poiType === 'polygon') {
                                                            lines.points.push(lines.points[0]);
                                                        }
                                                        var polyline = new BMap.Polyline(lines.points, Object.assign({
                                                            enableEditing: false,
                                                            enableClicking: true,
                                                            strokeWeight: 4,
                                                            strokeOpacity: 0.5,
                                                            strokeColor: 'blue'
                                                        }, lines.option));
                                                        that.map.addOverlay(polyline);
                                                    }
                                                }
                                                if (markerArray.length > 0) {
                                                    for (var _i2 = 0; _i2 < markerArray.length; _i2++) {
                                                        that.addMarker(markerArray[_i2].point, BMap, markerArray[_i2].data);
                                                    }
                                                    if (that.panel.clusterPoint) {
                                                        new BMapLib.MarkerClusterer(that.map, {
                                                            markers: that.markers
                                                        });
                                                    }
                                                }
                                                if (layerArray.length > 0) {
                                                    var updateLayer = function updateLayer() {
                                                        var ctx = this.canvas.getContext('2d');

                                                        if (!ctx) {
                                                            return;
                                                        }
                                                        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                                                        ctx.beginPath();
                                                        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                                        for (var layerIndex = 0; layerIndex < layerArray.length; layerIndex++) {
                                                            var _layerItem = layerArray[layerIndex];
                                                            var _poiType = _layerItem[that.panel.typeName];
                                                            ctx.fillStyle = getColor(_layerItem.color, that.getPoiExt(_poiType, null, 'alpha', 0.5));
                                                            var isPie = _poiType === 'pie';
                                                            var posRect = getDotRect(that.map, parseFloat(_layerItem.lng), parseFloat(_layerItem.lat), _layerItem.size, !isPie);
                                                            // console.log(posRect);
                                                            if (isPie) {
                                                                ctx.ellipse(posRect.x, posRect.y, posRect.w, -posRect.h, 0, 0, 2 * Math.PI);
                                                                ctx.fill();
                                                                ctx.beginPath();
                                                            } else {
                                                                ctx.fillRect(posRect.x, posRect.y, posRect.w, posRect.h);
                                                            }
                                                        }
                                                    };

                                                    var canvasLayer = new BMap.CanvasLayer({
                                                        paneName: 'vertexPane',
                                                        zIndex: -999,
                                                        update: updateLayer
                                                    });

                                                    that.map.addOverlay(canvasLayer);
                                                }
                                            }
                                        } else {
                                            console.log('转换出错: ' + returnedData.status);
                                        }
                                    }

                                    // 转换坐标
                                    var point = new BMap.Point(gps.lng, gps.lat);
                                    var sourcePointList = new Array(point);
                                    var sourceGps = that.panel.gpsType;
                                    var sourceGpsId = 5;
                                    if (sourceGps === 'WGS84') {
                                        sourceGpsId = 1;
                                    } else if (sourceGps === 'GCJ02') {
                                        sourceGpsId = 3;
                                    }
                                    convertor.translate(sourcePointList, sourceGpsId, 5, translateCallback);
                                };

                                var lineMap = [];
                                var heatArray = [];
                                var markerArray = [];
                                var layerArray = [];
                                var convertor = new BMap.Convertor();

                                var rawLength = 0;
                                var translatedItems = [];

                                for (var i = 0; i < poiList.length; i++) {
                                    setTimeout(function (poiIndex) {
                                        return function () {
                                            if (poiList[poiIndex][that.panel.posName] && poiList[poiIndex][that.panel.posName].length > 0) {
                                                var gpsList = poiList[poiIndex][that.panel.posName].split(';');
                                                for (var gpsIndex = 0; gpsIndex < gpsList.length; gpsIndex++) {
                                                    var gpsStr = gpsList[gpsIndex];

                                                    var _gpsStr$split = gpsStr.split('|'),
                                                        _gpsStr$split2 = _slicedToArray(_gpsStr$split, 2),
                                                        lng = _gpsStr$split2[0],
                                                        lat = _gpsStr$split2[1];

                                                    var gpsItem = Object.assign({}, poiList[poiIndex]);
                                                    gpsItem.lng = parseFloat(lng);
                                                    gpsItem.lat = parseFloat(lat);
                                                    translateOne(poiIndex, gpsIndex, gpsItem, BMap);
                                                }
                                            }
                                        };
                                    }(i), i * 10);
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
                        if (this.panel.overviewMap == true) {
                            this.map.addControl(this.overviewMapSwitch);
                        } else {
                            this.map.removeControl(this.overviewMapSwitch);
                        }
                    }
                }, {
                    key: 'mapTypeControl',
                    value: function mapTypeControl() {
                        if (this.panel.mapType == true) {
                            this.map.addControl(this.mapTypeSwitch);
                        } else {
                            this.map.removeControl(this.mapTypeSwitch);
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
