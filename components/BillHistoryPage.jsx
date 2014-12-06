var React = require("react");
var PropTypes = React.PropTypes;
var BSCol = require("react-bootstrap/Col");
var BSButton = require("react-bootstrap/Button");

// My Koop components
var MKTableSorter     = require("mykoop-core/components/TableSorter");
var MKListModButtons  = require("mykoop-core/components/ListModButtons");
var MKAlert           = require("mykoop-core/components/Alert");

// Utilities
var _            = require("lodash");
var __           = require("language").__;
var actions      = require("actions");
var formatMoney  = require("language").formatMoney;
var formatDate   = require("language").formatDate;
var Router       = require("react-router");
var getRouteName = require("mykoop-utils/frontend/getRouteName");


var BillHistoryPage = React.createClass({

  propTypes : {
    userId: PropTypes.number.isRequired
  },

  getInitialState: function() {
    return {
      bills: [],
    }
  },

  componentWillReceiveProps: function (nextProps) {
    if(this.props.userId !== nextProps.userId) {
      this.getBillHistory(nextProps.userId);
    }
  },

  actionsGenerator: function(bill) {
    return [
      {
        icon: "search-plus",
        tooltip: {
          text: __("transaction::billHistoryDetailsTooltip"),
          overlayProps: {
            placement: "top"
          }
        },
        callback: function() {
          Router.transitionTo(getRouteName(["dashboard", "bill", "details"]), {id: bill.idbill});
        }
      }
    ];
  },

  getBillHistory: function(userId){
    var self = this;
    actions.transaction.bill.history({
      data: {
        id: userId
      }
    }, function(err , res){
      if(err){
        console.log(err);
      } else {
        var styledBills = _.map(res.bills, function(bill){
          if(bill.isClosed == 0){
            bill.__rowProps = { className: "danger"}
          }
          return bill;
        });
        self.setState({
          bills: styledBills
        })
      }
    })
  },

  componentDidMount: function(){
    this.getBillHistory(this.props.userId);
  },

  render: function() {
    var self = this;

    // TableSorter Config
    var BillTableConfig = {
      defaultOrdering: [
        "createdDate",
        "isClosed",
        "total",
        "paid",
        "actions"
      ],

      columns: {
        idbill: {
          name: __("id")
        },
        createdDate: {
          name: __("transaction::createdDate"),
          cellGenerator: function(bill) {
            return (
              (bill.createdDate !== null) ? formatDate(new Date(bill.createdDate),"LLL") : null
            );
          }
        },
        total: {
          name: __("transaction::total"),
          cellGenerator: function(bill) {
            return (
              formatMoney(bill.total)
            );
          }
        },
        paid: {
          name: __("transaction::paid"),
           cellGenerator: function(bill) {
            return (
              formatMoney(bill.paid)
            );
          }
        },
        isClosed: {
          name: __("transaction::status"),
          cellGenerator: function(bill){
            return (
              __("transaction::billIsClosed", {context: bill.isClosed})
            );
          }
        },

        actions: {
          name: __("actions"),
          isStatic: true,
          headerProps: {
            className: "list-mod-min-width-1"
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
        { this.state.bills.length > 0 ?
            <MKTableSorter
              config={BillTableConfig}
              items={this.state.bills}
              bordered
              striped
              condensed
              hover
              responsive
            />
        : <MKAlert bsStyle="warning">
            {__("transaction::billHistoryNoResult")}
          </MKAlert>
        }
      </BSCol>
    );
  }

});

module.exports = BillHistoryPage;

