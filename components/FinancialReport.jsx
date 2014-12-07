var React    = require("react/addons");
var BSPanel  = require("react-bootstrap/Panel");
var BSInput  = require("react-bootstrap/Input");
var BSCol  = require("react-bootstrap/Col");
var BSGrid  = require("react-bootstrap/Grid");
var BSRow  = require("react-bootstrap/Row");

var MKDateTimePicker = require("mykoop-core/components/DateTimePicker");
var MKAlert = require("mykoop-core/components/Alert");

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
    var fromDate = this.state.fromDate;
    var toDate = this.state.toDate;
    if(!fromDate || !toDate) {
      return;
    }
    var self = this;
    actions.transaction.report({
      data: {
        fromDate: fromDate,
        toDate: toDate
      },
      options: {
        i18nErrors: {},
        alertErrors: true
      }
    }, function(err, res) {
      if(err) {
        console.log(err);
      } else {
        self.setState({
          reports: res.reports,
          fromDateReport: fromDate,
          toDateReport: toDate,
        });
      }
    });
  },

  onDateChange: function(whatDatePicker, date, dateStr) {
    var state = this.state;
    state[whatDatePicker] = date;
    this.setState(state);
  },

  formatReport: function(report) {
    return (
      <div>
        <p key="transactions">
          {__("transaction::financialReportFieldTotal") + ": " + formatMoney(report.total)
          + __("transaction::financialReportIN") + report.transactions + " "
          + __("transaction::financialReportFieldTransactions")}
        </p>
        <p key="sales">
          {__("transaction::financialReportFieldTotalSales") + ": " }
          <span className="text-success">  { formatMoney(report.totalSales) } </span>
          {__("transaction::financialReportIN") + report.sales + " "
          + __("transaction::financialReportFieldSales")}
        </p>
        <p key="refunds">
          {__("transaction::financialReportFieldTotalRefunds") + ": "}
          <span className="text-danger">{formatMoney(report.totalRefunds)} </span>
          {__("transaction::financialReportIN") + report.refunds + " "
          + __("transaction::financialReportFieldRefunds")}
         </p>
      </div>
    );
  },

  getReportHeader: function() {
    return (
      __("transaction::financialReportPanelHeaderStart") +
        formatDate(this.state.fromDateReport, "LLL") +
      __("transaction::financialReportPanelHeaderMid") +
       formatDate(this.state.toDateReport, "LLL")
    );
  },

  displayReport: function(categories) {
    if(this.state.reports) {
      if(this.state.reports.length > 0) {
        return (
          <div block className="col-md-8">
            <BSPanel header={this.getReportHeader()}>
              {categories}
            </BSPanel>
          </div>
        );
      } else {
        return (
          <div block className="col-md-8">
            <MKAlert bsStyle="danger">
              {__("transaction::financialReportNoResult")}
            </MKAlert>
          </div>
        );
      }
    }
    return null;
  },

  render: function() {
    var self = this;
    var categories = _.map(this.state.reports, function(report, key) {
      return (
        <BSPanel key={key} header={__("transaction::financialReportCategory", { context: report.category})}>
          {self.formatReport(report)}
        </BSPanel>
      );
    })
    return (
      <div>
        <BSRow>
          <BSCol xs={12}>
            <h1> {__("transaction::financialReportWelcome")} </h1>
            <p> {__("transaction::financialReportExplanation")} </p>
          </BSCol>
        </BSRow>
        <BSRow>
          <BSCol xs={12}>
            <form onSubmit={this.onSubmit}>
              <BSRow>
                <BSCol md={4}>
                  {__("transaction::financialReportLabelFromDate")}
                  <MKDateTimePicker
                    date={this.state.fromDate}
                    max={this.state.toDate || undefined}
                    onChange={this.onDateChange.bind(null,"fromDate")}
                  />
                </BSCol>
                <BSCol md={4}>
                  {__("transaction::financialReportLabelToDate")}
                  <MKDateTimePicker
                    date={this.state.toDate}
                    min={this.state.fromDate || undefined}
                    onChange={this.onDateChange.bind(null,"toDate")}
                  />
                </BSCol>
              </BSRow>
              <BSRow className="top-margin-15">
                <BSCol md={12}>
                  <BSInput
                    type="submit"
                    disabled={!this.state.toDate || !this.state.fromDate}
                    value={__("transaction::financialReportSubmit")}
                    bsStyle="primary"
                  />
                </BSCol>
              </BSRow>
            </form>
          </BSCol>
        </BSRow>
        <BSRow>
          <BSCol xs={12}>
            {this.displayReport(categories)}
          </BSCol>
        </BSRow>
      </div>
    );
  },

});

module.exports = FinancialReport;
