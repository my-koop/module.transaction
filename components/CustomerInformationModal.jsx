var React    = require("react/addons");
var BSButton = require("react-bootstrap/Button");
var BSModal  = require("react-bootstrap/Modal");
var BSInput  = require("react-bootstrap/Input");
var BSAlert  = require("react-bootstrap/Alert");

var MKCustomerInformation = require("./CustomerInformation");

var actions  = require("actions");
var __ = require("language").__;
var _  = require("lodash");

var CustomerInfoModal = React.createClass({

  propTypes: {
    onRequestHide: React.PropTypes.func.isRequired,
    onSave: React.PropTypes.func.isRequired,
  },

  getInitialState: function() {
    return {
      customerEmail: null
    }
  },

  onEmailChanged: function(email) {
    this.setState({
      customerEmail: email
    });
  },

  onSave: function (hideFnc) {
    if(!this.state.customerEmail) {
      return;
    }

    var self = this;
    this.props.onSave(this.state.customerEmail, function(err) {
      if (err) {
        console.error(err);
        return self.setState({
          errorMessage: __("errors::error", {context: err.context})
        });
      }

      self.setState({errorMessage: null});
      hideFnc();
    });
  },

  render: function () {
    var props = _.omit(this.props,
      "onSave",
      "children"
    );

    return (
      <BSModal
        title={__("transaction::customerInformations")}
        bsSize="small"
        {...props}
      >
        <div className="modal-body">
          <MKCustomerInformation
            onEmailChanged={this.onEmailChanged}
          />
        </div>
        <div className="modal-footer">
          <BSButton
            onClick={this.onSave.bind(this, this.props.onRequestHide)}
            disabled={!this.state.customerEmail}
            bsStyle="primary"
          >
            {__("save")}
          </BSButton>
          <BSButton
            onClick={this.props.onRequestHide}
          >
            {__("cancel")}
          </BSButton>
        </div>
      </BSModal>
    );
  }
});

module.exports = CustomerInfoModal;
