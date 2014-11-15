var React = require("react");
var BSCol = require("react-bootstrap/Col");
var Link  = require("react-router").Link;

var BSButton = require("react-bootstrap/Button");

// My Koop components
var MKTableSorter              = require("mykoop-core/components/TableSorter");
var MKListModButtons           = require("mykoop-core/components/ListModButtons");
var MKAlertTrigger             = require("mykoop-core/components/AlertTrigger");
var MKConfirmationTrigger      = require("mykoop-core/components/ConfirmationTrigger");
var MKIcon                     = require("mykoop-core/components/Icon");
var MKCustomerInformationModal = require("./CustomerInformationModal");
var MKAddTransactionModal      = require("./AddTransactionModal");

// Utilities
var _            = require("lodash");
var __           = require("language").__;
var async        = require("async");
var actions      = require("actions");
var formatDate   = require("language").formatDate;
var formatMoney  = require("language").formatMoney;
var getRouteName = require("mykoop-utils/frontend/getRouteName");
var BillState    = require("../lib/common_modules/BillState");


var ListBillsPage = React.createClass({
  ////////////////////////////
  /// Life Cycle methods

  getInitialState: function() {
    return {
      // Transaction.Bill[]
      bills: [],
      billState: BillState.open,
    }
  },

  componentDidMount: function () {
    this.updateList();
  },

  ////////////////////////////
  /// component methods
  updateList: function() {
    var self = this;
    this.setState({
      bills: []
    }, function() {
      actions.transaction.bill.list(
        {
          data: {
            show: BillState[this.state.billState]
          }
        },
        function (err, bills) {
          if (err) {
            console.error(err);
            MKAlertTrigger.showAlert(__("errors::error", {context: err.context}));
            return;
          }
          _.forEach(bills, function(bill) {
            bill.createdDate = new Date(bill.createdDate);
          });
          self.setState({
            bills: bills
          }
        );
      });
    });
  },

  removeBillFromState: function(bill) {
    var bills = _.filter(this.state.bills, function(bill_) {
      return bill !== bill_;
    });
    this.setState({
      bills: bills
    });
  },

  changeBillState: function(action, bill) {
    var self = this;
    actions.transaction.bill[action](
      {
        data: {
          id: bill.idBill
        }
      },
      function(err, res) {
        if(err || (res && !res.success)) {
          console.error(err);
          MKAlertTrigger.showAlert(__("errors::error", {context: err.context}));
          return;
        }
        self.removeBillFromState(bill);
      }
    );
  },

  onUpdateCloseBill: function (bill, email, callback) {
    var self = this;
    actions.transaction.bill.open({
      data: {
        id: bill.idBill,
        email: email
      }
    }, function(err, result) {
      if(!err && result.success) {
        self.removeBillFromState(bill);
      }
      callback(err, result);
    });
  },

  addTransaction: function(bill, amount, callback) {
    if(!amount) {
      return callback();
    }
    var self = this;
    async.waterfall([
      function(callback) {
        actions.transaction.bill.addTransaction(
        {
          data: {
            id: bill.idBill,
            amount: amount
          }
        }, callback);
      },
      function(result, res, callback) {
        if(!result.success) {
          return callback(new Error("failed to add transaction"));
        }

        bill.paid += amount;
        self.setState({
          bills: self.state.bills
        }, function() {
          callback(null, result);
        });
      }
    ], callback);
  },

  actionsGenerator: function(bill) {
    var self = this;
    var buttons = [];

    if(this.state.billState === BillState.open) {
      buttons.push({
        icon: "plus",
        tooltip: {
          text: __("transaction::addTransactionTooltip"),
          overlayProps: {
            placement: "top"
          }
        },
        modalTrigger: <MKAddTransactionModal
          onSave={_.bind(this.addTransaction, this, bill)}
        />
      });
      if(bill.total === bill.paid) {
        buttons.push({
          icon: "close",
          warningMessage: __("areYouSure"),
          tooltip: {
            text: __("transaction::closeBillTooltip"),
            overlayProps: {
              placement: "top"
            }
          },
          callback: function() {
            self.changeBillState("close", bill);
          }
        });
      }
    } else if(this.state.billState === BillState.closed) {
      var needToSpecifyCustomerInfo = !_.isNumber(bill.idUser);
      buttons.push({
        icon: "folder-open",
        warningMessage: !needToSpecifyCustomerInfo ? __("areYouSure") : null,
        tooltip: {
          text: __("transaction::openBillTooltip"),
          overlayProps: {
            placement: "top"
          }
        },
        modalTrigger: needToSpecifyCustomerInfo ? (
          <MKCustomerInformationModal
            onSave={self.onUpdateCloseBill.bind(self, bill)}
          />) : null,
        callback: !needToSpecifyCustomerInfo ? function() {
          self.changeBillState("open", bill);
        } : null
      });
    }
    return buttons;
  },

  switchBillState: function() {
    var newState = BillState.toggleState(this.state.billState);
    this.setState({
      billState: newState
    }, this.updateList);
  },

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    // TableSorter Config
    var BillTableConfig = {
      defaultOrdering: ["idBill", "idUser", "createdDate", "total", "paid", "actions"],
      columns: {
        idBill: {
          name: __("id"),
          isStatic: true
        },
        total: {
          name: __("transaction::total"),
          cellGenerator: function(bill, i) {
            return formatMoney(bill.total);
          }
        },
        paid: {
          name: __("transaction::paid"),
          cellGenerator: function(bill, i) {
            return formatMoney(bill.paid || 0);
          }
        },
        idUser: {
          name: __("user"),
          cellGenerator: function(bill, i) {
            if(bill.idUser === null) return null;
            // FIXME:: Make a link to the actual user and not to myaccount
            return (
              <div key={i}>
                  <Link
                    to={getRouteName(["public", "myaccount"])}
                    params={{id: bill.idUser}}
                  >
                    {bill.idUser} TODO
                  </Link>
              </div>
            );
          }
        },
        createdDate: {
          name: __("transaction::createdDate"),
          cellGenerator: function(bill, i) {
            return formatDate(bill.createdDate);
          }
        },
        actions: {
          name: __("actions"),
          isStatic: true,
          cellGenerator: function(bill) {
            return (
              <MKListModButtons
                defaultTooltipDelay={500}
                buttons={self.actionsGenerator(bill)}
              />
            );
          }
        }
      }
    };

    return (
      <BSCol md={12}>
        <h1>
          {__("transaction::listBillWelcome", {context: BillState[this.state.billState]})}
        </h1>
        <BSButton onClick={this.switchBillState}>
          <MKIcon glyph="exchange" />
          {__("transaction::switchBillState", {context: BillState[this.state.billState]})}
        </BSButton>
        <MKTableSorter
          config={BillTableConfig}
          items={this.state.bills}
          bordered
          striped
          condensed
          hover
          responsive
        />
      </BSCol>
    );
  }

});

module.exports = ListBillsPage;
