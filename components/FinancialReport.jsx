var React    = require("react/addons");
var BSPanel  = require("react-bootstrap/Panel");
var BSInput  = require("react-bootstrap/Input");

var MKDateTimePicker = require("mykoop-core/components/DateTimePicker");

var __ = require("language").__;
var formatDate = require("language").formatDate;
var formatMoney = require("language").formatMoney;
var _  = require("lodash");
var actions = require("actions");

var FinancialReport = React.createClass({
  propTypes: {

  },

  getInitialState: function() {
    return {
      fromDate: null,
      toDate: null,
      reports: null
    }
  },

  onSubmit: function(e) {
    e.preventDefault();
    if(!this.state.toDate || !this.state.fromDate){
      return;
    }
    var self = this;
    actions.transaction.report({
      data: {
        fromDate: self.state.fromDate,
        toDate: self.state.toDate
      }
    }, function(err, res){
        if(err) {
          console.log(err);
        } else {
          self.setState({
            reports: res.reports
          });
        }
      }
    );
  },

  onDateChange: function(whatDatePicker, date, dateStr){
    var state = this.state;
    state[whatDatePicker] = dateStr;
    this.setState(state);
  },

  render: function(){
    var categories = _.map(this.state.reports, function(report){
      return (
        <BSPanel header={__("transaction::financialReportCategory", { context: report.category})}>
          <p> {__("transaction::financialReportFieldTotal")        + ": " + formatMoney(report.total) } </p>
          <p> {__("transaction::financialReportFieldTotalSales")   + ": " + formatMoney(report.totalSales) } </p>
          <p> {__("transaction::financialReportFieldTotalRefunds") + ": " + formatMoney(report.totalRefunds) } </p>
          <p> {__("transaction::financialReportFieldTransactions") + ": " + report.transactions } </p>
          <p> {__("transaction::financialReportFieldSales")        + ": " + report.sales } </p>
          <p> {__("transaction::financialReportFieldRefunds")      + ": " + report.refunds } </p>
        </BSPanel>
      );
    })
    return (
      <div>
        <h1> {__("transaction::financialReportWelcome")} </h1>
        <p> {__("transaction::financialReportExplanation")} </p>
        <form onSubmit={this.onSubmit}>
          <MKDateTimePicker
            time={false}
            format="yyyy-MM-dd"
            min={new Date("2014-01-01")}
            max={new Date()}
            onChange={this.onDateChange.bind(null,"fromDate")}
          />
          <MKDateTimePicker
            time={false}
            format="yyyy-MM-dd"
            min={ new Date("2014-01-01")}
            max={ new Date()}
            onChange={this.onDateChange.bind(null,"toDate")}
          />
          <BSInput
            type="submit"
            value={__("transaction::financialReportSubmit")}
          />
        </form>
        { this.state.reports ?
          <BSPanel header={__("transaction::financialReportPanelHeader")}>
            {categories}
          </BSPanel>
          : null
        }
      </div>
    );
  },

});

module.exports = FinancialReport;