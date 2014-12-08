var utils = require("mykoop-utils");
var fs = require("fs");
var _ = require("lodash");
var path = require("path");
var prequire = require('parent-require')
var React = prequire("react");
require('node-jsx').install({harmony: true});

var components = ["Invoice"];
function renderComponent(componentName, props) {
  var component = renderComponent[componentName];
  if(!component) {
    return new Error("Invalid component");
  }
  //FIXME:: Deprecated in react 0.12
  return React.renderComponentToStaticMarkup(component(props));
}
_.assign(renderComponent, _.zipObject(components, _.map(components, function(component) {
  return require("./" + component + ".jsx");
})));

module.exports = renderComponent;
