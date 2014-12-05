var React = require("react");
var PropTypes = React.PropTypes;
var BSCol = require("react-bootstrap/Col");
var BSButton = require("react-bootstrap/Button");

// My Koop components
var MKTableSorter              = require("mykoop-core/components/TableSorter");
var MKListModButtons           = require("mykoop-core/components/ListModButtons");
var MKIcon                     = require("mykoop-core/components/Icon");

// Utilities
var _            = require("lodash");
var __           = require("language").__;
var actions      = require("actions");
var formatMoney  = require("language").formatMoney;


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
      this.updateMembershipInformation(nextProps.userId);
    }
  },

  componentDidMount: function(){
    var self = this;
    actions.transaction.bill.history({
      data: {
        userId: self.props.userId
      }
    }, function(err , res){
        if(err){
          console.log(err);
        } else {
          self.setState({
            bills: res.bills
          })
        }
    })
  },

  render: function() {
    var self = this;

    // TableSorter Config
    var BillTableConfig = {
      defaultOrdering: [
        "idBill",
        "createdDate",
        "isClosed",
        "total",
        "paid"
      ],

      columns: {
        idBill: {
          name: __("id")
        },
        createdDate: {
          name: __("transaction::createdDate")
        },
        total: {
          name: __("transaction::total")

        },
        paid: {
          name: __("transaction::paid")

        },
        isClosed: {
          name: __("transaction::isClosed")
        },

        actions: {
          name: __("actions"),
          isStatic: true,
          headerProps: {
            className: "list-mod-min-width-3"
          }
        }
      }
    };

    return (
      <BSCol md={12}>
        <h1>
          {__("transaction::billHistoryWelcome")}
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

module.exports = BillHistoryPage;

