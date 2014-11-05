import utils = require("mykoop-utils");
export function addRoutes(metaData: utils.MetaDataBuilder) {
  metaData.addFrontendRoute({
    idPath: ["public","example"],
    component: "Component1",
    name: "example",
    path: "/example"
  });
}
