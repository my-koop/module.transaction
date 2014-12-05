var utils = require("mykoop-utils");
var routes = require("./routes");
var translations = require("../locales/index");
var endpoints = require("./endpoints");
var metaDataBuilder = new utils.MetaDataBuilder();
routes.addRoutes(metaDataBuilder);
metaDataBuilder.addData("translations", translations);
metaDataBuilder.addData("endpoints", endpoints);
metaDataBuilder.addData("myAccountPlugins", {
    billhistory: {
        titleKey: "transaction::billHistoryTab",
        hash: "billhistory",
        component: {
            resolve: "component",
            value: "BillHistoryPage"
        }
    }
});
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
var metaData = metaDataBuilder.get();
module.exports = metaData;
