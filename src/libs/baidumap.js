function loadJsFile(fileName, reject = null) {
    const fileElement = document.createElement('script');
    fileElement.setAttribute('type', 'text/javascript');
    fileElement.setAttribute('src', fileName);
    if (reject) {
        fileElement.onerror = reject;
    }
    document.head.appendChild(fileElement);
}

function loadCssFile(fileName, reject = null) {
    const fileElement = document.createElement('link');
    fileElement.setAttribute('rel', 'stylesheet');
    fileElement.setAttribute('type', 'text/css');
    fileElement.setAttribute('href', fileName);
    if (reject) {
        fileElement.onerror = reject;
    }
    document.head.appendChild(fileElement);
}

function waitLoading(checkFun, runFun, checkTime, maxTime) {
    if (checkFun() && maxTime > checkTime) {
        runFun();
    } else {
        setTimeout(() => waitLoading(checkFun, runFun, checkTime, maxTime - checkTime), checkTime);
    }
}

export function MP(ak) {
    return new Promise((resolve, reject) => {
        loadJsFile('http://api.map.baidu.com/api?v=3.0&ak=' + ak + '&callback=init', reject);
        waitLoading(() => (typeof (BMap) !== 'undefined'), () => {
            loadJsFile('http://api.map.baidu.com/library/TextIconOverlay/1.2/src/TextIconOverlay_min.js', reject);
            loadJsFile('http://api.map.baidu.com/library/MarkerClusterer/1.2/src/MarkerClusterer_min.js', reject);
            loadJsFile('http://api.map.baidu.com/library/Heatmap/2.0/src/Heatmap_min.js', reject);
            loadJsFile('http://api.map.baidu.com/library/DistanceTool/1.2/src/DistanceTool_min.js', reject);
            loadJsFile('http://api.map.baidu.com/library/RectangleZoom/1.2/src/RectangleZoom_min.js', reject);

            loadJsFile('http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.js', reject);
            loadCssFile('http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.css', reject);
            waitLoading(() => (typeof (BMapLib) !== 'undefined'), () => {
                resolve(BMap);
            }, 100, 60000);
        }, 100, 60000);
    });
}
