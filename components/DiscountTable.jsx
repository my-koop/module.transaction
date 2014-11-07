var React     = require("react");
var PropTypes = React.PropTypes;
var BSInput   = require("react-bootstrap/Input");
var BSCol     = require("react-bootstrap/Col");

var MKListModButtons = require("mykoop-core/components/ListModButtons");
var MKFormTable      = require("mykoop-core/components/FormTable");

// Use this to provide localization strings.
var __ = require("language").__;
var formatMoney = require("language").formatMoney;
var _ = require("lodash");
var util = require("util");

var DiscountType = {};
DiscountType[DiscountType["percentage"] = 0] = "percentage";
DiscountType[DiscountType["fixed"] = 1] = "fixed";

var discountAddon = {};
discountAddon[DiscountType["percentage"]] = "%";
discountAddon[DiscountType["fixed"]] = "$";

var DiscountTable = React.createClass({
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
  addDiscount: function() {
    var discount = {
      isAfterTax: false,
      value: 0,
      type: DiscountType.percentage
    }
    this.state.discounts.push(discount);
    this.setState({
      discounts: this.state.discounts
    })
  },

  debouncers: {},
  refreshDiscount: function(i, newValue) {
    var self = this;
    var discount = this.state.discounts[i];
    if(!this.debouncers[i]) {
      this.debouncers[i] = _.debounce(function(i, newValue) {
        discount.value = parseFloat(newValue) || 0;
        self.setState({
          discounts: self.state.discounts
        });
      }, 2000);
    }
    var debouncer = this.debouncers[i];
    // update now with string for ui refresh
    discount.value = newValue;
    this.setState({
      discounts: this.state.discounts
    }, function() {
      debouncer(i, newValue);
    })
  },

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    var discounts = this.state.discounts.map(function(discount, i) {
      var link = {
        value: discount.value,
        requestChange: _.bind(self.refreshDiscount, self, i)
      }
      return (
        [ <MKListModButtons
            buttons={[
              {
                icon: "remove",
                warningMessage: __("areYouSure")
              },
              {
                icon: "dollar",
                props: {
                  className: "active"
                }
              },
              {
                content: "%"
              }
            ]}
          />,
          <BSInput type="text" valueLink={link} addonAfter={discountAddon[discount.type]} />
        ]
      );
    });
    var addButton = {
      icon: "plus",
      callback: this.addDiscount
    };
    discounts.push([
      <MKListModButtons buttons={[addButton]} />,__("transaction::addDiscount")]);

    return (
      <BSCol md={6}>
        <MKFormTable
          headers={[
            {
              title:__("actions"),
              props: {
                style: {width:"110px"}
              }
            },
            __("transaction::discounts")
          ]}
          data={discounts}
        />
      </BSCol>
    );
  }

});

module.exports = DiscountTable;
