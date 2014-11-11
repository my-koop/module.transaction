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
  propTypes: {
    // (email: string) => void; Only if email is valid
    onEmailChanged: React.PropTypes.func.isRequired
  },

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

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    var emailLink = {
      value: this.state.customerEmail,
      requestChange: function(newEmail) {
        // Assume email is invalid until we get a response from the server
        self.props.onEmailChanged(null);
        var newEmailInfo = {
          state: "waiting",
          value: newEmail,
          reqId: self.state.email.reqId
        };
        self.debounce([], "email", function(newEmailInfo) {
          var curReqId = newEmailInfo.reqId + 1;
          newEmailInfo.reqId = curReqId;
          self.setState({
            email: newEmailInfo
          }, function() {
            actions.user.emailExists(
            {
              silent: true,
              data: {
                email: newEmailInfo.value
              }
            }, function(err, result) {
              // treat this response only if its the last we made
              if(curReqId === self.state.email.reqId) {
                var isValid = result && result.isValid;
                var newState = err || !isValid ? "invalid" : "valid";
                newEmailInfo.state = newState;
                self.setState({
                  email: newEmailInfo
                });
                if(isValid) {
                  self.props.onEmailChanged(newEmailInfo.value);
                }
              }
            });
          });

          return newEmailInfo;
        }, 3000, newEmailInfo);
      }
    };

    var emailAddon = "X";
    var inputStyle = "";
    switch(self.state.email.state) {
      case "invalid":
        inputStyle = "error";
        emailAddon = <MKIcon glyph="close" />;
        break;
      case "waiting":
        inputStyle = "warning";
        emailAddon = <MKIcon glyph="spinner" className="fa-spin" />;
        break;
      case "valid":
        inputStyle = "success";
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
            bsStyle={inputStyle}
            addonBefore={<MKIcon glyph="envelope" className="fa-fw" />}
            addonAfter={emailAddon}
          />
        </label>
      </div>
    );
  }

});

module.exports = NewBillPage;
