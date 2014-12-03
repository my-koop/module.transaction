var React    = require("react/addons");
var BSPanel  = require("react-bootstrap/Panel");
var BSInput  = require("react-bootstrap/Input");

var MKDateTimePicker = require("mykoop-core/components/DateTimePicker");

var __ = require("language").__;
var _  = require("lodash");
var actions = require("actions");

var FinancialReport = React.createClass({
  propTypes: {

  },

  getInitialState: function() {
    return {
      fromDate: null,
      toDate: null
    }
  },

  onSubmit: function(e) {
    e.preventDefault();
  },

  onDateChange: function(whatDatePicker, date, dateStr){
    var state = this.state;
    state[whatDatePicker] = date;
    this.setState(state);
  },

  render: function(){

    return (
      <div>
        <h1> {__("transaction::financialReportWelcome")} </h1>
        <p> {__("transaction::financialReportExplanation")} </p>
        <form onSubmit={this.onSubmit}>
          <MKDateTimePicker
            time={false}
            min={new Date("2014-01-01")}
            max={new Date()}
            format="MMM dd, yyy"
            onChange={this.onDateChange.bind(null,"fromDate")}
          />
          <MKDateTimePicker
            time={false}
            min={new Date("2014-01-01")}
            max={new Date()}
            format="MMM dd, yyy"
            onChange={this.onDateChange.bind(null,"toDate")}
          />
          <BSInput
            type="submit"
            value={__("transaction::financialReportSubmit")}
          />
        </form>
        <BSPanel header={__("transaction::financialReportPanelHeader")}>

        </BSPanel>
      </div>
    );
  },

});

module.exports = FinancialReport;