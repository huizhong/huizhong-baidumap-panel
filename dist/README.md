## Baidumap Panel Plugin for Grafana

Grafana的百度地图插件，基于WorldMap修改，遵从grafana插件机制。主要的可视化功能有：更换AK.添加/删除控件.更换主题.更改地图级别。数据功能支持数据标注.点聚合等功能。

![Baidumap](https://raw.githubusercontent.com/shcolo/grafana-baidumap-panel/master/src/images/baidumap.png)

## Run
### Development
```bush
git clone https://github.com/shcolo/grafana-baidumap-panel.git
npm install
```
### Production(Build)
```bush
grunt
```

### 添加数据示例代码

数据源mysql，Location Data：json result

select
now() as time, 
'116.487823|39.991956' as pos,
-10 as rssi,
'设备编号xxx' as devEUI,
'设备类型xxx' as type

选填参数 poiType，如果填'line'的话对应线条，如果填'polygon'的话对应多边形（自动连接尾首），填'heat'的话，对应图力图
支持批量点。字段为 pos: "lng1|lat1;lng2|lat2;lng3|lat3"

### 图标替换
images/bike.png 地图页图标
images/pins6.png 详情页图标
