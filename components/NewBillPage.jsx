var React         = require("react");

var MKBillDetail = require("./BillDetail");
var MKFeedbacki18nMixin   = require("mykoop-core/components/Feedbacki18nMixin");
var MKTransactionPermissionsMixin = require("./TransactionPermissionsMixin");

var __ = require("language").__;

var NewBillPage = React.createClass({
  mixins: [
    MKFeedbacki18nMixin,
    MKTransactionPermissionsMixin
  ],
  componentWillMount: function () {
    var missingPermissions = [];
    if(this.canCreateInvoices) {
      if(!this.canListEvents) {
        missingPermissions.push({key: "permissions::events.view"});
      }
      if(!this.canListEvents) {
        missingPermissions.push({key: "permissions::inventory.read"});
      }
      if(missingPermissions.length) {
        missingPermissions.unshift({
          key: "transaction::missingPermissionsCreateBill"
        });
        this.setFeedback(missingPermissions, "warning");
      }
    }
  },
  render: function() {
    var customerEmail = this.props.query && this.props.query.email;
    return (
      <div>
        <h1>
          {__("transaction::newBillWelcome")}
        </h1>
        {this.renderFeedback()}
        <MKBillDetail
          billDetails={{customerEmail: customerEmail}}
        />
      </div>
    );
  }
});

module.exports = NewBillPage;
