var React         = require("react");

var MKBillDetail = require("./BillDetail");

var __ = require("language").__;

var NewBillPage = React.createClass({
  render: function() {
    return (
      <div>
        <h1>
          {__("transaction::newBillWelcome")}
        </h1>
        <MKBillDetail />
      </div>
    );
  }
});

module.exports = NewBillPage;
