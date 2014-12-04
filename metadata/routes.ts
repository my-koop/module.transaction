import utils = require("mykoop-utils");
export function addRoutes(metaData: utils.MetaDataBuilder) {
  metaData.addFrontendRoute({
    idPath: ["dashboard", "bill"],
    name: null,
    path: "bill"
  });
  metaData.addFrontendRoute({
    idPath: ["dashboard", "financialreport"],
    component: "FinancialReport",
    name: "FinancialReport",
    path: "financialreport"
  });
  // Bill
  {
    metaData.addFrontendRoute({
      idPath: ["dashboard", "bill", "new"],
      component: "NewBillPage",
      name: "newBill",
      path: "new"
    });

    metaData.addFrontendRoute({
      idPath: ["dashboard", "bill", "details"],
      component: "BillDetailPage",
      name: "billDetails",
      path: "details/:id",
      params: {
        id: [121]
      }
    });

    metaData.addFrontendRoute({
      idPath: ["dashboard", "bill", "list"],
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
