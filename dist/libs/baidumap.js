'use strict';

System.register([], function (_export, _context) {
    "use strict";

    function loadJsFile(fileName) {
        var fileElement = document.createElement('script');
        fileElement.setAttribute('type', 'text/javascript');
        fileElement.setAttribute('src', fileName);
        document.head.appendChild(fileElement);
    }

    function loadCssFile(fileName) {
        var fileElement = document.createElement('link');
        fileElement.setAttribute('rel', 'stylesheet');
        fileElement.setAttribute('type', 'text/css');
        fileElement.setAttribute('href', fileName);
        document.head.appendChild(fileElement);
    }

    function MP(ak) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'http://api.map.baidu.com/api?v=3.0&ak=' + ak + '&callback=init';
            script.onerror = reject;
            document.head.appendChild(script);

            setTimeout(function () {
                loadJsFile('http://api.map.baidu.com/library/TextIconOverlay/1.2/src/TextIconOverlay_min.js');
                loadJsFile('http://api.map.baidu.com/library/MarkerClusterer/1.2/src/MarkerClusterer_min.js');
                loadJsFile('http://api.map.baidu.com/library/Heatmap/2.0/src/Heatmap_min.js');
                loadJsFile('http://api.map.baidu.com/library/DistanceTool/1.2/src/DistanceTool_min.js');
                loadJsFile('http://api.map.baidu.com/library/RectangleZoom/1.2/src/RectangleZoom_min.js');
                loadJsFile('http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.js');
                loadCssFile('http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.css');
                resolve(BMap);
            }, 500);
        });
    }

    _export('MP', MP);

    return {
        setters: [],
        execute: function () {}
    };
});
//# sourceMappingURL=baidumap.js.map
