var React         = require("react");

var MKBillDetail = require("./BillDetail");
var MKAlertTrigger = require("mykoop-core/components/AlertTrigger");

var __ = require("language").__;
var actions = require("actions");

var BillDetailPage = React.createClass({
  getDefaultProps: function() {
    return {
      params: {}
    };
  },

  getInitialState: function() {
    return {};
  },

  componentWillMount: function () {
    this.getBillInfo(this.props.params.id);
  },

  componentWillReceiveProps: function (nextProps) {
    this.getBillInfo(nextProps.params.id);
  },

  getBillInfo: function(billId) {
    var self = this;
    self.setState({
      billDetails: null
    });
    actions.transaction.bill.details({
      i18nErrors: {},
      data: {
        id: billId
      }
    }, function(err, res) {
      if(err) {
        var firstError = err.i18n[0];
        MKAlertTrigger.showAlert(__(firstError.key, firstError));
        return;
      }
      var customId = -1;
      res.items = _.map(res.items, function(item) {
        item.id = item.id || customId--;
        item.name = item.name || "";
        return item;
      });
      self.setState({
        billDetails: res
      });
    });
  },

  render: function() {
    var id = parseInt(this.props.params.id);
    return (
      <div>
        <h1>
          {__("transaction::billDetailsWelcome")} #{id}
        </h1>
        {this.state.billDetails ?
          <MKBillDetail
            readOnly
            idBill={id}
            billDetails={this.state.billDetails}
          />
        : null}
      </div>
    );
  }
});

module.exports = BillDetailPage;
