var React         = require("react");

var MKBillDetail = require("./BillDetail");

var __ = require("language").__;

var NewBillPage = React.createClass({
  render: function() {
    var customerEmail = this.props.query && this.props.query.email;
    return (
      <div>
        <h1>
          {__("transaction::newBillWelcome")}
        </h1>
        <MKBillDetail
          billDetails={{customerEmail: customerEmail}}
        />
      </div>
    );
  }
});

module.exports = NewBillPage;
