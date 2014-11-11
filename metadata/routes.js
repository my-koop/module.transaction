function addRoutes(metaData) {
    metaData.addFrontendRoute({
        idPath: ["dashboard", "transaction", "newBill"],
        component: "NewBillPage",
        name: "newBill",
        path: "/transaction/bill/new"
    });

    metaData.addFrontendRoute({
        idPath: ["dashboard", "transaction", "bills"],
        component: "ListBillsPage",
        name: "bills",
        path: "/transaction/bill/list"
    });
}
exports.addRoutes = addRoutes;
