"use strict";

System.register(["./baidumap_ctrl", "app/plugins/sdk"], function (_export, _context) {
  "use strict";

  var BaidumapCtrl, loadPluginCss;
  return {
    setters: [function (_baidumap_ctrl) {
      BaidumapCtrl = _baidumap_ctrl.default;
    }, function (_appPluginsSdk) {
      loadPluginCss = _appPluginsSdk.loadPluginCss;
    }],
    execute: function () {
      /* eslint import/no-extraneous-dependencies: 0 */
      loadPluginCss({
        dark: "plugins/huizhong-baidumap-panel/css/baidumap.dark.css",
        light: "plugins/huizhong-baidumap-panel/css/baidumap.light.css"
      });

      /* eslint import/prefer-default-export: 0 */

      _export("PanelCtrl", BaidumapCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
