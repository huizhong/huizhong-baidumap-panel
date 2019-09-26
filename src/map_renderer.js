/* eslint-disable no-plusplus */
import './css/leaflet.css!';
import {MP} from './libs/baidumap.js';


export default function link(scope, elem, attrs, ctrl) {
    ctrl.events.on('render', () => {
        render();
        ctrl.renderingCompleted();
    });

    function render() {
        if (!ctrl.data && ctrl.map) return;

        const mapContainer = elem.find('.mapcontainer');

        if (mapContainer[0].id.indexOf('{{') > -1) {
            return;
        }

        if (!ctrl.map) {
            MP(ctrl.panel.ak)
                .then(BMap => {
                    console.log('start');
                    const elementId = 'mapid_' + ctrl.panel.id;
                    ctrl.BMap = BMap;
                    ctrl.map = new BMap.Map(elementId, {
                        enableMapClick: ctrl.panel.enableMapClick
                    });
                    ctrl.map.centerAndZoom(new BMap.Point(ctrl.panel.lng, ctrl.panel.lat), parseInt(ctrl.panel.initialZoom, 10));
                    ctrl.map.enableScrollWheelZoom();
                    ctrl.map.setMapStyle({style: ctrl.panel.theme});

                    ctrl.navigationSwitch = new BMap.NavigationControl();
                    ctrl.scaleSwitch = new BMap.ScaleControl();
                    ctrl.overviewMapSwitch = new BMap.OverviewMapControl({
                        isOpen: true,
                        anchor: BMAP_ANCHOR_BOTTOM_RIGHT
                    });
                    ctrl.mapTypeSwitch = new BMap.MapTypeControl();

                    if (ctrl.panel.navigation === true) ctrl.map.addControl(ctrl.navigationSwitch);
                    if (ctrl.panel.scale === true) ctrl.map.addControl(ctrl.scaleSwitch);
                    if (ctrl.panel.overviewMap === true) ctrl.map.addControl(ctrl.overviewMapSwitch);
                    if (ctrl.panel.mapType === true) ctrl.map.addControl(ctrl.mapTypeSwitch);

                    ctrl.map.addEventListener('dragend', function () {
                        const center = ctrl.map.getCenter();
                        ctrl.panel.lat = center.lat;
                        ctrl.panel.lng = center.lng;
                    });

                    // eslint-disable-next-line no-unused-expressions
                    setTimeout(function (e) {
                        ctrl.distanceTool = new BMapLib.DistanceTool(ctrl.map);
                        ctrl.rectangleZoomTool = new BMapLib.RectangleZoom(ctrl.map, {
                            followText: '拖拽鼠标进行操作',
                            autoClose: true
                        });

                        ctrl.trafficSwitch = new BMapLib.TrafficControl({
                            showPanel: false, // 是否显示路况提示面板
                        });
                        ctrl.trafficSwitch.setOffset(new BMap.Size(10, 40));
                        // ctrl.trafficSwitch.setAnchor(BMAP_ANCHOR_BOTTOM_RIGHT);
                        if (ctrl.panel.traffic === true) {
                            ctrl.map.addControl(ctrl.trafficSwitch);
                        }
                    }, 1000);

                    const menu = new BMap.ContextMenu();
                    const txtMenuItem = [
                        {
                            text: '测距',
                            callback: function () {
                                ctrl.distanceTool.open();
                            }
                        },
                        {
                            text: '拉框放大',
                            callback: function () {
                                ctrl.rectangleZoomTool.open();
                            }
                        }, {
                            text: '重置地图',
                            callback: function callback() {
                                ctrl.map.reset();
                            }
                        },
                    ];

                    for (let menuIndex = 0; menuIndex < txtMenuItem.length; menuIndex++) {
                        menu.addItem(new BMap.MenuItem(txtMenuItem[menuIndex].text, txtMenuItem[menuIndex].callback, 100));
                    }
                    ctrl.map.addContextMenu(menu);

                    const map = ctrl.map;
                    var marker = new BMap.Marker(new BMap.Point(116.404, 39.915)); // 创建点
                    map.addOverlay(marker);            //增加点
                    marker.addEventListener('click', overlay_style);

                    var polyline = new BMap.Polyline([
                        new BMap.Point(116.383752, 39.91334),
                        new BMap.Point(116.38792, 39.920866),
                        new BMap.Point(116.390867, 39.906532)
                    ], {strokeColor: 'blue', strokeWeight: 6, strokeOpacity: 0.5});   //创建折线
                    polyline.addEventListener('click', overlay_style);
                    map.addOverlay(polyline);          //增加折线

                    var circle = new BMap.Circle(new BMap.Point(116.415157, 39.914004), 500, {
                        strokeColor: 'blue',
                        strokeWeight: 6,
                        strokeOpacity: 0.5
                    }); //创建圆
                    map.addOverlay(circle);            //增加圆
                    circle.addEventListener('click', overlay_style);

                    //获取marker的属性
                    function overlay_style(e) {
                        var p = e.target;
                        if (p instanceof BMap.Marker) {
                            alert('该覆盖物是点，点的坐标是：' + p.getPosition().lng + ',' + p.getPosition().lat);
                        } else if (p instanceof BMap.Circle) {
                            alert('该覆盖物是圆，圆的半径是：' + p.getRadius() + '，圆的中心点坐标是：' + p.getCenter().lng + ',' + p.getCenter().lat);
                        } else if (p instanceof BMap.Polyline) {
                            alert('该覆盖物是折线，所画点的个数是：' + p.getPath().length);
                        } else {
                            alert('无法获知该覆盖物类型');
                        }
                    }

                    ctrl.addNode(BMap);
                });
        }
    }
}
