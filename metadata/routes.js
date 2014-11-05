function addRoutes(metaData) {
    metaData.addFrontendRoute({
        idPath: ["public", "example"],
        component: "Component1",
        name: "example",
        path: "/example"
    });
}
exports.addRoutes = addRoutes;
