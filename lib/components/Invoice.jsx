/** @jsx React.DOM */
var React = require("react");
var moment = require("moment");
var PropTypes = React.PropTypes;
var _ = require("lodash");
var billUtils = require("../common/billUtils");
var accounting = require("accounting");
var formatMoney = function(amount) {
  return accounting.formatMoney(amount);
}
var formatDate = function(date, format) {
  return moment(date).format(format);
}
var locales = require("../../locales/en/transaction");
var __ = function(key) {
  key = key.split("::")[1];
  return locales[key] || "";
}

var Invoice = React.createClass({
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
        <tr key={i}>
          <td>
            <wrapper>{info.text}</wrapper>
          </td>
          <td>
            <wrapper>{formatMoney(info.amount)}</wrapper>
          </td>
        </tr>
      );
    });

    return (
      <div>
        <h1 key="title">
          MyKoop invoice #{this.props.idBill}
        </h1>
        <p key="date">
          Date purchased: {formatDate(new Date(), "LLLL")}
        </p>
        <table key="info">
          <tbody>
            {billInfoRows}
          </tbody>
        </table>
        <p key="items">
          <h2 key="title">Items purchased</h2>
          <ul>
            {_.map(this.props.items, function(item, i) {
              return (
                <li key={i}>
                  {item.name}: {formatMoney(item.price)} x{item.quantity}
                </li>
              );
            })}
          </ul>
        </p>
      </div>
    );
  }
});

module.exports = Invoice;
