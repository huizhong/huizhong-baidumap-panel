/* eslint-disable eqeqeq,id-length,no-inner-declarations,no-plusplus,no-mixed-operators,no-continue */
/* eslint import/no-extraneous-dependencies: 0 */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';

import _ from 'lodash';
import mapRenderer from './map_renderer';
import DataFormatter from './data_formatter';

import decodeGeoHash from './geohash';

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


function getColor(orginBili, alpha) {
    if ((typeof orginBili) !== 'number') {
        return orginBili;
    }
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

function filterCtx(ctx, styleOption) {
    ['fillColor', 'strokeColor'].forEach((keyName) => {
        if (styleOption[keyName]) {
            styleOption[keyName] = getColor(styleOption[keyName], 0.5);
        }
    });
    [
        ['strokeWeight', 'lineWidth'],
        ['fillColor', 'fillStyle'],
        ['strokeColor', 'strokeStyle'],
        ['strokeOpacity', 'globalAlpha'],
    ].forEach((keyMap) => {
        const [sourceName, targetName] = keyMap;
        const keyValue = styleOption[sourceName];
        delete styleOption[sourceName];
        styleOption[targetName] = keyValue;
    });
    Object.assign(ctx, styleOption);
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

    getPoiTypeOption(poiType) {
        return this.getPoiOption(poiType, null);
    }

    getPoiOption(poiType, poiConfig) {
        const configName = 'option';
        const typeOption = this.getPoiTypeExt(poiType, configName, {});
        const poiOption = this.getPoiExt(poiType, poiConfig, configName, {});
        return Object.assign({}, typeOption, poiOption);
    }

    getPoiTypeExt(poiType, configName, defaultValue = '') {
        return this.getPoiExt(poiType, null, configName, defaultValue);
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

    addMarker(poiType, point, BMap, data) {
        // public/plugins/grafana-baidumap-panel/images/bike.png
        const markerOption = this.getPoiOption(poiType, data);
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

        const detailImage = this.getPoiExt(poiType, data, 'detailIcon', '');
        if (detailImage.length > 0) {
            scontent += '<div class="infobox-header"><div class="infobox-header-icon"><img src="' + detailImage + '"></div>';
        }
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
            const shapeMap = [];
            const sourcePointList = [];
            const callbackList = [];

            let rawLength = 0;
            const translatedItems = [];

            for (let i = 0; i < poiList.length; i++) {
                const poiIndex = i;
                setTimeout(function () {
                    if (poiList[poiIndex] && poiList[poiIndex][that.panel.lngName]
                        && poiList[poiIndex][that.panel.latName]
                        && poiList[poiIndex][that.panel.lngName] > 0
                        && poiList[poiIndex][that.panel.latName] > 0
                    ) {
                        const gpsItem = Object.assign({}, poiList[poiIndex]);
                        gpsItem.lng = parseFloat(poiList[poiIndex][that.panel.lngName]);
                        gpsItem.lat = parseFloat(poiList[poiIndex][that.panel.latName]);
                        translateOne(poiIndex, 0, gpsItem, BMap);
                    } else if (poiList[poiIndex][that.panel.geohashName] && poiList[poiIndex][that.panel.geohashName].length > 0) {
                        const {longitude: lng, latitude: lat} = decodeGeoHash(poiList[poiIndex][that.panel.geohashName]);
                        const gpsItem = Object.assign({}, poiList[poiIndex], {lng, lat});
                        translateOne(poiIndex, 0, gpsItem, BMap);
                    } else if (poiList[poiIndex][that.panel.posName] && poiList[poiIndex][that.panel.posName].length > 0) {
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
                    if (sourcePointList.length > 0) {
                        const convertor = new BMap.Convertor();
                        const groupSize = 10;
                        for (let groupIndex = 0; groupIndex < sourcePointList.length; groupIndex += groupSize) {
                            const pointList = [];
                            for (let pointIndex = 0; pointIndex < groupSize && pointIndex + groupIndex < sourcePointList.length; pointIndex++) {
                                pointList.push(sourcePointList[groupIndex + pointIndex]);
                            }
                            convertor.translate(pointList, getMapSourceId(), 5, (result) => {
                                if (result.status === 0) {
                                    for (let index = 0; index < result.points.length; index++) {
                                        callbackList[groupIndex + index](result.points[index]);
                                    }
                                } else {
                                    console.error('gps translate error', pointList);
                                }
                            });
                        }
                    }
                }, 10);
            }

            function getMapSourceId() {
                const sourceGps = that.panel.gpsType;
                let sourceGpsId = 5;
                if (sourceGps === 'WGS84') {
                    sourceGpsId = 1;
                } else if (sourceGps === 'GCJ02') {
                    sourceGpsId = 3;
                }
                return sourceGpsId;
            }

            function translateOne(poiIndex, gpsIndex, gps) {
                rawLength += 1;
                // 转换坐标
                const sourceGpsId = getMapSourceId();
                if (sourceGpsId === 5) {
                    setTimeout(function () {
                        translateCallback(poiIndex, gpsIndex, gps, {lng: gps.lng, lat: gps.lat});
                    }, 1);
                } else {
                    const point = new BMap.Point(gps.lng, gps.lat);
                    sourcePointList.push(point);
                    callbackList.push(translateCallback.bind(this, poiIndex, gpsIndex, gps));
                }
            }

            function translateCallback(myPoiIndex, myGpsIndex, myGps, translatedData) {
                const {lng, lat} = translatedData;
                translatedItems.push({
                    poiIndex: myPoiIndex,
                    gpsIndex: myGpsIndex,
                    point: new BMap.Point(lng, lat),
                    gps: myGps,
                });

                if (translatedItems.length === rawLength) {
                    translatedItems.sort(function (a, b) {
                        return ((a.poiIndex - b.poiIndex) * 1000000) + (a.gpsIndex - b.gpsIndex);
                    });
                    for (let translateIndex = 0; translateIndex < translatedItems.length; translateIndex++) {
                        const translatedItem = translatedItems[translateIndex];
                        const poiType = translatedItem.gps[that.panel.typeName];
                        const poiIndexKey = 'key_' + translatedItem.poiIndex;
                        const pointItem = translatedItem.point;
                        if (!(poiType in shapeMap)) {
                            shapeMap[poiType] = [];
                        }
                        const shapeList = shapeMap[poiType];
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
                    const heatPoiType = 'heat';
                    if (shapeMap[heatPoiType]) {
                        const heatShapeList = shapeMap[heatPoiType];
                        const heatmapOverlay = new BMapLib.HeatmapOverlay(
                            Object.assign(
                                {
                                    radius: 20,
                                },
                                that.getPoiTypeOption('heat')
                            ));
                        that.map.addOverlay(heatmapOverlay);
                        const dataList = [];
                        heatShapeList.forEach((v) => {
                            v.points.forEach((point) => {
                                dataList.push(({
                                    lng: point.lng,
                                    lat: point.lat,
                                    count: that.getPoiExt(heatPoiType, v.poiData, 'count', 1)
                                }));
                            });
                        });
                        heatmapOverlay.setDataSet({
                            data: dataList,
                            max: that.getPoiTypeExt(heatPoiType, 'max', 100)
                        });
                    }
                    const markerTypeName = 'Marker';
                    if (shapeMap[markerTypeName]) {
                        const markerArray = shapeMap[markerTypeName];
                        markerArray.forEach((v) => {
                            v.points.forEach((point) => {
                                that.addMarker(markerTypeName, point, BMap, v.poiData);
                            });
                        });
                        if (that.panel.clusterPoint) {
                            new BMapLib.MarkerClusterer(that.map, {
                                markers: that.markers
                            });
                        }
                    }
                    ['RidingRoute', 'DrivingRoute', 'WalkingRoute'].forEach((poiType) => {
                        if (poiType in shapeMap) {
                            shapeMap[poiType].forEach((item) => {
                                const points = item.points.map(v => new BMap.Point(v.lng, v.lat));
                                for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex++) {
                                    const driving = new BMap[poiType](that.map, {
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
                    ['Polyline', 'Polygon'].forEach((poiType) => {
                        if (shapeMap[poiType]) {
                            shapeMap[poiType].forEach((item) => {
                                const polyline = new BMap[poiType](item.points, Object.assign(
                                    {
                                        enableEditing: false,
                                        enableClicking: true,
                                        strokeWeight: 4,
                                        strokeOpacity: 0.5,
                                        strokeColor: 'blue',
                                    },
                                    that.getPoiOption(item.poiType, item.poiData)
                                ));
                                that.map.addOverlay(polyline);
                            });
                        }
                    });
                    const linePoiTypes = ['polyline', 'polygon'];
                    const dotPoiTypes = ['Pie', 'Square'];
                    const canvasTypes = [...dotPoiTypes, ...linePoiTypes];
                    if (canvasTypes.some(canvasType => shapeMap[canvasType])) {
                        that.map.addOverlay(new BMap.CanvasLayer({
                            paneName: 'vertexPane',
                            zIndex: -1,
                            update: function () {
                                const ctx = this.canvas.getContext('2d');
                                if (!ctx) {
                                    return;
                                }
                                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                                ctx.beginPath();
                                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                                ctx.closePath();
                                dotPoiTypes.forEach((poiType) => {
                                    if (shapeMap[poiType]) {
                                        shapeMap[poiType].forEach((item) => {
                                            item.points.forEach((point) => {
                                                const layerItem = {
                                                    lng: point.lng,
                                                    lat: point.lat,
                                                    size: that.getPoiExt(poiType, item.poiData, 'size', 20),
                                                };
                                                ctx.beginPath();
                                                filterCtx(ctx, that.getPoiOption(poiType, item.poiData));
                                                const isPie = poiType === 'Pie';
                                                const posRect = getDotRect(that.map, parseFloat(layerItem.lng),
                                                    parseFloat(layerItem.lat), layerItem.size, !isPie);
                                                if (isPie) {
                                                    ctx.ellipse(posRect.x, posRect.y, posRect.w, -posRect.h, 0, 0, 2 * Math.PI);
                                                    ctx.fill();
                                                } else {
                                                    ctx.fillRect(posRect.x, posRect.y, posRect.w, posRect.h);
                                                }
                                                ctx.closePath();
                                            });
                                        });
                                    }
                                });
                                linePoiTypes.forEach((linePoiType) => {
                                    if (shapeMap[linePoiType]) {
                                        shapeMap[linePoiType].forEach((item) => {
                                            ctx.beginPath();
                                            const poiOption = that.getPoiOption(linePoiType, item.poiData);
                                            filterCtx(ctx, poiOption);
                                            const startPoint = that.map.pointToPixel(item.points[0]);
                                            ctx.moveTo(startPoint.x, startPoint.y);
                                            for (let pointIndex = 1; pointIndex < item.points.length; pointIndex++) {
                                                const linePoint = that.map.pointToPixel(item.points[pointIndex]);
                                                ctx.lineTo(linePoint.x, linePoint.y);
                                            }
                                            if (linePoiType === 'polyline') {
                                                ctx.stroke();
                                            } else if (linePoiType === 'polygon') {
                                                ctx.closePath();
                                                ctx.stroke();
                                                if (poiOption.fillOpacity) {
                                                    ctx.globalAlpha = poiOption.fillOpacity;
                                                }
                                                ctx.fill();
                                            }
                                        });
                                    }
                                });
                            }
                        }));
                    }
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
        if (this.panel.overviewMap === true) {
            this.map.addControl(this.overviewMapSwitch);
        } else {
            this.map.removeControl(this.overviewMapSwitch);
        }
    }

    mapTypeControl() {
        if (this.panel.mapType === true) {
            this.map.addControl(this.mapTypeSwitch);
        } else {
            this.map.removeControl(this.mapTypeSwitch);
        }
    }

    trafficControl() {
        if (this.panel.traffic === true) {
            this.map.addControl(this.trafficSwitch);
        } else {
            this.map.removeControl(this.trafficSwitch);
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
