function addRoutes(metaData) {
    metaData.addFrontendRoute({
        idPath: ["dashboard", "transaction"],
        component: null,
        name: null,
        path: "transaction"
    });
    {
        metaData.addFrontendRoute({
            idPath: ["dashboard", "transaction", "bill"],
            component: null,
            name: null,
            path: "bill"
        });
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
exports.addRoutes = addRoutes;
