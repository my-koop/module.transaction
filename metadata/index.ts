import utils = require("mykoop-utils");
import routes = require("./routes");
var translations = require("../locales");
import endpoints = require("./endpoints");
import permissions = require("./permissions");
import contributions = require("./contributions");
import uiHooks = require("./uiHooks");

var metaDataBuilder = new utils.MetaDataBuilder();
routes.addRoutes(metaDataBuilder);

metaDataBuilder.addData("translations", translations);
metaDataBuilder.addData("endpoints", endpoints);
metaDataBuilder.addData("permissions", permissions);
metaDataBuilder.addData("contributions", contributions);
metaDataBuilder.addData("uihooks", uiHooks);

var metaData = metaDataBuilder.get();
export = metaData;
