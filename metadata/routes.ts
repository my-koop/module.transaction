import utils = require("mykoop-utils");
export function addRoutes(metaData: utils.MetaDataBuilder) {
  metaData.addFrontendRoute({
    idPath: ["dashboard", "transaction", "newTransaction"],
    component: "NewTransactionPage",
    name: null,
    path: "/transaction/new"
  });
}
