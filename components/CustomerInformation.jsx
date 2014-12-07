var React     = require("react");
var Typeahead = require("react-typeahead").Typeahead;
var BSCol     = require("react-bootstrap/Col");
var BSRow     = require("react-bootstrap/Row");
var BSPanel   = require("react-bootstrap/Panel");
var BSAlert   = require("react-bootstrap/Alert");
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
var language = require("language");
var formatDate = language.formatDate;
var formatMoney = language.formatMoney;
var __ = language.__;
var _ = require("lodash");
var actions = require("actions");
var util = require("util");
var EmailValidationState = require("../lib/common/EmailValidationState");

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
  retrieveCustomerInfo: function(newEmailInfo) {
    var self = this;
    actions.user.customerInfo(
    {
      silent: true,
      data: {
        email: newEmailInfo.value
      }
    }, function(err, result) {
      // treat this response only if its the last we made
      var isValid = !err;
      var newState = !isValid ?
        EmailValidationState.Invalid
      : EmailValidationState.Valid;
      newEmailInfo.validationState = newState;
      self.setState({
        email: newEmailInfo,
        customerInfo: result
      }, function() {
        if(isValid) {
          self.props.onEmailChanged(newEmailInfo.value);
        }
      });
    });
  },
  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;
    var readOnly = this.props.readOnly;

    var emailLink = !readOnly && {
      value: this.state.email.value,
      requestChange: function(newEmail) {
        // Assume email is invalid until we get a response from the server
        self.setState({
          customerInfo: null
        });
        self.props.onEmailChanged(null);
        var newEmailInfo = {
          validationState: EmailValidationState.Waiting,
          value: newEmail,
          reqId: self.state.email.reqId
        };

        self.debounce([], "email", function(newEmailInfo) {
          if(newEmail === "") {
            newEmailInfo.validationState = EmailValidationState.Initial;
            return self.setState({
              email: newEmailInfo,
            });
          }
          self.retrieveCustomerInfo(newEmailInfo);
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

    var customerInfo = this.state.customerInfo;
    var customerInfoPanel = null;
    if(customerInfo) {
      var expiration = customerInfo.subscriptionExpiration;
      var expirationDate = expiration && new Date(expiration);
      var isMember = !!expiration;
      var isActiveMember = expirationDate && expirationDate >= new Date();
      var openBillCount = customerInfo.openBillCount;
      var unpaidAmount = customerInfo.unpaidAmount;
      var info = __("transaction::customerInfo",
        {
          context: isActiveMember ? "active" : isMember ? "inactive" : "notMember",

        }
      )
      customerInfoPanel = (
        <div>
          <p>
            <strong>
              {customerInfo.firstName} {customerInfo.lastName}
            </strong>
            {isActiveMember ? [
              "'s membership expires on ",
              formatDate(expirationDate)
            ]
            : isMember ? [
                "'s membership",
                <strong className="text-warning"> expired on {formatDate(expirationDate)}</strong>
              ] :
                <strong className="text-danger"> is not a member </strong>
            }
            {openBillCount ? [
              "and has ",
              <strong className="text-danger">{openBillCount} open bills</strong>,
              " with a total of ",
              <strong>{formatMoney(unpaidAmount)} unpaid</strong>
            ] : null
            }.
          </p>
        </div>
      );
    }

    return (
      <BSPanel>
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
          <label key={1}>{__("transaction::customerEmail")}</label>,
          <p key={2}>{this.state.email.value}</p>
        ]}
        {customerInfoPanel}
      </BSPanel>
    );
  }

});

module.exports = CustomerInformation;
