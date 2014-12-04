var React    = require("react/addons");
var BSPanel  = require("react-bootstrap/Panel");
var BSInput  = require("react-bootstrap/Input");
var BSCol  = require("react-bootstrap/Col");
var BSGrid  = require("react-bootstrap/Grid");
var BSRow  = require("react-bootstrap/Row");

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

  formatReport: function(report){
    return (
      <div>
        <p>
          { __("transaction::financialReportFieldTotal")  + ": " + formatMoney(report.total)
          + __("transaction::financialReportIN") + report.transactions + " "
          + __("transaction::financialReportFieldTransactions")}
        </p>
        <p>
          {__("transaction::financialReportFieldTotalSales")   + ": " }
          <span className="text-success">  { formatMoney(report.totalSales) } </span>
          {__("transaction::financialReportIN") + report.sales + " "
          + __("transaction::financialReportFieldSales")}
        </p>
        <p>
          {__("transaction::financialReportFieldTotalRefunds")   + ": "}
          <span className="text-danger">{formatMoney(report.totalRefunds)} </span>
          {__("transaction::financialReportIN") + report.refunds + " "
          + __("transaction::financialReportFieldRefunds")}
         </p>
      </div>
    );
  },

  getReportHeader: function(){
    return (
      __("transaction::financialReportPanelHeaderStart") + formatDate(new Date(this.state.fromDate),"LLL") +
      __("transaction::financialReportPanelHeaderMid") + formatDate(new Date(this.state.toDate),"LLL")
    );
  },

  render: function(){
    var self = this;
    var categories = _.map(this.state.reports, function(report, key){
      return (
        <BSPanel key={key} header={__("transaction::financialReportCategory", { context: report.category})}>
          {self.formatReport(report)}
        </BSPanel>
      );
    })
    return (
      <div>
        <div block className="col-md-12">
          <h1> {__("transaction::financialReportWelcome")} </h1>
          <p> {__("transaction::financialReportExplanation")} </p>
        </div>
        <form onSubmit={this.onSubmit}>
          <div block className="col-md-4">
            {__("transaction::financialReportLabelFromDate")}
            <MKDateTimePicker
              format="yyyy-MM-dd"
              min={new Date("2014-01-01")}
              max={new Date()}
              onChange={this.onDateChange.bind(null,"fromDate")}
            />
          </div>
          <div block className="col-md-4">
            {__("transaction::financialReportLabelToDate")}
            <MKDateTimePicker
              format="yyyy-MM-dd"
              min={ new Date("2014-01-01")}
              max={ new Date()}
              onChange={this.onDateChange.bind(null,"toDate")}
            />
          </div>
          <div block className="col-md-12">
            <BSInput
              type="submit"
              value={__("transaction::financialReportSubmit")}
              bsStyle="primary"
            />
          </div>
        </form>
        { this.state.reports ?
          <div block className="col-md-8">
            <BSPanel header={this.getReportHeader()}>
              {categories}
            </BSPanel>
          </div>
          : null
        }
      </div>
    );
  },

});

module.exports = FinancialReport;