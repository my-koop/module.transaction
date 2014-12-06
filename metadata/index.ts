import utils = require("mykoop-utils");
import routes = require("./routes");
var translations = require("../locales/index");
import endpoints = require("./endpoints");

var metaDataBuilder = new utils.MetaDataBuilder();
routes.addRoutes(metaDataBuilder);

metaDataBuilder.addData("translations", translations);
metaDataBuilder.addData("endpoints", endpoints);

metaDataBuilder.addData("adminEditPlugins", {
  billhistory: {
    titleKey: "transaction::billHistoryTab",
    hash: "billhistory",
    component: {
      resolve: "component",
      value: "BillHistoryPage"
    }
  }
});

metaDataBuilder.addData("core", {
  contributions: {
    settings: {
      taxes: {
        titleKey: "taxes::settingsTitle",
        component: {
          resolve: "component",
          value: "TaxesSettings"
        }
      }
    }
  }
});
var metaData = metaDataBuilder.get();
export = metaData;
