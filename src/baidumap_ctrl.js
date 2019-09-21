/* eslint-disable eqeqeq,id-length,no-inner-declarations,no-plusplus,no-mixed-operators */
/* eslint import/no-extraneous-dependencies: 0 */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';

import _ from 'lodash';
import mapRenderer from './map_renderer';
import DataFormatter from './data_formatter';

const panelDefaults = {
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
    trafficMap: false,
    hideZero: false,
    mapType: true,
    clusterPoint: false,
    globalConfig: '',
    typeName: 'type',
    posName: 'pos',
    extName: 'ext'
};


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
function getDotRect(mp, lng, lat, squareSize = 20, isCenterPoint = true) {
    const standardLen = 111700;
    const xScale = Math.cos(lat * Math.PI / 180);
    const lngDelta = squareSize / (standardLen * xScale);
    const latDelta = squareSize / (standardLen);

    const pixel = mp.pointToPixel(isCenterPoint ? new window.BMap.Point(lng - lngDelta / 2, lat - latDelta / 2) : new window.BMap.Point(lng, lat));
    const pixel2 = mp.pointToPixel(isCenterPoint ? new window.BMap.Point(lng + lngDelta / 2, lat + latDelta / 2) : new window.BMap.Point(lng + lngDelta, lat + latDelta));
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

    getPoiOption(poiType, poiConfig, defaultValue = '') {
        const configName = 'option';
        const typeOption = this.getPoiExt(poiType, null, configName, defaultValue);
        const poiOption = this.getPoiExt(poiType, poiConfig, configName, defaultValue);
        return Object.assign({}, typeOption, poiOption);
    }

    getPoiExt(poiType, poiConfig, configName, defaultValue = '') {
        const extName = this.panel.extName;
        if (poiConfig && extName in poiConfig && poiConfig[extName].length > 0) {
            const extJson = JSON.parse(poiConfig[extName]);
            if (configName in extJson) {
                return extJson[configName];
            }
        }
        if (this.panel.globalConfig && this.panel.globalConfig.length > 0) {
            const globalConfig = JSON.parse(this.panel.globalConfig);
            if (poiType in globalConfig && configName in globalConfig[poiType]) {
                return globalConfig[poiType][configName];
            }
        }
        return defaultValue;
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
        // public/plugins/grafana-baidumap-panel/images/bike.png
        const poiType = 'marker';
        const markerOption = this.getPoiOption(poiType, data, {});
        const iconUrl = this.getPoiExt(poiType, data, 'icon', '');
        if (Number.isInteger(iconUrl)) {
            markerOption.icon = new BMap.Icon('http://api.map.baidu.com/img/markers.png', new BMap.Size(23, 25), {
                offset: new BMap.Size(10, 25), // 指定定位位置
                imageOffset: new BMap.Size(0, 25 * (10 - (iconUrl % 10)) - 10 * 25) // 设置图片偏移
            });
        } else if (iconUrl.length > 0) {
            markerOption.icon = new BMap.Icon(iconUrl, new window.BMap.Size(24, 28), {
                imageSize: new window.BMap.Size(24, 28),
                anchor: new window.BMap.Size(12, 28)
            });
        }
        const marker = new BMap.Marker(point, markerOption);
        const pointLabel = this.getPoiExt(poiType, data, 'label', '');
        if (pointLabel.length > 0) {
            const label = new BMap.Label(pointLabel, {offset: new BMap.Size(20, -10)});
            marker.setLabel(label);
        }
        this.markers.push(marker);

        // this.map.setViewport(pointArray);
        if (this.getPoiExt(poiType, data, 'enableDragging', false)) {
            marker.enableDragging();
        }
        let scontent = '';
        scontent += '<a href=""><div class="infobox" id="infobox"><div class="infobox-content" style="display:block">';
        scontent += '<div class="infobox-header"><div class="infobox-header-icon"><img src="' + this.getPoiExt(poiType, data, 'detail-icon', 'public/plugins/grafana-baidumap-panel/images/bike.png') + '"></div>';
        scontent += '<div class="infobox-header-name"><p>' + this.getPoiExt(poiType, data, 'name') + '</p></div>';
        scontent += '<div class="infobox-header-type" style="min-width:250px"><p>' + this.getPoiExt(poiType, data, 'type') + '</p></div></div>';
        scontent += '<div class="infobox-footer">' + this.getPoiExt(poiType, data, 'desc') + '</div>';
        scontent += '<div class="infobox-footer-right"></div></div><div class="arrow"></div></div></a>';

        const infoWindow = new BMap.InfoWindow(scontent); // 创建信息窗口对象
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

    addNode(BMap) {
        const that = this;
        const poiList = this.data;
        this.map.clearOverlays();
        console.log(poiList);
        if (poiList) {
            const lineMap = [];
            const heatArray = [];
            const markerArray = [];
            const layerArray = [];
            const convertor = new BMap.Convertor();

            let rawLength = 0;
            const translatedItems = [];

            for (let i = 0; i < poiList.length; i++) {
                setTimeout((function (poiIndex) {
                    return function () {
                        if (poiList[poiIndex][that.panel.posName] && poiList[poiIndex][that.panel.posName].length > 0) {
                            const gpsList = poiList[poiIndex][that.panel.posName].split(';');
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
                            for (let translateIndex = 0; translateIndex < translatedItems.length; translateIndex++) {
                                const translatedItem = translatedItems[translateIndex];
                                const poiType = translatedItem.gps[that.panel.typeName];
                                const poiIndexKey = 'key_' + translatedItem.poiIndex;
                                if (poiType === 'heat') {
                                    const heatPoint = {
                                        lng: translatedItem.point.lng,
                                        lat: translatedItem.point.lat,
                                        count: that.getPoiExt(poiType, translatedItem.gps, 'count', 1)
                                    };
                                    heatArray.push(heatPoint);
                                } else if (poiType === 'line' || poiType === 'polygon' || poiType === 'route') {
                                    const pointItem = translatedItem.point;
                                    if (poiIndexKey in lineMap) {
                                        lineMap[poiIndexKey].points.push(pointItem);
                                    } else {
                                        const option = Object.assign(
                                            {},
                                            that.getPoiOption(poiType, translatedItem.gps, {})
                                        );
                                        lineMap[poiIndexKey] = {
                                            poiType: poiType,
                                            option: option,
                                            points: [pointItem]
                                        };
                                    }
                                } else if (poiType === 'pie' || poiType === 'block') {
                                    const layerItem = {
                                        lng: translatedItem.point.lng,
                                        lat: translatedItem.point.lat,
                                        color: that.getPoiExt(poiType, translatedItem.gps, 'color', 20),
                                        size: that.getPoiExt(poiType, translatedItem.gps, 'size', 20),
                                        type: poiType
                                    };
                                    layerArray.push(layerItem);
                                } else {
                                    markerArray.push({point: translatedItem.point, data: translatedItem.gps});
                                }
                            }
                            console.log('markerArray', markerArray);
                            console.log('lineMap', lineMap);
                            console.log('heatArray', heatArray);
                            console.log('layerArray', layerArray);

                            if (heatArray.length > 0) {
                                // 热力图
                                if (!isSupportCanvas()) {
                                    alert('热力图目前只支持有canvas支持的浏览器,您所使用的浏览器不能使用热力图功能~');
                                }
                                // http://xcx1024.com/ArtInfo/271881.html
                                const heatmapOverlay = new BMapLib.HeatmapOverlay(
                                    Object.assign(
                                        {
                                            radius: 20,
                                        },
                                        that.getPoiOption('heat', null, {})
                                    ));
                                that.map.addOverlay(heatmapOverlay);
                                heatmapOverlay.setDataSet({
                                    data: heatArray,
                                    max: that.getPoiExt('heat', null, 'max', 100)
                                });

                                // 判断浏览区是否支持canvas
                                function isSupportCanvas() {
                                    const elem = document.createElement('canvas');
                                    return !!(elem.getContext && elem.getContext('2d'));
                                }
                            }
                            const lineCount = Object.keys(lineMap).length;
                            if (lineCount > 0) {
                                for (let i = 0; i < lineCount; i++) {
                                    const lines = Object.values(lineMap)[i];
                                    if (lines.points.length < 2) {
                                        // eslint-disable-next-line no-continue
                                        continue;
                                    }
                                    if (lines.poiType === 'route') {
                                        const points = lines.points.map(v => new BMap.Point(v.lng, v.lat));
                                        const driving = new BMap.RidingRoute(that.map, {
                                            renderOptions: {
                                                map: that.map,
                                                // autoViewport: true
                                            }
                                        });
                                        driving.search(points[0], points.slice(-1)[0]);
                                    } else {
                                        if (lines.poiType === 'polygon') {
                                            lines.points.push(lines.points[0]);
                                        }
                                        const polyline = new BMap.Polyline(lines.points, Object.assign(
                                            {
                                                enableEditing: false,
                                                enableClicking: true,
                                                strokeWeight: 4,
                                                strokeOpacity: 0.5,
                                                strokeColor: 'blue'
                                            },
                                            lines.option
                                            )
                                        );
                                        that.map.addOverlay(polyline);
                                    }
                                }
                            }
                            if (markerArray.length > 0) {
                                for (let i = 0; i < markerArray.length; i++) {
                                    that.addMarker(markerArray[i].point, BMap, markerArray[i].data);
                                }
                                if (that.panel.clusterPoint) {
                                    new BMapLib.MarkerClusterer(that.map, {
                                        markers: that.markers
                                    });
                                }
                            }
                            if (layerArray.length > 0) {
                                const canvasLayer = new BMap.CanvasLayer({
                                    paneName: 'vertexPane',
                                    zIndex: -999,
                                    update: updateLayer
                                });

                                function updateLayer() {
                                    const ctx = this.canvas.getContext('2d');

                                    if (!ctx) {
                                        return;
                                    }
                                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                                    ctx.beginPath();
                                    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                    for (let layerIndex = 0; layerIndex < layerArray.length; layerIndex++) {
                                        const layerItem = layerArray[layerIndex];
                                        const poiType = layerItem[that.panel.typeName];
                                        ctx.fillStyle = getColor(layerItem.color, that.getPoiExt(poiType, null, 'alpha', 0.5));
                                        const isPie = poiType === 'pie';
                                        const posRect = getDotRect(that.map, parseFloat(layerItem.lng),
                                            parseFloat(layerItem.lat), layerItem.size, !isPie);
                                        // console.log(posRect);
                                        if (isPie) {
                                            ctx.ellipse(posRect.x, posRect.y, posRect.w, -posRect.h, 0, 0, 2 * Math.PI);
                                            ctx.fill();
                                            ctx.beginPath();
                                        } else {
                                            ctx.fillRect(posRect.x, posRect.y, posRect.w, posRect.h);
                                        }
                                    }
                                }

                                that.map.addOverlay(canvasLayer);
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
                convertor.translate(sourcePointList, sourceGpsId, 5, translateCallback);
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
        if (this.panel.overviewMap === true) {
            this.map.addControl(this.overviewMapSwitch);
        } else {
            this.map.removeControl(this.overviewMapSwitch);
        }
    }

    trafficMapControl() {
        if (this.panel.trafficMap === true) {
            if (!this.trafficMapSwitch) {
                this.trafficMapSwitch = new BMapLib.TrafficControl({
                    showPanel: false,
                    anchor: BMAP_ANCHOR_BOTTOM_RIGHT
                });
            }
            this.map.addControl(this.trafficMapSwitch);
        } else {
            this.map.removeControl(this.trafficMapSwitch);
        }
    }

    mapTypeControl() {
        if (this.panel.mapType === true) {
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

    openDistanceTool() {
        if (!this.distanceTool) {
            this.distanceTool = new BMapLib.DistanceTool(this.map);
        }
        this.distanceTool.open();
    }

    openRectangleZoom() {
        if (!this.rectangleZoomTool) {
            this.rectangleZoomTool = new BMapLib.RectangleZoom(this.map, {
                followText: '拖拽鼠标进行操作'
            });
        }
        this.rectangleZoomTool.open();
    }

    closeRectangleZoom() {
        this.rectangleZoomTool.close();
    }

// 如果要调试事件接口，请打开下方屏蔽代码，
// 在firefox或者chrome下查看调试信息

    // distanceTool.addEventListener('drawend', function (e) {
    //     console.log('drawend');
    //     console.log(e.points);
    //     console.log(e.overlays);
    //     console.log(e.distance);
    // });
    //
    // distanceTool.addEventListener('addpoint', function (e) {
    //     console.log('addpoint');
    //     console.log(e.point);
    //     console.log(e.pixel);
    //     console.log(e.index);
    //     console.log(e.distance);
    // });
    //
    // distanceTool.addEventListener('removepolyline', function (e) {
    //     console.log('removepolyline');
    //     console.log(e);
    // });

}

BaidumapCtrl.templateUrl = 'module.html';
