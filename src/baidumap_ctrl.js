/* eslint-disable eqeqeq,id-length,no-inner-declarations,no-plusplus,no-mixed-operators,no-continue,no-nested-ternary */
/* eslint import/no-extraneous-dependencies: 0 */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';
import gpsHelper from './gps_helper';

import _ from 'lodash';
import mapRenderer from './map_renderer';
import DataFormatter from './data_formatter';

import decodeGeoHash from './geohash';

const panelDefaults = {
    ak: 'QKCqsdHBbGxBnNbvUwWdUEBjonk7jUj6',
    maxDataPoints: 1,
    theme: '',
    lat: 39.968539,
    lng: 116.497856,
    initialZoom: 14,
    autoFocusCenterDistance: 10000,
    valueName: 'current',
    locationData: 'json result',
    gpsType: 'BD09',
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
    gpsTypeName: 'gpsType',

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

function getFilterColor(originOption) {
    const styleOption = {};
    ['fillColor', 'strokeColor'].forEach((keyName) => {
        if (originOption[keyName]) {
            styleOption[keyName] = getColor(originOption[keyName], 0.5);
        }
    });
    return Object.assign({}, originOption, styleOption);
}

function filterCtx(ctx, originOption, usePolyOption = true) {
    const sourceOption = Object.assign(usePolyOption ? getDefaultPolyOption() : {}, originOption);
    const styleOption = getFilterColor(sourceOption);
    [
        ['strokeWeight', 'lineWidth'],
        ['fillColor', 'fillStyle'],
        ['strokeColor', 'strokeStyle'],
        ['strokeOpacity', 'globalAlpha']
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
    return (checkPixel.x - circlePixel.x) * (checkPixel.x - circlePixel.x)
        + (checkPixel.y - circlePixel.y) * (checkPixel.y - circlePixel.y)
        <= circleRadius * circleRadius
        ;
}

function isPointInRect(checkPixel, sourceCheckRect) {
    const checkRect = Object.assign({}, sourceCheckRect);
    if (checkRect.w < 0) {
        checkRect.x += checkRect.w;
        checkRect.w *= -1;
    }
    if (checkRect.h < 0) {
        checkRect.y += checkRect.h;
        checkRect.h *= -1;
    }
    return checkPixel.x >= checkRect.x
        && checkPixel.x <= checkRect.x + checkRect.w
        && checkPixel.y >= checkRect.y
        && checkPixel.y <= checkRect.y + checkRect.h;
}

function isPointInPoly(checkPixel, polyPoints) {
    const x = checkPixel.x;
    const y = checkPixel.y;

    let inside = false;
    for (let i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
        const xi = polyPoints[i].x;
        const yi = polyPoints[i].y;
        const xj = polyPoints[j].x;
        const yj = polyPoints[j].y;

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
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

    getPoiOption(poiType, poiConfig, defaultValue = {}) {
        const configName = 'option';
        const typeOption = this.getPoiTypeConfig(poiType, configName, {});
        const poiOption = this.getPoiConfig(poiType, poiConfig, configName, {});
        return Object.assign(defaultValue, typeOption, poiOption);
    }

    getPoiTypeConfig(poiType, configName, defaultValue = '') {
        return this.getPoiConfig(poiType, null, configName, defaultValue);
    }

    getPoiContent(poiType, poiItem, defaultValue = '') {
        const contentName = this.panel.contentName;
        return this.getPoiConfig(poiType, poiItem, contentName, defaultValue);
    }

    getCtxFields(poiType, poiItem){
        const poiOption = {};
        const ctxFields = ['strokeWeight', 'fillColor', 'strokeColor', 'strokeOpacity', 'fillOpacity', 'font'];
        ctxFields.forEach((ctxField)=>{
            const ctxValue = this.getPoiConfig(poiType, poiItem, ctxField, '');
            if(ctxValue!=''){
                poiOption[ctxField] = ctxValue;
            }
        });
        return poiOption;
    }

    getPoiConfig(poiType, poiItem, configKey, defaultValue = '') {
        if (!poiType) {
            return defaultValue;
        }
        if (poiItem && configKey in poiItem) {
            return poiItem[configKey];
        }
        const configName = this.panel.configName;
        if (poiItem && configName in poiItem && poiItem[configName].length > 0) {
            const extJson = JSON.parse(poiItem[configName]);
            if (configKey in extJson) {
                return extJson[configKey];
            }
        }
        if (this.panel.globalConfig && this.panel.globalConfig.length > 0) {
            const globalConfig = JSON.parse(this.panel.globalConfig);
            if (poiType in globalConfig && configKey in globalConfig[poiType]) {
                return globalConfig[poiType][configKey];
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
        this.addEditorTab('Baidumap', 'public/plugins/huizhong-baidumap-panel/partials/editor.html', 2);
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

    getPoiInfoWindowHandler(poiType, point, poiItem, defaultContent = '') {
        const that = this;
        return (e) => {
            let clickPoint = point;
            if (!clickPoint) {
                clickPoint = e.point;
            }
            const poiContent = that.getPoiContent(poiType, poiItem, defaultContent);
            if (!poiContent) {
                return;
            }
            const infoWindow = new BMap.InfoWindow(poiContent,
                that.getPoiConfig(poiType, poiItem, that.panel.contentOption, {
                    'title': that.getPoiConfig(poiType, poiItem, that.panel.contentTitle, clickPoint.lng + '|' + clickPoint.lat)
                })
            ); // 创建信息窗口对象
            that.map.openInfoWindow(infoWindow, clickPoint);
        };
    }

    addMarker(poiType, point, BMap, data) {

        // public/plugins/huizhong-baidumap-panel/images/bike.png
        const markerOption = this.getPoiOption(poiType, data);
        const iconUrl = this.getPoiConfig(poiType, data, this.panel.markerIcon, '');
        if (Number.isInteger(iconUrl)) {
            markerOption.icon = new BMap.Icon('https://api.map.baidu.com/img/markers.png', new BMap.Size(23, 25), {
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
        const pointLabel = this.getPoiConfig(poiType, data, this.panel.markerLabel, '');
        if (pointLabel.length > 0) {
            const label = new BMap.Label(pointLabel, {offset: new BMap.Size(20, -10)});
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


    getMapSourceId(poiData) {
        const poiType = this.getPoiType(poiData);
        const sourceGps = this.getPoiConfig(poiType, poiData, this.panel.gpsTypeName, this.panel.gpsType);
        let sourceGpsId = 5;
        if (sourceGps === 'WGS84') {
            sourceGpsId = 1;
        } else if (sourceGps === 'GCJ02') {
            sourceGpsId = 3;
        } else if (sourceGps === 'WGS84OFFLINE') {
            sourceGpsId = 11;
        } else if (sourceGps === 'GCJ02OFFLINE') {
            sourceGpsId = 13;
        }
        return sourceGpsId;
    }

    getPoiType(poiData) {
        const pointTypeName = this.panel.pointName;
        return poiData[this.panel.typeName] || pointTypeName;
    }

    addNode(BMap) {
        const that = this;
        const poiList = this.data;
        this.map.clearOverlays();
        this.clickHandler = [];

        const shapeMap = [];
        const translatePointListMap = new Map();
        const callbackList = [];

        let rawLength = 0;
        const translatedItems = [];

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
                    const poiType = that.getPoiType(translatedItem.gps);

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

                const pointTypeName = 'Point';
                if (shapeMap[pointTypeName]) {
                    const pointArray = shapeMap[pointTypeName];
                    const points = [];
                    pointArray.forEach((v) => {
                        v.points.forEach((point) => {
                            point.poiData = v.poiData;
                            points.push(point);
                        });
                    });
                    const pointCollection = new BMap.PointCollection(points, getFilterColor(that.getPoiTypeOption(pointTypeName)));
                    pointCollection.addEventListener('click', (e) => {
                        const poiData = e.point.poiData;
                        delete e.point[poiData];
                        that.getPoiInfoWindowHandler(pointTypeName, e.point, poiData)(e);
                    });
                    that.map.addOverlay(pointCollection);
                }

                const heatPoiType = that.panel.bdHeatRouteName;
                if (shapeMap[heatPoiType]) {
                    const heatShapeList = shapeMap[heatPoiType];
                    const heatmapOverlay = new BMapLib.HeatmapOverlay(
                        Object.assign(
                            {
                                radius: 20,
                            },
                            that.getPoiTypeOption(heatPoiType)
                        ));
                    that.map.addOverlay(heatmapOverlay);
                    const dataList = [];
                    heatShapeList.forEach((v) => {
                        v.points.forEach((point) => {
                            dataList.push(({
                                lng: point.lng,
                                lat: point.lat,
                                count: that.getPoiConfig(heatPoiType, v.poiData, that.panel.heatCount, 1)
                            }));
                        });
                    });
                    heatmapOverlay.setDataSet({
                        data: dataList,
                        max: that.getPoiTypeConfig(heatPoiType, that.panel.heatMax, 100)
                    });
                }

                const labelTypeName = that.panel.bdLabelName;
                if (shapeMap[labelTypeName]) {
                    const labelArray = shapeMap[labelTypeName];
                    labelArray.forEach((v) => {
                        v.points.forEach((point) => {
                            const labelText = that.getPoiContent(labelTypeName, v.poiData);
                            const labelItem = new BMap.Label(labelText, {
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
                const markerTypeName = that.panel.bdMarkerName;
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

                [that.panel.bdRidingRouteName, that.panel.bdDrivingRouteName, that.panel.bdWalkingRouteName].forEach((poiType) => {
                    if (poiType in shapeMap) {
                        const poiTypeMap = {};
                        poiTypeMap[that.panel.bdRidingRouteName] = 'RidingRoute';
                        poiTypeMap[that.panel.bdDrivingRouteName] = 'DrivingRoute';
                        poiTypeMap[that.panel.bdWalkingRouteName] = 'WalkingRoute';
                        shapeMap[poiType].forEach((item) => {
                            const points = item.points;
                            for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex++) {
                                const driving = new BMap[poiTypeMap[poiType]](that.map, {
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
                const lastCenterPoint = that.centerPoint;
                let [centerPointCount, centerPointLngTotal, centerPointLatTotal] = [0, 0, 0];
                [that.panel.centerName].forEach((poiType) => {
                    if (poiType in shapeMap) {
                        shapeMap[poiType].forEach((item) => {
                            item.points.forEach((point) => {
                                centerPointCount += 1;
                                centerPointLngTotal += point.lng;
                                centerPointLatTotal += point.lat;
                            });
                        });
                    }
                });
                if (centerPointCount > 0) {
                    that.centerPoint = new BMap.Point(
                        centerPointLngTotal / centerPointCount,
                        centerPointLatTotal / centerPointCount,
                    );
                } else {
                    that.centerPoint = new BMap.Point(that.panel.lng, that.panel.lat);
                }
                if (that.panel.autoFocusCenterDistance >= 0
                    && (!lastCenterPoint || that.map.getDistance(lastCenterPoint, that.centerPoint) > that.panel.autoFocusCenterDistance)) {
                    that.panToCenterPoint();
                }
                [that.panel.bdPolylineName, that.panel.bdPolygonName, that.panel.bdCircleName].forEach((poiType) => {
                    if (shapeMap[poiType]) {
                        const poiTypeMap = {};
                        poiTypeMap[that.panel.bdPolylineName] = 'Polyline';
                        poiTypeMap[that.panel.bdPolygonName] = 'Polygon';
                        poiTypeMap[that.panel.bdCircleName] = 'Circle';
                        shapeMap[poiType].forEach((item) => {
                            const poiOption = Object.assign(
                                getDefaultPolyOption(),
                                getFilterColor(that.getPoiOption(item.poiType, item.poiData))
                            );
                            const circleRadius = that.getPoiConfig(item.poiType, item.poiData, that.panel.circleRadius, 20);
                            if (poiType === that.panel.bdCircleName) {
                                item.points.forEach((point) => {
                                    const shape = new BMap[poiTypeMap[poiType]](point, circleRadius, poiOption);
                                    that.map.addOverlay(shape);
                                    shape.addEventListener('click', that.getPoiInfoWindowHandler(poiType, point, item.poiData));
                                });
                            } else {
                                const shape = new BMap[poiTypeMap[poiType]](item.points, poiOption);
                                that.map.addOverlay(shape);
                                shape.addEventListener('click', that.getPoiInfoWindowHandler(poiType, null, item.poiData));
                            }
                        });
                    }
                });
                const labelPoiTypes = [that.panel.labelName];
                const linePoiTypes = [that.panel.polygonName, that.panel.polylineName];
                const dotPoiTypes = [that.panel.squareName, that.panel.circleName, that.panel.pointName];
                const canvasTypes = [...labelPoiTypes, ...dotPoiTypes, ...linePoiTypes];

                const canvasLayerUpdater = (canvasLayer) => {
                    const ctx = canvasLayer.canvas.getContext('2d');
                    if (!ctx) {
                        return [];
                    }
                    const matchItems = [];
                    ctx.save();
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    if (that.panel.maskColor) {
                        ctx.beginPath();
                        ctx.fillStyle = that.panel.maskColor;
                        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                        ctx.closePath();
                    }
                    ctx.restore();
                    linePoiTypes.forEach((poiType) => {
                        if (shapeMap[poiType]) {
                            shapeMap[poiType].forEach((item) => {
                                ctx.save();
                                ctx.beginPath();
                                const poiOption = Object.assign({},
                                    that.getPoiOption(poiType, item.poiData),
                                    that.getCtxFields(poiType, item.poiData)
                                );
                                filterCtx(ctx, poiOption);
                                const startPoint = that.map.pointToPixel(item.points[0]);
                                ctx.moveTo(startPoint.x, startPoint.y);
                                for (let pointIndex = 1; pointIndex < item.points.length; pointIndex++) {
                                    const linePoint = that.map.pointToPixel(item.points[pointIndex]);
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
                    dotPoiTypes.forEach((poiType) => {
                        if (shapeMap[poiType]) {
                            shapeMap[poiType].forEach((item) => {
                                item.points.forEach((point) => {
                                    ctx.save();
                                    const isCircle = poiType === that.panel.circleName;
                                    const isPoint = poiType === that.panel.pointName;
                                    const layerItem = {
                                        lng: point.lng,
                                        lat: point.lat,
                                        size: that.getPoiConfig(poiType, item.poiData, that.panel.pointSize, // 优先使用字段size
                                            that.getPoiConfig(poiType, item.poiData, isCircle ? that.panel.circleRadius :
                                            (isPoint ? that.panel.pointSize : that.panel.squareLength), isCircle ? 10 :
                                            (isPoint ? 5 : 20)))
                                    };
                                    ctx.beginPath();
                                    const poiOption = Object.assign({},
                                        {
                                            'fillColor': getColor(that.getPoiConfig(poiType, item.poiData, that.panel.fillColor, 'blue'), 0.4)
                                        },
                                        that.getPoiOption(poiType, item.poiData),
                                        that.getCtxFields(poiType, item.poiData)
                                    );
                                    filterCtx(ctx, poiOption);
                                    const posRect = getDotRect(that.map, parseFloat(layerItem.lng),
                                        parseFloat(layerItem.lat), layerItem.size, !isCircle && !isPoint);
                                    if (isPoint) {
                                        ctx.arc(posRect.x, posRect.y, layerItem.size, 0, 2 * Math.PI);
                                    } else if (isCircle) {
                                        ctx.arc(posRect.x, posRect.y, posRect.w, 0, 2 * Math.PI);
                                    } else {
                                        ctx.rect(posRect.x, posRect.y, posRect.w, posRect.h);
                                    }
                                    ctx.closePath();
                                    if (!isPoint) {
                                        if (that.getPoiConfig(poiType, item.poiData, that.panel.isStroke, false)) {
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
                    labelPoiTypes.forEach((poiType) => {
                        if (shapeMap[poiType]) {
                            shapeMap[poiType].forEach((item) => {
                                ctx.save();
                                ctx.beginPath();
                                const labelText = that.getPoiContent(poiType, item.poiData);
                                const poiOption = Object.assign({},
                                    that.getPoiOption(poiType, item.poiData),
                                    that.getCtxFields(poiType, item.poiData)
                                );
                                filterCtx(ctx, poiOption, false);
                                for (let pointIndex = 0; pointIndex < item.points.length; pointIndex++) {
                                    ctx.beginPath();
                                    const labelPoint = that.map.pointToPixel(item.points[pointIndex]);
                                    ctx.fillText(labelText, labelPoint.x, labelPoint.y);
                                }
                                ctx.restore();
                            });
                        }
                    });
                    return matchItems;
                };

                const canvasLayerPointChecker = (checkPoint) => {
                    console.log('check pos: ', checkPoint);
                    const checkPixel = that.map.pointToPixel(checkPoint);
                    const matchItems = [];
                    dotPoiTypes.reverse()
                        .forEach((poiType) => {
                            if (shapeMap[poiType]) {
                                shapeMap[poiType].forEach((item) => {
                                    item.points.forEach((point) => {
                                        const isCircle = poiType === that.panel.circleName;
                                        const isPoint = poiType === that.panel.pointName;
                                        const layerItem = {
                                            lng: point.lng,
                                            lat: point.lat,
                                            size: that.getPoiConfig(poiType, item.poiData, that.panel.pointSize, // 优先使用字段size
                                                that.getPoiConfig(poiType, item.poiData, isCircle ? that.panel.circleRadius :
                                                (isPoint ? that.panel.pointSize : that.panel.squareLength), isCircle ? 10 :
                                                (isPoint ? 5 : 20)))
                                        };
                                        const posRect = getDotRect(that.map, parseFloat(layerItem.lng),
                                            parseFloat(layerItem.lat), layerItem.size, !isCircle);
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
                    linePoiTypes.reverse()
                        .forEach((poiType) => {
                            if (shapeMap[poiType]) {
                                shapeMap[poiType].forEach((item) => {
                                    if (poiType === that.panel.polygonName
                                        && isPointInPoly(checkPixel, item.points.map(p => that.map.pointToPixel(p)))
                                    ) {
                                        matchItems.push([checkPoint, poiType, item.poiData, item.points]);
                                    }
                                });
                            }
                        });
                    console.log('matchItems count:', matchItems.length);
                    return matchItems;
                };

                if (canvasTypes.some(canvasType => shapeMap[canvasType]) || that.panel.maskColor) {
                    const canvasLayer = new BMap.CanvasLayer({
                        paneName: 'mapPane',
                        zIndex: -999,
                        update: function () {
                            canvasLayerUpdater(this);
                        }
                    });
                    that.map.addOverlay(canvasLayer);
                    that.clickHandler.push((event) => {
                        let matchItems = canvasLayerPointChecker(event.point);
                        matchItems = matchItems.filter(matchItem => that.getPoiContent(matchItem[1], matchItem[2]));
                        if (matchItems.length > 0) {
                            const matchItem = matchItems[0];
                            that.getPoiInfoWindowHandler(matchItem[1], event.point, matchItem[2])(event);
                        }
                    });
                }
            }
        }

        function translateOne(poiIndex, gpsIndex, gps) {
            rawLength += 1;
            // 转换坐标
            const sourceGpsId = that.getMapSourceId(gps);
            if (sourceGpsId > 3) {
                let newGps = {};
                if (sourceGpsId === 5) {
                    newGps = {lng: gps.lng, lat: gps.lat};
                } else if (sourceGpsId === 11) {
                    newGps = gpsHelper.gpsToBaidu(gps.lat, gps.lng);
                } else if (sourceGpsId === 13) {
                    newGps = gpsHelper.chinaToBaidu(gps.lat, gps.lng);
                }
                setTimeout(function () {
                    translateCallback(poiIndex, gpsIndex, gps, newGps);
                }, 1);
            } else {
                const point = new BMap.Point(gps.lng, gps.lat);
                if (!translatePointListMap.has(sourceGpsId)) {
                    translatePointListMap.set(sourceGpsId, []);
                }
                translatePointListMap.get(sourceGpsId)
                    .push(point);
                callbackList.push(translateCallback.bind(this, poiIndex, gpsIndex, gps));
            }
        }

        console.log(poiList);
        if (poiList) {
            for (let i = 0; i < poiList.length; i++) {
                const poiIndex = i;
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
                        let items = gpsStr.split('|');
                        if (items.length === 1) {
                            items = gpsStr.split(',');
                        }
                        const [lng, lat] = items;
                        const gpsItem = Object.assign({}, poiList[poiIndex]);
                        gpsItem.lng = parseFloat(lng.trim());
                        gpsItem.lat = parseFloat(lat.trim());
                        translateOne(poiIndex, gpsIndex, gpsItem, BMap);
                    }
                }
            }
            for (const sourceMapId of translatePointListMap.keys()) {
                const sourcePointList = translatePointListMap.get(sourceMapId);
                if (sourcePointList.length > 0) {
                    const convertor = new BMap.Convertor();
                    const groupSize = 10;
                    for (let groupIndex = 0; groupIndex < sourcePointList.length; groupIndex += groupSize) {
                        const pointList = [];
                        for (let pointIndex = 0; pointIndex < groupSize && pointIndex + groupIndex < sourcePointList.length; pointIndex++) {
                            pointList.push(sourcePointList[groupIndex + pointIndex]);
                        }
                        convertor.translate(pointList, sourceMapId, 5, (result) => {
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
            }
        }
    }

    panToCenterPoint() {
        if (this.centerPoint) {
            this.map.panTo(this.centerPoint);
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
