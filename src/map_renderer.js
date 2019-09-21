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
                    ctrl.map = new BMap.Map(elementId);
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

                    const menu = new BMap.ContextMenu();
                    const txtMenuItem = [
                        {
                            text: '开启测距',
                            callback: function () {
                                ctrl.openDistanceTool();
                            }
                        },
                        {
                            text: '关闭测距',
                            callback: function () {
                                ctrl.closeDistanceTool();
                            }
                        }
                    ];

                    for (let menuIndex = 0; menuIndex < txtMenuItem.length; menuIndex++) {
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
