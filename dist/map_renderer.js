'use strict';

System.register(['./css/leaflet.css!', './libs/baidumap.js'], function (_export, _context) {
    "use strict";

    var MP;
    function link(scope, elem, attrs, ctrl) {
        ctrl.events.on('render', function () {
            render();
            ctrl.renderingCompleted();
        });

        function render() {
            if (!ctrl.data && ctrl.map) return;

            var mapContainer = elem.find('.mapcontainer');

            if (mapContainer[0].id.indexOf('{{') > -1) {
                return;
            }

            if (!ctrl.map) {
                MP(ctrl.panel.ak).then(function (BMap) {
                    console.log('start');
                    var elementId = 'mapid_' + ctrl.panel.id;
                    ctrl.BMap = BMap;
                    ctrl.map = new BMap.Map(elementId
                    // , {
                    // enableMapClick: ctrl.panel.enableMapClick
                    // }
                    );
                    ctrl.map.centerAndZoom(new BMap.Point(ctrl.panel.lng, ctrl.panel.lat), parseInt(ctrl.panel.initialZoom, 10));
                    ctrl.map.enableScrollWheelZoom();
                    // ctrl.map.setMapStyle({style: ctrl.panel.theme});

                    ctrl.navigationSwitch = new BMap.NavigationControl();
                    ctrl.scaleSwitch = new BMap.ScaleControl();
                    // ctrl.mapTypeSwitch = new BMap.MapTypeControl();

                    if (ctrl.panel.navigation === true) ctrl.map.addControl(ctrl.navigationSwitch);
                    if (ctrl.panel.scale === true) ctrl.map.addControl(ctrl.scaleSwitch);
                    // if (ctrl.panel.overviewMap === true) ctrl.map.addControl(ctrl.overviewMapSwitch);
                    // if (ctrl.panel.mapType === true) ctrl.map.addControl(ctrl.mapTypeSwitch);
                    //
                    // ctrl.map.addEventListener('dragend', function () {
                    //     const center = ctrl.map.getCenter();
                    //     ctrl.panel.lat = center.lat;
                    //     ctrl.panel.lng = center.lng;
                    // });
                    //
                    // ctrl.map.addEventListener('click', function (event) {
                    //     if (ctrl.clickHandler && ctrl.clickHandler.length > 0) {
                    //         ctrl.clickHandler.forEach(handler => handler(event));
                    //     }
                    // }, true);

                    // eslint-disable-next-line no-unused-expressions
                    // ctrl.distanceTool = new BMapLib.DistanceTool(ctrl.map);
                    // ctrl.rectangleZoomTool = new BMapLib.RectangleZoom(ctrl.map, {
                    //     followText: '拖拽鼠标进行操作',
                    //     autoClose: true
                    // });

                    // ctrl.trafficSwitch = new BMapLib.TrafficControl({
                    //     showPanel: false, // 是否显示路况提示面板
                    // });
                    // ctrl.trafficSwitch.setOffset(new BMap.Size(10, 40));
                    // // ctrl.trafficSwitch.setAnchor(BMAP_ANCHOR_BOTTOM_RIGHT);
                    // if (ctrl.panel.traffic === true) {
                    //     ctrl.map.addControl(ctrl.trafficSwitch);
                    // }

                    // const menu = new BMap.ContextMenu();
                    // const txtMenuItem = [
                    //     {
                    //         text: '测距',
                    //         callback: function () {
                    //             ctrl.distanceTool.open();
                    //         }
                    //     },
                    //     {
                    //         text: '拉框放大',
                    //         callback: function () {
                    //             ctrl.rectangleZoomTool.open();
                    //         }
                    //     }, {
                    //         text: '移到中心点',
                    //         callback: function callback() {
                    //             ctrl.panToCenterPoint();
                    //         }
                    //     }, {
                    //         text: '重置地图',
                    //         callback: function callback() {
                    //             ctrl.map.reset();
                    //         }
                    //     },
                    // ];

                    // for (let menuIndex = 0; menuIndex < txtMenuItem.length; menuIndex++) {
                    //     menu.addItem(new BMap.MenuItem(txtMenuItem[menuIndex].text, txtMenuItem[menuIndex].callback, 100));
                    // }
                    // ctrl.map.addContextMenu(menu);
                    ctrl.addNode(BMap);
                });
            }
        }
    }

    _export('default', link);

    return {
        setters: [function (_cssLeafletCss) {}, function (_libsBaidumapJs) {
            MP = _libsBaidumapJs.MP;
        }],
        execute: function () {}
    };
});
//# sourceMappingURL=map_renderer.js.map
