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
var tokenizer = require("mykoop-utils/frontend/tokenizer");
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
        self.props.onEmailChanged(newEmail);
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
    var isWaiting = false;
    switch(self.state.email.validationState) {
      case EmailValidationState.Initial:
        break;
      case EmailValidationState.Invalid:
        inputStyle = "warning";
        emailAddon = <MKIcon glyph="close" />;
        break;
      case EmailValidationState.Waiting:
        isWaiting = true;
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
      var context = isActiveMember ? "active" : isMember ? "inactive" : "notMember"
      context = openBillCount ? context + "Bills" : context;
      var info = __("transaction::customerInfo",
        {
          context: context,
          info: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            date: expirationDate && formatDate(expirationDate),
            bill: openBillCount,
            amount: formatMoney(unpaidAmount)
          }
        }
      );
      var sentence = tokenizer(info, [
        "<name>",
        "<exp>",
        "<not>",
        "<open>",
        "<unpaid>"
      ]);
      var result = _.map(sentence, function(s) {
        switch(s.token) {
          case "<name>": return <strong key="name">{s.text}</strong>;
          case "<exp>": return <strong key="expiration" className="text-warning">{s.text}</strong>;
          case "<not>": return <strong key="notMember" className="text-danger">{s.text}</strong>;
          case "<open>": return <strong key="openBills" className="text-danger">{s.text}</strong>;
          case "<unpaid>": return (
            <strong
              key="unpaid"
              className={unpaidAmount ? "text-danger" : ""}
            >
              {s.text}
            </strong>
          );
          default: return s.text;
        }
      });
      customerInfoPanel = (
        <div>
          <p>
            {result}.
          </p>
        </div>
      );
    } else if(!isWaiting && this.props.email) {
      customerInfoPanel = (
        <div>
          <p>
            <strong className="text-warning">
              {__("transaction::unknownEmail")}.
            </strong>
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
