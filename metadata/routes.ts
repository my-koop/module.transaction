import utils = require("mykoop-utils");
export function addRoutes(metaData: utils.MetaDataBuilder) {
  metaData.addFrontendRoute({
    idPath: ["dashboard", "bill"],
    name: null,
    path: "bill"
  });
  metaData.addFrontendRoute({
    idPath: ["dashboard", "financialreport"],
    i18nKey: "transaction::sidebar.reports",
    component: "FinancialReport",
    name: "financialReport",
    path: "financialreport",
    permissions: {
      invoices: {
        reports: true,
        read: true
      }
    }
  });
  // Bill
  {
    metaData.addFrontendRoute({
      idPath: ["dashboard", "bill", "new"],
      i18nKey: "transaction::sidebar.createInvoice",
      component: "NewBillPage",
      name: "newBill",
      path: "new",
      permissions: {
        invoices: {
          create: true
        }
      }
    });

    metaData.addFrontendRoute({
      idPath: ["dashboard", "bill", "details"],
      i18nKey: "transaction::billDetailsWelcome",
      component: "BillDetailPage",
      name: "billDetails",
      path: "details/:id",
      params: {
        id: [121]
      },
      permissions: {
        invoices: {
          read: true
        }
      }
    });

    metaData.addFrontendRoute({
      idPath: ["dashboard", "bill", "list"],
      i18nKey: "transaction::sidebar.listInvoices",
      component: "ListBillsPage",
      name: "listBills",
      path: ":state",
      params: {
        state: [
          "open",
          "closed"
        ]
      },
      permissions: {
        invoices: {
          read: true
        }
      }
    });
  }

}
