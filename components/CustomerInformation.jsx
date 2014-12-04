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
var EmailValidationState = require("../lib/common_modules/EmailValidationState");

var CustomerInformation = React.createClass({
  mixins: [MKDebouncerMixin],

  propTypes: {
    readOnly: React.PropTypes.bool,
    email: React.PropTypes.string,
    // (email: string) => void; Only if email is valid
    onEmailChanged: React.PropTypes.func.isRequired
  },

  ////////////////////////////
  /// Life Cycle methods
  getInitialState: function(props) {
    props = props || this.props;
    return {
      email: {
        value: this.props.email || "",
        validationState: EmailValidationState.Initial,
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
    var readOnly = this.props.readOnly;

    var emailLink = !readOnly && {
      value: this.state.email.value,
      requestChange: function(newEmail) {
        // Assume email is invalid until we get a response from the server
        self.props.onEmailChanged(null);
        var newEmailInfo = {
          validationState: EmailValidationState.Waiting,
          value: newEmail,
          reqId: self.state.email.reqId
        };
        self.debounce([], "email", function(newEmailInfo) {
          if(newEmail === "") {
            newEmailInfo.validationState = EmailValidationState.Initial;
            return self.setState({email: newEmailInfo});
          }
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
                var newState =
                  err || !isValid ?
                    EmailValidationState.Invalid
                  : EmailValidationState.Valid;
                newEmailInfo.validationState = newState;
                self.setState({
                  email: newEmailInfo
                }, function() {
                  if(isValid) {
                    self.props.onEmailChanged(newEmailInfo.value);
                  }
                });
              }
            });
          });

          return newEmailInfo;
        }, 1000, newEmailInfo);
      }
    };

    var emailAddon = undefined;
    var inputStyle = undefined;
    switch(self.state.email.validationState) {
      case EmailValidationState.Initial:
        break;
      case EmailValidationState.Invalid:
        inputStyle = "error";
        emailAddon = <MKIcon glyph="close" />;
        break;
      case EmailValidationState.Waiting:
        inputStyle = "warning";
        //FIXME:: Waiting on https://github.com/my-koop/service.website/issues/261
        emailAddon = <MKIcon glyph="spinner" className="fa-spin" />;
        break;
      case EmailValidationState.Valid:
        inputStyle = "success";
        emailAddon = <MKIcon glyph="check" />;
        break;
    }

    return (
      <div>
        {!readOnly ?
        <BSInput
          type="email"
          valueLink={emailLink}
          label={__("transaction::customerEmail")}
          bsStyle={inputStyle}
          addonBefore={<MKIcon glyph="envelope" fixedWidth />}
          addonAfter={emailAddon}
        />
        : [
          <label>{__("transaction::customerEmail")}</label>,
          <p>{this.state.email.value}</p>
        ]}
      </div>
    );
  }

});

module.exports = CustomerInformation;
