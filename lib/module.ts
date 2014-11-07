import utils = require("mykoop-utils");
import controllerList = require("./controllers/index");
var ApplicationError = utils.errors.ApplicationError;

enum test {
  value1,
  value2
}

class Module extends utils.BaseModule implements mktransaction.Module {
  init() {
    controllerList.attachControllers(new utils.ModuleControllersBinder(this));
  }
}

export = Module;
