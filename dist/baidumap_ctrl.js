'use strict';

System.register(['app/plugins/sdk', 'app/core/time_series2', 'app/core/utils/kbn', 'lodash', './map_renderer', './data_formatter', './libs/baidumap.js', 'jquery'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, TimeSeries, kbn, _, mapRenderer, DataFormatter, MP, $, _slicedToArray, _typeof, _createClass, panelDefaults, BaidumapCtrl;

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

    function getPoiExt(poiConfig, configName) {
        var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

        if ('ext' in poiConfig && poiConfig.ext.length > 0) {
            var extJson = JSON.parse(poiConfig.ext);
            if (configName in extJson) {
                return extJson[configName];
            }
        }
        return defaultValue;
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
    function getDotRect(_this, lng, lat) {
        var squareSize = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 20;
        var isCenterPoint = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

        var standardLen = 111700;
        var xScale = Math.cos(lat * Math.PI / 180);
        var lngDelta = squareSize / (standardLen * xScale);
        var latDelta = squareSize / standardLen;

        var pixel = _this.map.pointToPixel(isCenterPoint ? new window.BMap.Point(lng + lngDelta / 2, lat + latDelta / 2) : new window.BMap.Point(lng, lat));
        var pixel2 = _this.map.pointToPixel(isCenterPoint ? new window.BMap.Point(lng - lngDelta / 2, lat - latDelta / 2) : new window.BMap.Point(lng + lngDelta, lat + latDelta));
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
        }, function (_libsBaidumapJs) {
            MP = _libsBaidumapJs.MP;
        }, function (_jquery) {
            $ = _jquery.default;
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
                locationData: 'table',
                gpsType: '百度坐标系',
                esMetric: 'Count',
                decimals: 0,
                navigation: true,
                scale: true,
                hideEmpty: false,
                overviewMap: false,
                hideZero: false,
                mapType: true
            };

            BaidumapCtrl = function (_MetricsPanelCtrl) {
                _inherits(BaidumapCtrl, _MetricsPanelCtrl);

                function BaidumapCtrl($scope, $injector, contextSrv) {
                    _classCallCheck(this, BaidumapCtrl);

                    var _this2 = _possibleConstructorReturn(this, (BaidumapCtrl.__proto__ || Object.getPrototypeOf(BaidumapCtrl)).call(this, $scope, $injector));

                    _this2.setMapProvider(contextSrv);
                    _.defaults(_this2.panel, panelDefaults);

                    _this2.dataFormatter = new DataFormatter(_this2, kbn);
                    _this2.markers = [];
                    _this2.events.on('init-edit-mode', _this2.onInitEditMode.bind(_this2));
                    _this2.events.on('data-received', _this2.onDataReceived.bind(_this2));
                    _this2.events.on('panel-teardown', _this2.onPanelTeardown.bind(_this2));
                    _this2.events.on('data-snapshot-load', _this2.onDataSnapshotLoad.bind(_this2));
                    // this.loadLocationDataFromFile();
                    return _this2;
                }

                _createClass(BaidumapCtrl, [{
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
                        var myIcon = new BMap.Icon(getPoiExt(data, 'icon', 'public/plugins/grafana-baidumap-panel/images/bike.png'), new window.BMap.Size(24, 28), {
                            imageSize: new window.BMap.Size(24, 28),
                            anchor: new window.BMap.Size(12, 28)
                        });

                        var marker = new BMap.Marker(point, { icon: myIcon });

                        this.markers.push(marker);

                        // this.map.setViewport(pointArray);
                        marker.enableDragging();
                        var scontent = '';
                        scontent += '<a href=""><div class="infobox" id="infobox"><div class="infobox-content" style="display:block">';
                        scontent += '<div class="infobox-header"><div class="infobox-header-icon"><img src="' + getPoiExt(data, 'detail-icon', 'public/plugins/grafana-baidumap-panel/images/bike.png') + '"></div>';
                        scontent += '<div class="infobox-header-name"><p>' + getPoiExt(data, 'name') + '</p></div>';
                        scontent += '<div class="infobox-header-type" style="min-width:250px"><p>' + getPoiExt(data, 'type') + '</p></div></div>';
                        scontent += '<div class="infobox-footer">' + getPoiExt(data, 'desc') + '</div>';
                        scontent += '<div class="infobox-footer-right"></div></div><div class="arrow"></div></div></a>';

                        var infoWindow = new BMap.InfoWindow(scontent); // 创建信息窗口对象
                        marker.addEventListener('click', function () {
                            this.map.openInfoWindow(infoWindow, point); // 开启信息窗口
                        });

                        this.map.addOverlay(marker);
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
                                                for (var _i = 0; _i < translatedItems.length; _i++) {
                                                    var translatedItem = translatedItems[_i];
                                                    var poiType = translatedItem.gps.type;
                                                    var poiIndexKey = 'key_' + translatedItem.poiIndex;
                                                    if (poiType === 'heat') {
                                                        var heatPoint = {
                                                            lng: translatedItem.point.lng,
                                                            lat: translatedItem.point.lat,
                                                            count: getPoiExt(translatedItem.gps, 'count', 1)
                                                        };
                                                        heatArray.push(heatPoint);
                                                    } else if (poiType === 'line' || poiType === 'polygon') {
                                                        var pointItem = translatedItem.point;
                                                        if (poiIndexKey in lineMap) {
                                                            lineMap[poiIndexKey].points.push(pointItem);
                                                        } else {
                                                            lineMap[poiIndexKey] = {
                                                                poiType: poiType,
                                                                strokeColor: getPoiExt(translatedItem.gps, 'strokeColor', 'blue'),
                                                                strokeWeight: getPoiExt(translatedItem.gps, 'strokeWeight', '4'),
                                                                points: [pointItem]
                                                            };
                                                        }
                                                    } else {
                                                        markerArray.push({ point: translatedItem.point, data: translatedItem.gps });
                                                    }
                                                }
                                                console.log('markerArray', markerArray);
                                                console.log('lineMap', lineMap);
                                                console.log('heatArray', heatArray);

                                                if (heatArray.length > 0) {
                                                    var setGradient = function setGradient() {
                                                        var gradient = {};
                                                        var colors = document.querySelectorAll('input[type=\'color\']');
                                                        colors = [].slice.call(colors, 0);
                                                        colors.forEach(function (ele) {
                                                            gradient[ele.getAttribute('data-key')] = ele.value;
                                                        });
                                                        heatmapOverlay.setOptions({ gradient: gradient });
                                                    };

                                                    var isSupportCanvas = function isSupportCanvas() {
                                                        var elem = document.createElement('canvas');
                                                        return !!(elem.getContext && elem.getContext('2d'));
                                                    };

                                                    var ZoomControl = function ZoomControl() {
                                                        // 默认停靠位置和偏移量
                                                        this.defaultAnchor = BMAP_ANCHOR_BOTTOM_RIGHT;
                                                        this.defaultOffset = new BMap.Size(10, 10);
                                                    };

                                                    // 热力图
                                                    if (!isSupportCanvas()) {
                                                        alert('热力图目前只支持有canvas支持的浏览器,您所使用的浏览器不能使用热力图功能~');
                                                    }
                                                    // http://xcx1024.com/ArtInfo/271881.html
                                                    var heatmapOverlay = new BMapLib.HeatmapOverlay({ radius: 20 });
                                                    that.map.addOverlay(heatmapOverlay);
                                                    heatmapOverlay.setDataSet({ data: heatArray, max: 100 });

                                                    ZoomControl.prototype = new BMap.Control();
                                                    ZoomControl.prototype.initialize = function (map) {
                                                        // let div = document.createElement('div');
                                                        // let content = '<div id="heatmap_mark"><div><span class="heatmap_mark_title">颜色对应RSSI信号强度</span> <span class="heatmap_mark_text" style="float:right;padding-top:5px" id="heatmap_mark_density">dBm</span></div><div class="linear_color"></div><span class="heatmap_blue heatmap_mark_text heatmap_color_span">-60以下</span><span class="heatmap_green heatmap_mark_text heatmap_color_span">-60至-80</span><span class="heatmap_yellow heatmap_mark_text heatmap_color_span">-80至-100</span><span class="heatmap_red heatmap_mark_text heatmap_color_span">-100至-120</span><span class="heatmap_result_red heatmap_mark_text heatmap_color_span">-120以上</span></div>';
                                                        // div.innerHTML = content;
                                                        //
                                                        // that.map.getContainer()
                                                        //   .appendChild(div);
                                                        // return div;
                                                    };

                                                    var myZoomCtrl = new ZoomControl();
                                                    // eslint-disable-next-line eqeqeq
                                                    that.map.addControl(myZoomCtrl);
                                                    // eslint-disable-next-line eqeqeq
                                                }
                                                var lineCount = Object.keys(lineMap).length;
                                                if (lineCount > 0) {
                                                    for (var _i2 = 0; _i2 < lineCount; _i2++) {
                                                        var lines = Object.values(lineMap)[_i2];
                                                        var strokeColor = lines.strokeColor;
                                                        var strokeWeight = lines.strokeWeight;
                                                        if (lines.poiType === 'polygon') {
                                                            lines.points.push(lines.points[0]);
                                                        }
                                                        var polyline = new BMap.Polyline(lines.points, {
                                                            enableEditing: false,
                                                            enableClicking: true,
                                                            strokeWeight: strokeWeight,
                                                            strokeOpacity: 0.5,
                                                            strokeColor: strokeColor
                                                        });
                                                        that.map.addOverlay(polyline);
                                                    }
                                                }
                                                if (markerArray.length > 0) {
                                                    for (var _i3 = 0; _i3 < markerArray.length; _i3++) {
                                                        that.addMarker(markerArray[_i3].point, BMap, markerArray[_i3].data);
                                                    }
                                                    new BMapLib.MarkerClusterer(that.map, {
                                                        markers: that.markers
                                                    });
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
                                    if (sourceGpsId !== 5) {
                                        convertor.translate(sourcePointList, sourceGpsId, 5, translateCallback);
                                    } else {
                                        // 不转换 直接返回
                                        translateCallback({
                                            status: 0,
                                            points: sourcePointList
                                        });
                                    }
                                };

                                var lineMap = [];
                                var heatArray = [];
                                var markerArray = [];
                                var convertor = new BMap.Convertor();

                                var rawLength = 0;
                                var translatedItems = [];

                                for (var i = 0; i < poiList.length; i++) {
                                    setTimeout(function (poiIndex) {
                                        return function () {
                                            if (poiList[poiIndex].pos && poiList[poiIndex].pos.length > 0) {
                                                var gpsList = poiList[poiIndex].pos.split(';');
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
                        var _this3 = this;

                        return _.filter(data, function (o) {
                            return !(_this3.panel.hideEmpty && _.isNil(o.value)) && !(_this3.panel.hideZero && o.value === 0);
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
