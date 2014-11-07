var React     = require("react");
var PropTypes = React.PropTypes;
var BSInput   = require("react-bootstrap/Input");
var BSCol     = require("react-bootstrap/Col");

var MKListModButtons = require("mykoop-core/components/ListModButtons");
var MKFormTable      = require("mykoop-core/components/FormTable");
var MKDebouncerMixin = require("mykoop-core/components/DebouncerMixin");

// Use this to provide localization strings.
var __ = require("language").__;
var formatMoney = require("language").formatMoney;
var _ = require("lodash");
var util = require("util");

var discountInfo = [
  {
    name: "percentage",
    symbol: "%",
    applyDiscount: function(discountValue, amount) {
      return amount * ((100 - discountValue) / 100);
    }
  },
  {
    name: "fixed",
    symbol: "$",
    applyDiscount: function(discountValue, amount) {
      return amount - discountValue;
    }
  }
];

var DiscountTable = React.createClass({
  mixins: [MKDebouncerMixin],

  propTypes: {
      onChange: React.PropTypes.func.isRequired
  },
  ////////////////////////////
  /// Life Cycle methods
  getInitialState: function() {
    return {
      // {isAfterTax: boolean, value: number, type: DiscountType }
      discounts: []
    }
  },

  ////////////////////////////
  /// Component methods
  getDiscounts: function() {
    var discounts = {
      beforeTax: [],
      afterTax: []
    };
    _.forEach(this.state.discounts, function(discount) {
      var func = discountInfo[discount.type]
        .applyDiscount.bind(null, discount.value);

      if(discount.isAfterTax) {
        discounts.afterTax.push(func);
      } else {
        discounts.beforeTax.push(func);
      }
    });
    return discounts;
  },

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
    }, this.props.onChange);
  },

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    var length = this.state.discounts.length;
    var discounts = this.state.discounts.map(function(discount, iDiscount) {
      // Value link to input
      var link = {
        value: discount.value,
        requestChange: _.bind(self.debounce, self, ["discounts", iDiscount], "value",
          function(newValue) {
            self.props.onChange();
            return parseFloat(newValue) || 0;
          }
        )
      }

      // Type switcher
      var typeSwitchers = _.map(discountInfo, function(info, type) {
        var buttonDef = {
          content: info.symbol,
          props: {
            className: "active"
          }
        };
        if(discount.type !== type) {
          buttonDef.props = {
            className: ""
          };
          buttonDef.callback = function() {
            discount.type = type;
            self.setDiscounts(self.state.discounts);
          }
        }
        return buttonDef;
      });

      // Delete button
      actionButtons = [
        {
          icon: "remove",
          warningMessage: __("areYouSure"),
          callback: function() {
            self.state.discounts.splice(iDiscount, 1);
            self.setDiscounts(self.state.discounts);
          }
        },
        {
          icon: "arrow-up",
          hide: iDiscount === 0,
          callback: function() {
            var discounts = self.state.discounts;
            discounts.splice(iDiscount - 1, 0, discounts.splice(iDiscount, 1)[0]);
            self.setDiscounts(discounts);
          }
        },
        {
          icon: "arrow-down",
          hide: iDiscount >= (length - 1),
          callback: function() {
            var discounts = self.state.discounts;
            discounts.splice(iDiscount + 1, 0, discounts.splice(iDiscount, 1)[0]);
            self.setDiscounts(discounts);
          }
        },
      ];

      // Return row for this discount
      return (
        [
          <MKListModButtons buttons={actionButtons} />,
          <BSInput
            type="text"
            valueLink={link}
            //addonAfter={discountInfo[discount.type].symbol}
          />,
          <MKListModButtons buttons={typeSwitchers} />
        ]
      );
    });

    // Put an Add button at the top of the table
    var addButton = {
      icon: "plus",
      callback: this.addDiscount
    };
    discounts.unshift([
      <MKListModButtons buttons={[addButton]} />,__("transaction::addDiscount")
    ]);

    return (
      <BSCol md={8}>
        <MKFormTable
          headers={[
            {
              title:__("actions")
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
