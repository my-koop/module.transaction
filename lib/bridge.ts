import Module = require("./module");
import metaData = require("../metadata/index");

class ModuleBridge implements mykoop.IModuleBridge {
  instance: Module;

  getInstance(): Module {
    return this.instance || (this.instance = new Module());
  }

  onAllModulesInitialized() {
    this.getInstance().init();
  }

  getModule() : mykoop.IModule {
    return this.getInstance();
  }

  getMetaData(callback: mykoop.ModuleMetaDataCallback): void {
    callback(null, metaData);
  }
}

var bridge: mykoop.IModuleBridge = new ModuleBridge();
export = bridge;

