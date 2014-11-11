var React = require("react");
var BSCol = require("react-bootstrap/Col");
var Link  = require("react-router").Link;

var BSButton = require("react-bootstrap/Button");

// My Koop components
var MKTableSorter         = require("mykoop-core/components/TableSorter");
var MKListModButtons      = require("mykoop-core/components/ListModButtons");
var MKAlertTrigger        = require("mykoop-core/components/AlertTrigger");
var MKConfirmationTrigger = require("mykoop-core/components/ConfirmationTrigger");
var MKIcon                = require("mykoop-core/components/Icon");

// Utilities
var _            = require("lodash");
var __           = require("language").__;
var actions      = require("actions");
var formatDate   = require("language").formatDate;
var formatMoney  = require("language").formatMoney;
var getRouteName = require("mykoop-utils/frontend/getRouteName");

var ListBillsPage = React.createClass({
  ////////////////////////////
  /// Life Cycle methods

  getInitialState: function() {
    return {
      // id: number, createdDate: Date
      bills: [],
      // can be "open" or "closed"
      billState: "open",
    }
  },

  componentDidMount: function () {
    this.updateList();
  },

  ////////////////////////////
  /// component methods
  updateList: function() {
    var self = this;
    actions.transaction.bill.list(
      {
        data: {
          show: this.state.billState
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
  },
  actionsGenerator: function(item) {
    var self = this;
    return [
      {
        icon: "remove",
        warningMessage: __("areYouSure"),
        tooltip: {
          text: __("remove"),
          overlayProps: {
            placement: "top"
          }
        },
        callback: function() {
          MKAlertTrigger.showAlert("TODO");
        }
      }
    ];
  },

  switchBillState: function() {
    var newState = "open";
    if(this.state.billState === "open") {
      newState = "closed";
    }

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
          cellGenerator: function(item) {
            return (
              <MKListModButtons
                defaultTooltipDelay={500}
                buttons={self.actionsGenerator(item)}
              />
            );
          }
        }
      }
    };

    return (
      <BSCol md={12}>
        <h1>
          {__("transaction::listBillWelcome", {context: this.state.billState})}
        </h1>
        <BSButton onClick={this.switchBillState}>
          <MKIcon glyph="exchange" />
          {__("transaction::switchBillState", {context: this.state.billState})}
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
