function addRoutes(metaData) {
    metaData.addFrontendRoute({
        idPath: ["dashboard", "bill"],
        name: null,
        path: "bill"
    });
    metaData.addFrontendRoute({
        idPath: ["dashboard", "financialreport"],
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
    {
        metaData.addFrontendRoute({
            idPath: ["dashboard", "bill", "new"],
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
exports.addRoutes = addRoutes;
