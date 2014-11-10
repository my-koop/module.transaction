var React     = require("react");
var BSCol     = require("react-bootstrap/Col");

// My Koop components
var MKTableSorter    = require("mykoop-core/components/TableSorter");
var MKListModButtons = require("mykoop-core/components/ListModButtons");
var MKAlertTrigger   = require("mykoop-core/components/AlertTrigger");

// Utilities
var __ = require("language").__;
var formatDate = require("language").formatDate;
var _ = require("lodash");
var actions = require("actions");
var util = require("util");

var ListBillsPage = React.createClass({
  ////////////////////////////
  /// Life Cycle methods

  getInitialState: function() {
    return {
      // id: number, createdDate: Date
      bills: []
    }
  },

  componentDidMount: function () {
    var self = this;
    actions.transaction.bill.list(function (err, bills) {
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
      });
    });
  },

  ////////////////////////////
  /// component methods
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

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    // TableSorter Config
    var BillTableConfig = {
      defaultOrdering: ["idbill", "createdDate", "actions"],
      columns: {
        idbill: {
          name: __("id"),
          isStatic: true
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
          {__("transaction::listBillWelcome")}
        </h1>
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
