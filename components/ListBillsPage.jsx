var React  = require("react");
var Router = require("react-router");
var Link   = Router.Link;

var BSCol = require("react-bootstrap/Col");
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
var BillState    = require("../lib/common_modules/BillState");

var thisRouteName = "listBills";
var openBillsColumns = [
  "idBill",
  "idUser",
  "createdDate",
  "transactionCount",
  "total",
  "paid",
  "actions"
];
var closedBillsColumns = [
  "idBill",
  "idUser",
  "createdDate",
  "closedDate",
  "transactionCount",
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
      // mktransaction.Bill[]
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

  deleteBill: function(bill) {
    var self = this;
    actions.transaction.bill.delete({
      i18nErrors: {
        prefix: "transaction::errors",
        keys: ["app"]
      },
      data: {
        id: bill.idBill
      }
    }, function(err) {
      if(err) {
        // show only first error
        var i18n = err.i18n[0];
        MKAlertTrigger.showAlert(
          __(i18n.key, i18n)
        );
        return
      }
      self.removeBillFromState(bill);
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
    var buttons = [{
      icon: "search-plus",
      tooltip: {
        text: __("transaction::showDetailsTooltip"),
        overlayProps: {
          placement: "top"
        }
      },
      callback: function() {
        Router.transitionTo("billDetails", {id: bill.idBill});
      }
    }];

    if(this.getBillState() === BillState.open) {
      // Add transaction action
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
      // Close bill action
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
      // Open bill action
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
    // Delete bill action
    if(!bill.transactionCount) {
      buttons.push({
        icon: "trash",
        warningMessage: __("transaction::deleteBillWarning"),
        tooltip: {
          text: __("remove"),
          overlayProps: {
            placement: "top"
          }
        },
        callback: _.bind(self.deleteBill, null, bill)
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
          name: __("id")
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
                    to={"adminEdit"}
                    params={{id: bill.idUser}}
                  >
                    {bill.idUser}
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
        transactionCount: {
          name: __("transaction::transactionCountHeader")
        },
        actions: {
          name: __("actions"),
          isStatic: true,
          headerProps: {
            className: "list-mod-min-width-3"
          },
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
