export function MP(ak) {
  return new Promise((resolve, reject) => {
    let script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://api.map.baidu.com/api?v=3.0&ak=" + ak + "&callback=init";
    script.onerror = reject;
    document.head.appendChild(script);

    setTimeout(() => {
      let textIconOverlay = document.createElement("script");
      textIconOverlay.type = "text/javascript";
      textIconOverlay.src = "http://api.map.baidu.com/library/TextIconOverlay/1.2/src/TextIconOverlay_min.js";
      document.head.appendChild(textIconOverlay);

      let markerClusterers = document.createElement("script");
      markerClusterers.type = "text/javascript";
      markerClusterers.src = "http://api.map.baidu.com/library/MarkerClusterer/1.2/src/MarkerClusterer_min.js";
      document.head.appendChild(markerClusterers);

      let heatmap = document.createElement("script");
      heatmap.type = "text/javascript";
      heatmap.src = "http://api.map.baidu.com/library/Heatmap/2.0/src/Heatmap_min.js";
      document.head.appendChild(heatmap);

      resolve(BMap);
    }, 500);
  });

}
