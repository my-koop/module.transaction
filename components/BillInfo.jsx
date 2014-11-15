var React     = require("react");
var BSTable   = require("react-bootstrap/Table");

// Utilities
var formatMoney = require("language").formatMoney;
var _ = require("lodash");
var __ = require("language").__;
var util = require("util");

var NewBillPage = React.createClass({

  propTypes: {
    billInfo: React.PropTypes.shape({
      total: React.PropTypes.number.isRequired,
      subtotal: React.PropTypes.number.isRequired,
      taxes: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
      discountBeforeTax: React.PropTypes.shape({
        discount: React.PropTypes.number.isRequired,
        subtotal: React.PropTypes.number.isRequired
      }),
      discountAfterTax: React.PropTypes.shape({
        discount: React.PropTypes.number.isRequired,
        subtotal: React.PropTypes.number.isRequired
      })
    }).isRequired,
    taxInfos: React.PropTypes.arrayOf(React.PropTypes.shape({
      localizeKey: React.PropTypes.string.isRequired,
      rate: React.PropTypes.number.isRequired
    })).isRequired
  },
  ////////////////////////////
  /// Life Cycle methods


  ////////////////////////////
  /// component methods

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    var infos = [];
    var billInfo = this.props.billInfo;
    if(billInfo.discountBeforeTax.discount) {
      infos.push({
        text: __("transaction::subtotal"),
        amount: billInfo.discountBeforeTax.subtotal
      });
      infos.push({
        text: __("transaction::discounts"),
        amount: billInfo.discountBeforeTax.discount
      });
    }
    infos.push({
      text: __("transaction::subtotal"),
      amount: billInfo.subtotal,
      isBold: true
    });

    infos = infos.concat(_.map(billInfo.taxes, function(taxAmount, i) {
      var info = self.props.taxInfos[i];
      var taxText = util.format("%s (%s\%)",
        __("transaction::tax", {context: info.localizeKey}),
        (info.rate * 100).toFixed(3)
      );
      return {
        text: taxText,
        amount: taxAmount
      };
    }));

    if(billInfo.discountAfterTax.discount) {
      infos.push({
        text: __("transaction::subtotal"),
        amount: billInfo.discountAfterTax.subtotal
      });
      infos.push({
        text: __("transaction::discounts"),
        amount: billInfo.discountAfterTax.discount
      });
    }
    infos.push({
      text: __("transaction::total"),
      amount: billInfo.total,
      isBold: true
    });

    var billInfoRows = _.map(infos, function(info, i) {
      var className = info.isBold ? "bold-row" : "";
      return (
        <tr key={i} className={className}>
          <td>
            {info.text}
          </td>
          <td>
            {formatMoney(info.amount)}
          </td>
        </tr>
      );
    });

    return (
      <BSTable className="min-size-table">
        <tbody>
          {billInfoRows}
        </tbody>
      </BSTable>
    );
  }

});

module.exports = NewBillPage;
