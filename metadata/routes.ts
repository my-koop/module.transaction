import utils = require("mykoop-utils");
export function addRoutes(metaData: utils.MetaDataBuilder) {
  metaData.addFrontendRoute({
    idPath: ["dashboard", "transaction", "newBill"],
    component: "NewBillPage",
    name: "newBill",
    path: "/transaction/bill/new"
  });
}
