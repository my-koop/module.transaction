import utils = require("mykoop-utils");
import routes = require("./routes");
import translations = require("../locales/index");
import endpoints = require("./endpoints");

var metaDataBuilder = new utils.MetaDataBuilder();
routes.addRoutes(metaDataBuilder);

metaDataBuilder.addData("translations", translations);
metaDataBuilder.addData("endpoints", endpoints);

var metaData = metaDataBuilder.get();
export = metaData;
