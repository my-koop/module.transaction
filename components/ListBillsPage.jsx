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

var thisRouteName = getRouteName(["dashboard", "transaction", "bill", "list"]);
var openBillsColumns = [
  "idBill",
  "idUser",
  "createdDate",
  "total",
  "paid",
  "actions"
];
var closedBillsColumns = [
  "idBill",
  "idUser",
  "createdDate",
  "closedDate",
  "total",
  "actions"
];
var columns = {};
columns[BillState.open] = openBillsColumns;
columns[BillState.closed] = closedBillsColumns;

var ListBillsPage = React.createClass({
  ////////////////////////////
  /// Life Cycle methods

  getDefaultProps: function() {
    return {
      params: {
        state: "open"
      }
    }
  },

  getInitialState: function() {
    return {
      // Transaction.Bill[]
      bills: [],
      billState: BillState[this.props.params.state]
    }
  },

  componentWillReceiveProps: function (nextProps) {
    if(this.props.params.state !== nextProps.params.state) {
      var self = this;
      this.setState({
        billState: BillState[nextProps.params.state]
      }, function() {
        self.updateList();
      });
    }
  },

  componentDidMount: function () {
    this.updateList();
  },

  ////////////////////////////
  /// component methods
  getBillState: function() {
    return this.state.billState;
  },

  getNextBillState: function() {
    return BillState.toggleState(this.getBillState());
  },

  getTableColumns: function() {
    return columns[this.getBillState()] || openBillsColumns;
  },

  updateList: function() {
    var self = this;
    this.setState({
      bills: []
    }, function() {
      actions.transaction.bill.list(
        {
          data: {
            show: BillState[this.getBillState()]
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
            bill.closedDate = bill.closedDate ? new Date(bill.closedDate) : null;
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
        if(err) {
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
      if(!err) {
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
        }, function(err) {
          callback(err);
        });
      },
      function(callback) {
        bill.paid += amount;
        self.setState({
          bills: self.state.bills
        }, function() {
          callback();
        });
      }
    ], callback);
  },

  actionsGenerator: function(bill) {
    var self = this;
    var buttons = [];

    if(this.getBillState() === BillState.open) {
      buttons.push({
        icon: "plus",
        tooltip: {
          text: __("transaction::addTransactionTooltip"),
          overlayProps: {
            placement: "top"
          }
        },
        modalTrigger: <MKAddTransactionModal
          defaultAmount={bill.total - bill.paid}
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
    } else if(this.getBillState() === BillState.closed) {
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

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    // TableSorter Config
    var BillTableConfig = {
      defaultOrdering: this.getTableColumns(),
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
            return formatDate(bill.createdDate, "LLL");
          }
        },
        closedDate: {
          name: __("transaction::closedDate"),
          cellGenerator: function(bill, i) {
            return bill.closedDate ? formatDate(bill.closedDate, "LLL") : null;
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
          {__("transaction::listBillWelcome", {context: BillState[this.getBillState()]})}
        </h1>
        <BSButton>
          <Link
            to={thisRouteName}
            params={{state: BillState[this.getNextBillState()]}}
          >
            <MKIcon glyph="exchange" />
            {__("transaction::switchBillState", {context: BillState[this.getBillState()]})}
          </Link>
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
