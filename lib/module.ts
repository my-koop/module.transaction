import utils = require("mykoop-utils");
import controllerList = require("./controllers/index");
var ApplicationError = utils.errors.ApplicationError;

class Module extends utils.BaseModule implements mktransaction.Module {
  init() {
    controllerList.attachControllers(new utils.ModuleControllersBinder(this));
  }

  saveNewBill(
    params: Transaction.NewBill,
    callback
  ) {
    callback(new ApplicationError(null, {reason: "todo"}));

  }
}

export = Module;
