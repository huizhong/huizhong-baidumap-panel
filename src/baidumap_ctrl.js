/* eslint-disable eqeqeq,id-length,no-inner-declarations,no-plusplus,no-mixed-operators */
/* eslint import/no-extraneous-dependencies: 0 */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';

import _ from 'lodash';
import mapRenderer from './map_renderer';
import DataFormatter from './data_formatter';
import {MP} from './libs/baidumap.js';
import $ from 'jquery';

const panelDefaults = {
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


function getPoiExt(poiConfig, configName, defaultValue = '') {
    if ('ext' in poiConfig && poiConfig.ext.length > 0) {
        const extJson = JSON.parse(poiConfig.ext);
        if (configName in extJson) {
            return extJson[configName];
        }
    }
    return defaultValue;
}

function getColor(orginBili, alpha) {
    const bili = orginBili > 100 ? 100 : orginBili;
    // 百分之一 = (单色值范围) / 50;  单颜色的变化范围只在50%之内
    const one = (255 + 255) / 100;
    let r = 0;
    let g = 0;
    let b = 0;

    const yellowValue = 50;
    const fullRedValue = 95;
    const darkRedWeight = 0.6;

    if (bili <= yellowValue) {
        // 比例小于yellowValue的时候红色是越来越多的,直到红色为255时(红+绿)变为黄色.
        r = one * bili / yellowValue * 50;
        g = 255;
    } else if (bili > yellowValue && bili <= fullRedValue) {
        // 比例大于yellowValue的时候绿色是越来越少的,直到fullRedValue 变为纯红
        g = 255 - ((bili - yellowValue) / (fullRedValue - yellowValue) * 50 * one);
        r = 255;
    } else {
        // 比例大于fullRedValue 开始转为暗红
        g = 0;
        r = 255 * (1 - darkRedWeight * (bili - fullRedValue) / (100 - fullRedValue));
    }
    r = parseInt(r, 10);// 取整
    g = parseInt(g, 10);// 取整
    b = parseInt(b, 10);// 取整
    return 'rgb(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

// 获取色块对应的矩形相对于地图的像素值
function getDotRect(_this, lng, lat, squareSize = 20, isCenterPoint = true) {
    const standardLen = 111700;
    const xScale = Math.cos(lat * Math.PI / 180);
    const lngDelta = squareSize / (standardLen * xScale);
    const latDelta = squareSize / (standardLen);

    const pixel = _this.map.pointToPixel(isCenterPoint ? new window.BMap.Point(lng + lngDelta / 2, lat + latDelta / 2) : new window.BMap.Point(lng, lat));
    const pixel2 = _this.map.pointToPixel(isCenterPoint ? new window.BMap.Point(lng - lngDelta / 2, lat - latDelta / 2) : new window.BMap.Point(lng + lngDelta, lat + latDelta));
    return {
        x: pixel.x,
        y: pixel.y,
        w: pixel2.x - pixel.x,
        h: pixel2.y - pixel.y,
    };
}


export default class BaidumapCtrl extends MetricsPanelCtrl {
    constructor($scope, $injector, contextSrv) {
        super($scope, $injector);
        this.setMapProvider(contextSrv);
        _.defaults(this.panel, panelDefaults);

        this.dataFormatter = new DataFormatter(this, kbn);
        this.markers = [];
        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('data-received', this.onDataReceived.bind(this));
        this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
        this.events.on('data-snapshot-load', this.onDataSnapshotLoad.bind(this));
        // this.loadLocationDataFromFile();
    }

    setMapProvider(contextSrv) {
//    this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
        this.tileServer = 'CartoDB Positron';
        this.setMapSaturationClass();
    }

    setMapSaturationClass() {
        if (this.tileServer === 'CartoDB Dark') {
            this.saturationClass = 'map-darken';
        } else {
            this.saturationClass = '';
        }
    }

    loadLocationDataFromFile(reload) {
        if (this.map && !reload) return;

        if (this.panel.snapshotLocationData) {
            this.locations = this.panel.snapshotLocationData;
            return;
        }

        if (this.panel.locationData === 'jsonp endpoint') {

        } else if (this.panel.locationData === 'json endpoint') {
            if (!this.panel.jsonUrl) return;
        } else if (this.panel.locationData === 'table') {
            // .. Do nothing

        } else if (this.panel.locationData !== 'geohash' && this.panel.locationData !== 'json result') {

        }
    }

    reloadLocations(res) {
        this.locations = res;
        this.refresh();
    }

    onPanelTeardown() {
        if (this.map) delete this.map;
    }

    onInitEditMode() {
        this.addEditorTab('Baidumap', 'public/plugins/grafana-baidumap-panel/partials/editor.html', 2);
    }

    onDataReceived(dataList) {
        if (!dataList) return;
        if (this.dashboard.snapshot && this.locations) {
            this.panel.snapshotLocationData = this.locations;
        }

        const data = [];
        if (this.panel.locationData === 'geohash') {
            this.dataFormatter.setGeohashValues(dataList, data);
        } else if (this.panel.locationData === 'table') {
            const tableData = dataList.map(DataFormatter.tableHandler.bind(this));
            this.dataFormatter.setTableValues(tableData, data);
        } else if (this.panel.locationData === 'json result') {
            const tableData = dataList.map(DataFormatter.tableHandlers.bind(this));
            this.dataFormatter.setTableValues(tableData, data);
        } else {
            const tableData = dataList.map(DataFormatter.tableHandler.bind(this));
            this.dataFormatter.setTableValues(tableData, data);
        }
        // const datas = this.filterEmptyAndZeroValues(data);

        const datas = data;
        if (typeof this.data === 'object') this.data.splice(0, this.data.length);
        this.markers.splice(0, this.markers.length);
        if (datas.length) {
            this.data = datas;

            this.map ? this.addNode(this.BMap) : this.render();
        } else {
            if (this.map) this.map.clearOverlays();
            this.render();
        }
    }

    addMarker(point, BMap, data) {
        const myIcon = new BMap.Icon(getPoiExt(data, 'icon', 'public/plugins/grafana-baidumap-panel/images/bike.png'), new window.BMap.Size(24, 28), {
            imageSize: new window.BMap.Size(24, 28),
            anchor: new window.BMap.Size(12, 28)
        });

        const marker = new BMap.Marker(point, {icon: myIcon});

        this.markers.push(marker);

        // this.map.setViewport(pointArray);
        marker.enableDragging();
        let scontent = '';
        scontent += '<a href=""><div class="infobox" id="infobox"><div class="infobox-content" style="display:block">';
        scontent += '<div class="infobox-header"><div class="infobox-header-icon"><img src="' + getPoiExt(data, 'detail-icon', 'public/plugins/grafana-baidumap-panel/images/bike.png') + '"></div>';
        scontent += '<div class="infobox-header-name"><p>' + getPoiExt(data, 'name') + '</p></div>';
        scontent += '<div class="infobox-header-type" style="min-width:250px"><p>' + getPoiExt(data, 'type') + '</p></div></div>';
        scontent += '<div class="infobox-footer">' + getPoiExt(data, 'desc') + '</div>';
        scontent += '<div class="infobox-footer-right"></div></div><div class="arrow"></div></div></a>';

        const infoWindow = new BMap.InfoWindow(scontent); // 创建信息窗口对象
        marker.addEventListener('click', function () {
            this.map.openInfoWindow(infoWindow, point); // 开启信息窗口
        });

        this.map.addOverlay(marker);
        marker.addEventListener('dragend', function (e) {
            point = new BMap.Point(e.point.lng, e.point.lat);
            alert('当前位置：' + e.point.lng + ', ' + e.point.lat);
        });
    }

    addNode(BMap) {
        const that = this;
        const poiList = this.data;
        this.map.clearOverlays();
        console.log(poiList);
        if (poiList) {
            const lineMap = [];
            const heatArray = [];
            const markerArray = [];
            const convertor = new BMap.Convertor();

            let rawLength = 0;
            const translatedItems = [];

            for (let i = 0; i < poiList.length; i++) {
                setTimeout((function (poiIndex) {
                    return function () {
                        if (poiList[poiIndex].pos && poiList[poiIndex].pos.length > 0) {
                            const gpsList = poiList[poiIndex].pos.split(';');
                            for (let gpsIndex = 0; gpsIndex < gpsList.length; gpsIndex++) {
                                const gpsStr = gpsList[gpsIndex];
                                const [lng, lat] = gpsStr.split('|');
                                const gpsItem = Object.assign({}, poiList[poiIndex]);
                                gpsItem.lng = parseFloat(lng);
                                gpsItem.lat = parseFloat(lat);
                                translateOne(poiIndex, gpsIndex, gpsItem, BMap);
                            }
                        }
                    };
                }(i)), i * 10);
            }

            function translateOne(poiIndex, gpsIndex, gps, BMap) {
                rawLength += 1;

                function translateCallback(returnedData) {
                    if (returnedData.status == 0) {
                        translatedItems.push({
                            poiIndex: poiIndex,
                            gpsIndex: gpsIndex,
                            point: returnedData.points[0],
                            gps: gps,
                        });

                        if (translatedItems.length == rawLength) {
                            translatedItems.sort(function (a, b) {
                                return ((a.poiIndex - b.poiIndex) * 1000000) + (a.gpsIndex - b.gpsIndex);
                            });
                            for (let i = 0; i < translatedItems.length; i++) {
                                const translatedItem = translatedItems[i];
                                const poiType = translatedItem.gps.type;
                                const poiIndexKey = 'key_' + translatedItem.poiIndex;
                                if (poiType === 'heat') {
                                    const heatPoint = {
                                        lng: translatedItem.point.lng,
                                        lat: translatedItem.point.lat,
                                        count: getPoiExt(translatedItem.gps, 'count', 1)
                                    };
                                    heatArray.push(heatPoint);
                                } else if (poiType === 'line' || poiType === 'polygon') {
                                    const pointItem = translatedItem.point;
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
                                    markerArray.push({point: translatedItem.point, data: translatedItem.gps});
                                }
                            }
                            console.log('markerArray', markerArray);
                            console.log('lineMap', lineMap);
                            console.log('heatArray', heatArray);

                            if (heatArray.length > 0) {
                                // 热力图
                                if (!isSupportCanvas()) {
                                    alert('热力图目前只支持有canvas支持的浏览器,您所使用的浏览器不能使用热力图功能~');
                                }
                                // http://xcx1024.com/ArtInfo/271881.html
                                const heatmapOverlay = new BMapLib.HeatmapOverlay({radius: 20});
                                that.map.addOverlay(heatmapOverlay);
                                heatmapOverlay.setDataSet({data: heatArray, max: 100});

                                function setGradient() {
                                    const gradient = {};
                                    let colors = document.querySelectorAll('input[type=\'color\']');
                                    colors = [].slice.call(colors, 0);
                                    colors.forEach(function (ele) {
                                        gradient[ele.getAttribute('data-key')] = ele.value;
                                    });
                                    heatmapOverlay.setOptions({gradient: gradient});
                                }

                                // 判断浏览区是否支持canvas
                                function isSupportCanvas() {
                                    const elem = document.createElement('canvas');
                                    return !!(elem.getContext && elem.getContext('2d'));
                                }

                                function ZoomControl() {
                                    // 默认停靠位置和偏移量
                                    this.defaultAnchor = BMAP_ANCHOR_BOTTOM_RIGHT;
                                    this.defaultOffset = new BMap.Size(10, 10);
                                }

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

                                const myZoomCtrl = new ZoomControl();
                                // eslint-disable-next-line eqeqeq
                                that.map.addControl(myZoomCtrl);
                                // eslint-disable-next-line eqeqeq
                            }
                            const lineCount = Object.keys(lineMap).length;
                            if (lineCount > 0) {
                                for (let i = 0; i < lineCount; i++) {
                                    const lines = Object.values(lineMap)[i];
                                    const strokeColor = lines.strokeColor;
                                    const strokeWeight = lines.strokeWeight;
                                    if (lines.poiType === 'polygon') {
                                        lines.points.push(lines.points[0]);
                                    }
                                    const polyline = new BMap.Polyline(lines.points, {
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
                                for (let i = 0; i < markerArray.length; i++) {
                                    that.addMarker(markerArray[i].point, BMap, markerArray[i].data);
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
                const point = new BMap.Point(gps.lng, gps.lat);
                const sourcePointList = new Array(point);
                const sourceGps = that.panel.gpsType;
                let sourceGpsId = 5;
                if (sourceGps === 'WGS84') {
                    sourceGpsId = 1;
                } else if (sourceGps === 'GCJ02') {
                    sourceGpsId = 3;
                }
                if (sourceGpsId !== 5) {
                    convertor.translate(sourcePointList, sourceGpsId, 5, translateCallback);
                } else { // 不转换 直接返回
                    setTimeout((function () {
                        return function () {
                            translateCallback({
                                status: 0,
                                points: [{
                                    lng: gps.lng,
                                    lat: gps.lat
                                }]
                            });
                        };
                    }()), 10);
                }
            }
        }
    }

    filterEmptyAndZeroValues(data) {
        return _.filter(data, (o) => {
            return !(this.panel.hideEmpty && _.isNil(o.value)) && !(this.panel.hideZero && o.value === 0);
        });
    }

    onDataSnapshotLoad(snapshotData) {
        this.onDataReceived(snapshotData);
    }

    seriesHandler(seriesData) {
        const series = new TimeSeries({
            datapoints: seriesData.datapoints,
            alias: seriesData.target,
        });

        series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
        return series;
    }

    setNewMapCenter() {
        this.render();
    }

    setZoom() {
        this.map.setZoom(parseInt(this.panel.initialZoom, 10) || 1);
    }

    setStyle() {
        this.map.setMapStyle({style: this.panel.theme});
    }

    setAK() {
        const x = document.body;
        const s = document.getElementsByTagName('script');
        const len = s.length;
        x.removeChild(s[len - 1]);
        delete this.map;
        this.render();
    }

    navigationControl() {
        if (this.panel.navigation == true) {
            this.map.addControl(this.navigationSwitch);
        } else {
            this.map.removeControl(this.navigationSwitch);
        }
    }

    scaleControl() {
        if (this.panel.scale == true) {
            this.map.addControl(this.scaleSwitch);
        } else {
            this.map.removeControl(this.scaleSwitch);
        }
    }

    overviewMapControl() {
        if (this.panel.overviewMap == true) {
            this.map.addControl(this.overviewMapSwitch);
        } else {
            this.map.removeControl(this.overviewMapSwitch);
        }
    }

    mapTypeControl() {
        if (this.panel.mapType == true) {
            this.map.addControl(this.mapTypeSwitch);
        } else {
            this.map.removeControl(this.mapTypeSwitch);
        }
    }

    resize() {

    }

    toggleStickyLabels() {
        console.log(this.panel.stickyLabels);
    }

    changeLocationData() {
        if (this.panel.locationData === 'geohash') {
            this.render();
        }
    }

    /* eslint class-methods-use-this: 0 */
    link(scope, elem, attrs, ctrl) {
        mapRenderer(scope, elem, attrs, ctrl);
    }
}

BaidumapCtrl.templateUrl = 'module.html';
