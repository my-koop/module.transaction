var React     = require("react");
var Typeahead = require("react-typeahead").Typeahead;
var BSCol     = require("react-bootstrap/Col");
var BSRow     = require("react-bootstrap/Row");
var BSPanel   = require("react-bootstrap/Panel");
var BSTable   = require("react-bootstrap/Table");
var BSInput   = require("react-bootstrap/Input");
var BSButton  = require("react-bootstrap/Button");

// My Koop components
var MKTableSorter       = require("mykoop-core/components/TableSorter");
var MKListModButtons    = require("mykoop-core/components/ListModButtons");
var MKSpinner           = require("mykoop-core/components/Spinner");
var MKCollapsablePanel  = require("mykoop-core/components/CollapsablePanel");
var MKAlertTrigger      = require("mykoop-core/components/AlertTrigger");
var MKIcon              = require("mykoop-core/components/Icon");
var MKDebouncerMixin    = require("mykoop-core/components/DebouncerMixin");
var MKDiscountTable     = require("./DiscountTable");
var MKBillInfo          = require("./BillInfo");


// Utilities
var __ = require("language").__;
var formatMoney = require("language").formatMoney;
var _ = require("lodash");
var actions = require("actions");
var util = require("util");

var NewBillPage = React.createClass({
  mixins: [MKDebouncerMixin],
  ////////////////////////////
  /// Life Cycle methods

  getInitialState: function() {
    return {
      email: {
        value: "",
        // possible values ["invalid", "waiting", "valid"]
        state: "invalid",
        // used to know if the response is still relevant
        reqId: 0
      }
    }
  },

  ////////////////////////////
  /// component methods
  getEmail: function() {
    return this.state.email.value;
  },

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    var emailLink = {
      value: this.state.customerEmail,
      requestChange: function(newValue) {
        newValue = {
          state: "waiting",
          value: newValue,
          reqId: self.state.email.reqId
        };
        self.debounce([], "email", function(newValue) {
          var curReqId = newValue.reqId + 1;
          newValue.reqId = curReqId;
          self.setState({
            email: newValue
          }, function() {
            actions.user.emailExists(
            {
              silent: true,
              data: {
                email: newValue.value
              }
            }, function(err, result) {
              // treat this response only if its the last we made
              if(curReqId === self.state.email.reqId) {
                var newState = err || !result ? "invalid" : "valid";
                newValue.state = newState;
                self.setState({
                  email: newValue
                });
              }
            });
          });

          return newValue;
        }, 3000, newValue);
      }
    };
    var emailAddon = "X";
    console.log(self.state.email.state);
    switch(self.state.email.state) {
      case "invalid":
        emailAddon = <MKIcon glyph="close" className="has-error" />;
        break;
      case "waiting": emailAddon =
        <MKIcon glyph="spinner" className="fa-spin" />;
        break;
      case "valid":
        emailAddon = <MKIcon glyph="check" />;
        break;
    }

    return (
      <div>
        <h3>
          {__("transaction::customerInformations")}
        </h3>
        <label>
          {__("email")}
          <BSInput
            type="email"
            valueLink={emailLink}
            addonBefore={<MKIcon glyph="envelope" className="fa-fw" />}
            addonAfter={emailAddon}
          />
        </label>
      </div>
    );
  }

});

module.exports = NewBillPage;
