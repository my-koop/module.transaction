var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var utils = require("mykoop-utils");
var controllerList = require("./controllers/index");
var ApplicationError = utils.errors.ApplicationError;

var test;
(function (test) {
    test[test["value1"] = 0] = "value1";
    test[test["value2"] = 1] = "value2";
})(test || (test = {}));

var Module = (function (_super) {
    __extends(Module, _super);
    function Module() {
        _super.apply(this, arguments);
    }
    Module.prototype.init = function () {
        controllerList.attachControllers(new utils.ModuleControllersBinder(this));
    };
    return Module;
})(utils.BaseModule);

module.exports = Module;
