function addRoutes(metaData) {
    metaData.addFrontendRoute({
        idPath: ["dashboard", "transaction", "newTransaction"],
        component: "NewTransactionPage",
        name: null,
        path: "/transaction/new"
    });
}
exports.addRoutes = addRoutes;
