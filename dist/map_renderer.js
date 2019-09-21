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
                    ctrl.map = new BMap.Map(elementId);
                    ctrl.map.centerAndZoom(new BMap.Point(ctrl.panel.lng, ctrl.panel.lat), parseInt(ctrl.panel.initialZoom, 10));
                    ctrl.map.enableScrollWheelZoom();
                    ctrl.map.setMapStyle({ style: ctrl.panel.theme });

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
                        var center = ctrl.map.getCenter();
                        ctrl.panel.lat = center.lat;
                        ctrl.panel.lng = center.lng;
                    });

                    // eslint-disable-next-line no-unused-expressions
                    setTimeout(function () {
                        ctrl.distanceTool = new BMapLib.DistanceTool(ctrl.map);
                        ctrl.rectangleZoomTool = new BMapLib.RectangleZoom(ctrl.map, {
                            followText: '拖拽鼠标进行操作',
                            autoClose: true
                        });
                        ctrl.trafficMapSwitch = new BMapLib.TrafficControl({
                            showPanel: true,
                            anchor: BMAP_ANCHOR_BOTTOM_RIGHT
                        });
                        ctrl.map.addControl(ctrl.trafficMapSwitch);
                    }, 1000);

                    var menu = new BMap.ContextMenu();
                    var txtMenuItem = [{
                        text: '测距',
                        callback: function callback() {
                            ctrl.distanceTool.open();
                        }
                    }, {
                        text: '拉框放大',
                        callback: function callback() {
                            ctrl.rectangleZoomTool.open();
                        }
                    }];

                    for (var menuIndex = 0; menuIndex < txtMenuItem.length; menuIndex++) {
                        menu.addItem(new BMap.MenuItem(txtMenuItem[menuIndex].text, txtMenuItem[menuIndex].callback, 100));
                    }
                    ctrl.map.addContextMenu(menu);

                    ctrl.addNode(BMap);
                });
            }

            //ctrl.map.resize();

            //if (ctrl.mapCenterMoved) ctrl.map.panToMapCenter();

            //if (!ctrl.map.legend && ctrl.panel.showLegend) ctrl.map.createLegend();

            //ctrl.map.drawCircles();
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
