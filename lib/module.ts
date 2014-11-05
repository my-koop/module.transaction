import utils = require("mykoop-utils");
import ModuleClass1 = require("./classes/ModuleClass1");
import controllerList = require("./controllers/index");
var ApplicationError = utils.errors.ApplicationError;

class Module extends utils.BaseModule implements mktransaction.Module {
  init() {
    controllerList.attachControllers(new utils.ModuleControllersBinder(this));
  }

  method1(
    inParam: {id:number; value:string},
    callback: (err: Error, res ?: mktransaction.ModuleClass1) => void
  ) {
    if (!inParam.id) {
      return callback(new ApplicationError(
        null,
        {
          id: "custom message"
        },
        "Wrong id"
      ));
    }
    var res = new ModuleClass1();
    res.id = inParam.id + 1;
    res.value = inParam.value + " Incremented id by 1";
    callback(null, res);
  }
}

export = Module;
