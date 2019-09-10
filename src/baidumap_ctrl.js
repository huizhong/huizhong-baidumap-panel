/* eslint-disable eqeqeq,id-length,no-inner-declarations */
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
  lat: 39.915,
  lng: 116.404,
  initialZoom: 11,
  valueName: 'current',
  locationData: 'table',
  icon: 'Label',
  esMetric: 'Count',
  decimals: 0,
  navigation: true,
  scale: true,
  hideEmpty: false,
  overviewMap: false,
  hideZero: false,
  mapType: true
};
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
    const myIcon = new BMap.Icon('public/plugins/grafana-baidumap-panel/images/bike.png', new BMap.Size(30, 30));
    const marker = new BMap.Marker(point, {icon: myIcon});

    this.markers.push(marker);

    // this.map.setViewport(pointArray);
    marker.enableDragging();
    let scontent = '';
    scontent += '<a href=""><div class="infobox" id="infobox"><div class="infobox-content" style="display:block">';
    scontent += '<div class="infobox-header"><div class="infobox-header-icon"><img src="public/plugins/grafana-baidumap-panel/images/pins6.png"></div>';
    scontent += '<div class="infobox-header-name"><p>' + data.devEUI + '</p></div>';
    scontent += '<div class="infobox-header-type" style="min-width:250px"><p>' + data.type + '</p></div></div>';
    scontent += '<div class="infobox-footer">' + data.text + '</div>';
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
    const list = this.data;
    this.map.clearOverlays();
    console.log(list);
    if (list) {
      const lineArray = [];
      const heatArray = [];
      const markerArray = [];
      const convertor = new BMap.Convertor();

      let rawLength = 0;
      const translatedElements = [];

      for (let i = 0; i < list.length; i++) {
        setTimeout((function (index) {
          return function () {
            if (list[index].lng > 0 && list[index].lat > 0) {
              rawLength++;
              translateOne(index, list[index], BMap);
            }
          };
        }(i)), i * 10);
      }

      function translateOne(index, gps, BMap) {
        function translateCallback(returnedData) {
          if (returnedData.status == 0) {
            translatedElements.push({
              index: index,
              point: returnedData.points[0],
              gps: gps
            });

            if (translatedElements.length == rawLength) {
              translatedElements.sort(function (a, b) {
                return a.index - b.index;
              });
              for (let i = 0; i < translatedElements.length; i++) {
                const fport = translatedElements[i].gps.fport;
                if (fport == '5') {
                  const heatPoint = {
                    lng: translatedElements[i].point.lng,
                    lat: translatedElements[i].point.lat,
                    count: translatedElements[i].gps.rssi
                  };
                  heatArray.push(heatPoint);
                } else if (fport == '33') {
                  lineArray.push(translatedElements[i].point);
                } else {
                  markerArray.push({point: translatedElements[i].point, data: translatedElements[i].gps});
                }
              }

              if (heatArray.length > 0) {
                // 热力图
                if (!isSupportCanvas()) {
                  alert('热力图目前只支持有canvas支持的浏览器,您所使用的浏览器不能使用热力图功能~');
                }
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
                  let div = document.createElement('div');
                  let content = '<div id="heatmap_mark"><div><span class="heatmap_mark_title">颜色对应RSSI信号强度</span> <span class="heatmap_mark_text" style="float:right;padding-top:5px" id="heatmap_mark_density">dBm</span></div><div class="linear_color"></div><span class="heatmap_blue heatmap_mark_text heatmap_color_span">-60以下</span><span class="heatmap_green heatmap_mark_text heatmap_color_span">-60至-80</span><span class="heatmap_yellow heatmap_mark_text heatmap_color_span">-80至-100</span><span class="heatmap_red heatmap_mark_text heatmap_color_span">-100至-120</span><span class="heatmap_result_red heatmap_mark_text heatmap_color_span">-120以上</span></div>';
                  div.innerHTML = content;

                  that.map.getContainer()
                    .appendChild(div);
                  return div;
                };

                const myZoomCtrl = new ZoomControl();
                // eslint-disable-next-line eqeqeq
                that.map.addControl(myZoomCtrl);
                // eslint-disable-next-line eqeqeq
              }
              if (lineArray.length > 0) {
                const polyline = new BMap.Polyline(lineArray, {
                  enableEditing: false,
                  enableClicking: true,
                  strokeWeight: '4',
                  strokeOpacity: 0.5,
                  strokeColor: 'blue'
                });
                that.map.addOverlay(polyline);
              }
              if (markerArray.length > 0) {
                for (let i = 0; i < markerArray.length; i++) {
                  that.addMarker(markerArray[i].point, BMap, markerArray[i].data);
                }
                new BMapLib.MarkerClusterer(this.map, {
                  markers: this.markers
                });
              }
            }
          } else {
            console.log('转换出错: ' + returnedData.status);
          }
        }

        // 转换坐标
        const point = new BMap.Point(gps.lng, gps.lat);
        convertor.translate(new Array(point), 5, 5, translateCallback); // 不转换
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
