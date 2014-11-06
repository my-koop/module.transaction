var React = require("react");
var PropTypes = React.PropTypes;
var BSCol = require("react-bootstrap/Col");

// Use this to provide localization strings.
var __ = require("language").__;

var NewTransactionPage = React.createClass({

  render: function() {
    return (
      <BSCol md={12}>
        <h1>
          {__("transaction::newTransactionWelcome")}
        </h1>
      </BSCol>
    );
  }

});

module.exports = NewTransactionPage;
