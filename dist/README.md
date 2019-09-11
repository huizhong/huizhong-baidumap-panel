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
116.487823 as lat,
39.991956 as lng,
-10 as rssi,
'设备编号xxx' as devEUI,
'设备类型xxx' as type

选填参数 poiType，如果填33的话对应线条，填5的话，对应图力图

### 图标替换
images/bike.png 地图页图标
images/pins6.png 详情页图标
