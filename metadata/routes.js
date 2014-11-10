function addRoutes(metaData) {
    metaData.addFrontendRoute({
        idPath: ["dashboard", "transaction", "newBill"],
        component: "NewBillPage",
        name: "newBill",
        path: "/transaction/bill/new"
    });
}
exports.addRoutes = addRoutes;
