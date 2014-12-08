/** @jsx React.DOM */
var prequire = require('parent-require')
var React = prequire("react");
var moment = prequire("moment");
var PropTypes = React.PropTypes;
var _ = require("lodash");
var billUtils = require("../common/billUtils");

var formatMoney = function(amount) {
  return _.isNumber(amount) ? amount.toFixed(2) + "$" : "0.00$";
}
var formatDate = function(date, format) {
  return moment(date).format(format);
}
var locales = require("../../locales/en/transaction");
var __ = function(key) {
  key = key.split("::")[1];
  return locales[key] || "";
}

var Invoice = React.createClass({displayName: 'Invoice',
  propTypes: {
    customerEmail: PropTypes.string,
    discounts: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.number,
        value: PropTypes.number,
        isAfterTax: PropTypes.bool
      })
    ),
    idEvent: PropTypes.number,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        price: PropTypes.number,
        quantity: PropTypes.number,
        name: PropTypes.string
      })
    ),
    notes: PropTypes.string,
    category: PropTypes.string,

    idBill: PropTypes.number,
    idUser: PropTypes.number,
    billTotal: PropTypes.number,
    taxes: PropTypes.arrayOf(
      PropTypes.shape({
        rate: PropTypes.number,
        name: PropTypes.string
      })
    ),
    billTotalInfo: PropTypes.shape({
      total: PropTypes.number,
      subtotal: PropTypes.number,
      taxes: PropTypes.arrayOf(PropTypes.number),
      discountBeforeTax: PropTypes.shape({
        discount: PropTypes.number,
        subtotal: PropTypes.number,
      }),
      discountAfterTax: PropTypes.shape({
        discount: PropTypes.number,
        subtotal: PropTypes.number,
      }),
    })
  },

  render: function() {
    var self = this;
    var infos = billUtils.orderBillInfo(
      this.props.billTotalInfo,
      this.props.taxes,
      __
    );

    var billInfoRows = _.map(infos, function(info, i) {
      var wrapper = info.isBold ? React.DOM.b : React.DOM.span;
      return (
        React.DOM.tr({key: i}, 
          React.DOM.td(null, 
            wrapper(null, info.text)
          ), 
          React.DOM.td(null, 
            wrapper(null, formatMoney(info.amount))
          )
        )
      );
    });

    return (
      React.DOM.div(null, 
        React.DOM.h1({key: "title"}, 
          "MyKoop invoice #", this.props.idBill
        ), 
        React.DOM.p({key: "date"}, 
          "Date purchased: ", formatDate(new Date(), "LLLL")
        ), 
        React.DOM.table({key: "info"}, 
          React.DOM.tbody(null, 
            billInfoRows
          )
        ), 
        React.DOM.p({key: "items"}, 
          React.DOM.h2({key: "title"}, "Items purchased"), 
          React.DOM.ul(null, 
            _.map(this.props.items, function(item, i) {
              return (
                React.DOM.li({key: i}, 
                  item.name, ": ", formatMoney(item.price), " x", item.quantity
                )
              );
            })
          )
        )
      )
    );
  }
});

module.exports = Invoice;
