## Baidumap Panel Plugin for Grafana

Grafana的百度地图插件，基于WorldMap修改。主要的可视化功能有：更换AK.添加/删除控件.更换主题.更改地图级别，测距工具、实时交通流量图等。
支持十多种形式的数据图形标注。

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

简单的，显示一个点
```SQL

select
now() as time,
116.483749  as longitude,
39.991654  as latitude
```

可以配置一些参数
```sql
select
now() as time, 
116.483749  as longitude,
39.991654  as latitude,
"<h2>我是点击显示内容，支持文本和HTML</h2>" as content,
'{"content":"我是一个点","size":5}' as config
```

支持还有其它类型混合配置

```SQL


select
now() as time, 
'Marker' as type,
'116.487777|39.992133' as pos,
'{"content":"<p>hh</p>"}' as config

union


select
now() as time, 
'Marker' as type,
'116.484538|39.991283' as pos,
'{"content":"设备编号xxx","option":{"title":"设备类型xxx", "searchTypes":[]},"desc":"设备描述xxx","icon":3,"label":"自定义图标0~9"}' as config

union

select
now() as time, 
'RidingRoute' as type,
'116.479702|39.991890;116.481088|39.995819;116.473447|39.994073;116.494455|39.986754' as pos,
'{"option":{"strokeColor":"red"}}' as config
union


select
now() as time, 
'Heat' as type,
'116.487777|39.992133;116.492202|39.990220' as pos,
'{"count":50}' as config


```

自定义的方块，支持海量显示
```SQL
select
now() as time, 
'square' as type,
'116.487777|39.992133;116.484538|39.991283' as pos,
'{"option":{"fillColor":30},"length":160}' as config
```

自定义图标和动画
```sql

select
now() as time, 
'Marker' as type,
 '116.490502' as longitude,
 '39.988408' as latitude,
'{"name":"设备编号xxx","type":"设备类型xxx","desc":"设备描述xxx","icon":"public/plugins/grafana-baidumap-panel/images/bike.png","animation":true}' as config

```

支持海量的多边形，兼容填充和边框颜色配置
```sql

select
now() as time, 
'polygon' as type,
'ppolygon' as content,
'116.485023|39.995332;116.484538|39.991283;116.483927|39.985900;116.490502|39.988408;116.490646|39.991946;116.485400|39.995442' as pos,
'{"option":{"strokeColor":"red", "fillColor":"blue", "strokeWeight":8,"strokeOpacity":0.5,"fillOpacity":0.1}}' as config

```

支持文本显示,content（优先）或者config都支持。
```sql
select
now() as time, 
'label' as type,
'116.49194186142773|39.98928445031799' as pos,
'哈哈哈' as content,
'{"content":"哈哈哈哈哈哈哈哈哈哈哈哈", "option":{"font":"24px STheiti, SimHei"}}' as config
```

还可以增加中心点，方便自动定位
```sql
select now() as time,
'center' as type,
'116.45571320020859|39.992292022563696;116.46519930639396|39.9452342890919' as pos
```

点集pos格式可以是经度+纬度，geohash或者"lng1|lat1;lng2|lat2;lng3|lat3"（|可以换成,)这种点集。

不同类型有不同的配置如示例，可以在配置页面自定义默认值如下：
```json
{
    "Marker":{
        "label":"默认说明",
        "enableDragging": true
     },
    "square":{
        "size":100
    },
    "circle": {
        "alpha": 0.3
    },
    "Heat": {
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
