var React    = require("react/addons");
var BSButton = require("react-bootstrap/Button");
var BSModal  = require("react-bootstrap/Modal");
var BSInput  = require("react-bootstrap/Input");

var MKDebouncerMixin = require("mykoop-core/components/DebouncerMixin");
var MKAlert          = require("mykoop-core/components/Alert");

var __ = require("language").__;
var _  = require("lodash");

var AddTransactionModal = React.createClass({
  mixins: [MKDebouncerMixin],

  propTypes: {
    // usually added by the ModalTrigger
    onRequestHide: React.PropTypes.func.isRequired,
    onSave: React.PropTypes.func.isRequired,
  },

  getInitialState: function() {
    return {
      amount: 0,
      errorMessage: null
    }
  },

  save: function (hideFnc) {
    if(!this.state.amount) {
      return;
    }

    var self = this;
    this.props.onSave(this.state.amount, function(err) {
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

    var amountLink = {
      value: this.state.amount,
      requestChange: _.bind(this.debounce, this, [], "amount",
        function(newValue) {
          return parseFloat(newValue) || 0;
        }
      )
    }

    return (
      <BSModal
        title={__("transaction::recordTransaction")}
        bsSize="small"
        {...props}
      >
        <div className="modal-body">
          <MKAlert bsStyle="danger">
            {this.state.errorMessage}
          </MKAlert>
          <label>
            {__("transaction::transactionAmount")}
            <BSInput type="text" valueLink={amountLink} />
          </label>
        </div>
        <div className="modal-footer">
          <BSButton
            onClick={this.save.bind(this, this.props.onRequestHide)}
            disabled={!_.isNumber(this.state.amount) || !this.state.amount}
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

module.exports = AddTransactionModal;
