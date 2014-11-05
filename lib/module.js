var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var utils = require("mykoop-utils");
var ModuleClass1 = require("./classes/ModuleClass1");
var controllerList = require("./controllers/index");
var ApplicationError = utils.errors.ApplicationError;

var Module = (function (_super) {
    __extends(Module, _super);
    function Module() {
        _super.apply(this, arguments);
    }
    Module.prototype.init = function () {
        controllerList.attachControllers(new utils.ModuleControllersBinder(this));
    };

    Module.prototype.method1 = function (inParam, callback) {
        if (!inParam.id) {
            return callback(new ApplicationError(null, {
                id: "custom message"
            }, "Wrong id"));
        }
        var res = new ModuleClass1();
        res.id = inParam.id + 1;
        res.value = inParam.value + " Incremented id by 1";
        callback(null, res);
    };
    return Module;
})(utils.BaseModule);

module.exports = Module;
