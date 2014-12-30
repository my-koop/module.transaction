var React     = require("react");
var BSTable   = require("react-bootstrap/Table");

// Utilities
var formatMoney = require("language").formatMoney;
var _ = require("lodash");
var __ = require("language").__;
var billUtils = require("../lib/common/billUtils");

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
      name: React.PropTypes.string.isRequired,
      rate: React.PropTypes.number.isRequired
    }))
  },
  ////////////////////////////
  /// Life Cycle methods


  ////////////////////////////
  /// component methods

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    var infos = billUtils.orderBillInfo(
      this.props.billInfo,
      this.props.taxInfos,
      __
    );

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
      <BSTable>
        <tbody>
          {billInfoRows}
        </tbody>
      </BSTable>
    );
  }

});

module.exports = NewBillPage;
