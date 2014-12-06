var React     = require("react");
var BSInput   = require("react-bootstrap/Input");
var BSCol     = require("react-bootstrap/Col");

var MKListModButtons      = require("mykoop-core/components/ListModButtons");
var MKOrderedTableActions = require("mykoop-core/components/OrderedTableActions");
var MKFormTable           = require("mykoop-core/components/FormTable");
var MKDebouncerMixin      = require("mykoop-core/components/DebouncerMixin");

// Use this to provide localization strings.
var __ = require("language").__;
var formatMoney = require("language").formatMoney;
var _ = require("lodash");
var util = require("util");

// Possible type of discount
var discountInfo = require("../lib/common/discountTypes").DiscountInfo;
var billUtils = require("../lib/common/billUtils");

var DiscountTable = React.createClass({
  mixins: [MKDebouncerMixin],

  propTypes: {
    discounts: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        info: React.PropTypes.shape({
          isAfterTax: React.PropTypes.bool,
          value: React.PropTypes.number,
          type: React.PropTypes.number
        })
      })
    ),
    readOnly: React.PropTypes.bool,
    onChange: React.PropTypes.func.isRequired,
    hasTaxes: React.PropTypes.bool
  },
  ////////////////////////////
  /// Life Cycle methods
  getInitialState: function(props) {
    props = props || this.props;
    return {
      // {isAfterTax: boolean, value: number, type: DiscountType }
      discounts: props.discounts || []
    }
  },

  ////////////////////////////
  /// Component methods
  addDiscount: function() {
    var discount = {
      isAfterTax: false,
      value: 0,
      type: 0
    }
    this.state.discounts.push(discount);
    this.setDiscounts(this.state.discounts);
  },

  setDiscounts: function(discounts) {
    this.setState({
      discounts: discounts
    });
    this.props.onChange(discounts);
  },

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    if(this.props.readOnly) {
      return (
        <div>
          {_.map(this.state.discounts, function(discount, i) {
            return (
              <p key={i}>
                {discount.value}{discountInfo[discount.type].symbol}
              </p>
            );
          })}
        </div>
      );
    }

    var length = this.state.discounts.length;
    var discounts = this.state.discounts.map(function(discount, iDiscount) {
      // Value link to input
      var link = {
        value: discount.value,
        requestChange: _.bind(self.debounce, self, ["discounts", iDiscount], "value",
          function(newValue) {
            self.props.onChange(self.state.discounts);
            return parseFloat(newValue) || 0;
          }
        )
      }

      // Type switcher
      var typeSwitchers = _.map(discountInfo, function(info, type) {
        var buttonDef = {
          content: info.symbol,
          tooltip: __("transaction::changeDiscountType", {context: info.name}),
          props: {
            className: "active",
          }
        };
        if(discount.type !== type) {
          buttonDef.props.className = "";
          buttonDef.callback = function() {
            discount.type = type;
            self.setDiscounts(self.state.discounts);
          }
        }
        return buttonDef;
      });
      // add button to select if discount is applied before or after taxes
      if(self.props.hasTaxes) {
        typeSwitchers.push({
          content: __("transaction::tax"),
          tooltip: __("transaction::discountTaxSwitch", {context: discount.isAfterTax}),
          props: {
            className: discount.isAfterTax ? "active" : "",
          },
          callback: function() {
            discount.isAfterTax = !discount.isAfterTax;
            self.setDiscounts(self.state.discounts);
          }
        });
      }

      // Return row for this discount
      return [
        <MKOrderedTableActions
          content={self.state.discounts}
          index={iDiscount}
          onContentModified={self.setDiscounts}
        />,
        <BSInput
          type="text"
          valueLink={link}
        />,
        <MKListModButtons buttons={typeSwitchers} />
      ];
    });

    // Put an Add button at the top of the table
    var addButton = {
      icon: "plus",
      tooltip: __("transaction::addDiscount"),
      callback: this.addDiscount
    };
    discounts.unshift([
      <MKListModButtons buttons={[addButton]} />
    ]);

    var uniqueActionsCount = length > 1 ? (length > 2 ? 3 : 2) : 1;
    return (
      <BSCol md={8}>
        <MKFormTable
          headers={[
            {
              title:__("actions"),
              props: {className: "list-mod-min-width-" + uniqueActionsCount}
            },
            __("transaction::discounts"),
            __("transaction::discountTypes")
          ]}
          data={discounts}
        />
      </BSCol>
    );
  }

});

module.exports = DiscountTable;
