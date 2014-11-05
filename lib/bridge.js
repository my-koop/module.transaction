var Module = require("./module");
var metaData = require("../metadata/index");

var ModuleBridge = (function () {
    function ModuleBridge() {
    }
    ModuleBridge.prototype.getInstance = function () {
        return this.instance || (this.instance = new Module());
    };

    ModuleBridge.prototype.onAllModulesInitialized = function () {
        this.getInstance().init();
    };

    ModuleBridge.prototype.getModule = function () {
        return this.getInstance();
    };

    ModuleBridge.prototype.getMetaData = function (callback) {
        callback(null, metaData);
    };
    return ModuleBridge;
})();

var bridge = new ModuleBridge();
module.exports = bridge;
