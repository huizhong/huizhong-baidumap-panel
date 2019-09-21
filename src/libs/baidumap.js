function loadJsFile(fileName) {
    const fileElement = document.createElement('script');
    fileElement.type = 'text/javascript';
    fileElement.src = fileName;
    document.head.appendChild(fileElement);
}

export function MP(ak) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'http://api.map.baidu.com/api?v=3.0&ak=' + ak + '&callback=init';
        script.onerror = reject;
        document.head.appendChild(script);

        setTimeout(() => {
            loadJsFile('http://api.map.baidu.com/library/TextIconOverlay/1.2/src/TextIconOverlay_min.js');
            loadJsFile('http://api.map.baidu.com/library/MarkerClusterer/1.2/src/MarkerClusterer_min.js');
            loadJsFile('http://api.map.baidu.com/library/Heatmap/2.0/src/Heatmap_min.js');
            loadJsFile('http://api.map.baidu.com/library/DistanceTool/1.2/src/DistanceTool_min.js');
            loadJsFile('http://api.map.baidu.com/library/RectangleZoom/1.2/src/RectangleZoom_min.js');
            loadJsFile('http://api.map.baidu.com/library/TrafficControl/1.4/src/TrafficControl_min.js');
            resolve(BMap);
        }, 500);
    });
}
