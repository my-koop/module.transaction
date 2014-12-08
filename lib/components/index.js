var utils = require("mykoop-utils");
var fs = require("fs");
var _ = require("lodash");
var path = require("path");
var prequire = require('parent-require')
var React = prequire("react");

var components = ["Invoice"];
if(utils.__DEV__) {
  var reactTools = require("react-tools");
  _.each(components, function(component) {
    var jsxComponent = fs.readFileSync(
      path.resolve(__dirname, component + ".jsx"),
      {encoding: "utf8"}
    );

    var destination = path.resolve(__dirname, component + ".js");
    var transformed = reactTools.transform(jsxComponent);
    fs.writeFileSync(destination, transformed, {encoding: "utf8"});
  });
}

function renderComponent(componentName, props) {
  var component = renderComponent[componentName];
  if(!component) {
    return new Error("Invalid component");
  }
  //FIXME:: Deprecated in react 0.12
  return React.renderComponentToStaticMarkup(component(props));
}
_.assign(renderComponent, _.zipObject(components, _.map(components, function(component) {
  return require("./" + component + ".js");
})));

module.exports = renderComponent;
