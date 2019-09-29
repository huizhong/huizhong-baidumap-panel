'use strict';

System.register([], function (_export, _context) {
    "use strict";

    function loadJsFile(fileName) {
        var reject = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        var fileElement = document.createElement('script');
        fileElement.setAttribute('type', 'text/javascript');
        fileElement.setAttribute('src', fileName);
        if (reject) {
            fileElement.onerror = reject;
        }
        document.head.appendChild(fileElement);
    }

    function loadCssFile(fileName) {
        var reject = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        var fileElement = document.createElement('link');
        fileElement.setAttribute('rel', 'stylesheet');
        fileElement.setAttribute('type', 'text/css');
        fileElement.setAttribute('href', fileName);
        if (reject) {
            fileElement.onerror = reject;
        }
        document.head.appendChild(fileElement);
    }

    function waitLoading(checkFun, runFun, checkTime, maxTime, delayTime) {
        if (checkFun() && maxTime > checkTime) {
            setTimeout(runFun(), delayTime);
            runFun();
        } else {
            setTimeout(function () {
                return waitLoading(checkFun, runFun, checkTime, maxTime - checkTime, delayTime);
            }, checkTime);
        }
    }

    function MP(ak) {
        return new Promise(function (resolve, reject) {
            loadJsFile('http://api.map.baidu.com/api?v=3.0&ak=' + ak + '&callback=init', reject);
            waitLoading(function () {
                return typeof BMap !== 'undefined' && typeof BMap.Map !== 'undefined';
            }, function () {
                loadJsFile('http://api.map.baidu.com/library/TextIconOverlay/1.2/src/TextIconOverlay_min.js', reject);
                loadJsFile('http://api.map.baidu.com/library/MarkerClusterer/1.2/src/MarkerClusterer_min.js', reject);
                loadJsFile('http://api.map.baidu.com/library/Heatmap/2.0/src/Heatmap_min.js', reject);
                loadJsFile('http://api.map.baidu.com/library/DistanceTool/1.2/src/DistanceTool_min.js', reject);
                loadJsFile('http://api.map.baidu.com/library/RectangleZoom/1.2/src/RectangleZoom_min.js', reject);

                loadJsFile('http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.js', reject);
                loadCssFile('http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.css', reject);
                waitLoading(function () {
                    return typeof BMapLib !== 'undefined';
                }, function () {
                    resolve(BMap);
                }, 100, 60000, 100);
            }, 100, 60000, 100);
        });
    }

    _export('MP', MP);

    return {
        setters: [],
        execute: function () {}
    };
});
//# sourceMappingURL=baidumap.js.map
