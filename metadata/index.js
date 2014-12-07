var utils = require("mykoop-utils");
var routes = require("./routes");
var translations = require("../locales/index");
var endpoints = require("./endpoints");
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
module.exports = metaData;
