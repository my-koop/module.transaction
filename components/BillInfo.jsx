var React     = require("react");
var BSTable   = require("react-bootstrap/Table");

// Utilities
var formatMoney = require("language").formatMoney;
var _ = require("lodash");

var NewBillPage = React.createClass({

  propTypes: {
    infos: React.PropTypes.arrayOf(React.PropTypes.shape({
      text: React.PropTypes.renderable.isRequired,
      amount: React.PropTypes.number.isRequired,
      isBold: React.PropTypes.bool
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

    var billInfoRows = _.map(this.props.infos, function(info, i) {
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
    /////////////////////////////////

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
