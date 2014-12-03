import utils = require("mykoop-utils");
export function addRoutes(metaData: utils.MetaDataBuilder) {
  metaData.addFrontendRoute({
    idPath: ["dashboard", "transaction"],
    name: null,
    path: "transaction"
  });
  metaData.addFrontendRoute({
    idPath: ["dashboard", "financialreport"],
    component: "FinancialReport",
    name: "FinancialReport",
    path: "financialreport"
  });
  // Transaction
  {
    metaData.addFrontendRoute({
      idPath: ["dashboard", "transaction", "bill"],
      name: null,
      path: "bill"
    });
    //Bill
    {
      metaData.addFrontendRoute({
        idPath: ["dashboard", "transaction", "bill", "new"],
        component: "NewBillPage",
        name: "newBill",
        path: "new"
      });

      metaData.addFrontendRoute({
        idPath: ["dashboard", "transaction", "bill", "list"],
        component: "ListBillsPage",
        name: "listBills",
        path: ":state",
        params: {
          state: [
            "open",
            "closed"
          ]
        }
      });
    }
  }
}
