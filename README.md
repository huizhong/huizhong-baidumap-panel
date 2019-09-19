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

示例
```SQL

select
now() as time, 
'marker' as type,
'116.487777|39.992133' as pos,
'{"name":"设备编号xxx","type":"设备类型xxx","desc":"设备描述xxx"}' as ext

union

select
now() as time, 
'marker' as type,
'116.484538|39.991283' as pos,
'{"name":"设备编号xxx","type":"设备类型xxx","desc":"设备描述xxx","icon":3,"label":"自定义图标0~9"}' as ext

union
select
now() as time, 
'marker' as type,
'116.490502|39.988408' as pos,
'{"name":"设备编号xxx","type":"设备类型xxx","desc":"设备描述xxx","icon":"public/plugins/grafana-baidumap-panel/images/bike.png","animation":true}' as ext

union

select
now() as time, 
'polygon' as type,
'116.485023|39.995332;116.484538|39.991283;116.483927|39.985900;116.490502|39.988408;116.490646|39.991946;116.485400|39.995442' as pos,
'{"option":{"strokeWeight":10,"strokeColor":"red"}}' as ext

union

select
now() as time, 
'heat' as type,
'116.487777|39.992133' as pos,
'{"count":50}' as ext

union

select
now() as time, 
'block' as type,
'116.487777|39.992133;116.484538|39.991283' as pos,
'{"color":30,"size":80}' as ext
union

select
now() as time, 
'pie' as type,
'116.487777|39.992133;116.490502|39.988408' as pos,
'{"color":70,"size":40}' as ext

```


点集pos格式为: "lng1|lat1;lng2|lat2;lng3|lat3"
标记类型poiType，如果填'line'的话对应线条，如果填'polygon'的话对应多边形（自动连接尾首），填'heat'的话，对应图力图
不同类型有不同的配置如示例
ext的键值对，按逗号分隔，再按冒号区分键值。
pie和block的color（0~100）是从绿到红的渐变色，size对应圆的半径和方块的边长，单位是米。
上述类型可以配置默认属性，不同元素默认配置示例：
```json
{
    "marker":{
        "label":"默认说明",
        "enableDragging": true
     },
    "block":{
        "size":100
    },
    "pie": {
        "alpha": 0.3
    },
    "heat": {
        "count": 3,
        "max": 120,
        "option":{
            "radius": 150
        }
    },
    "polygon": {
        "option":{
            "strokeWeight":8,
            "strokeColor":"blue"
        }
    }
}
```

### 图标替换
images/bike.png 地图页图标
images/pins6.png 详情页图标
