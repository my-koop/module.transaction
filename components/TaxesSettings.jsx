var React = require("react");

var BSCol = require("react-bootstrap/Col");
var BSInput = require("react-bootstrap/Input");

var MKOrderedTableActions = require("mykoop-core/components/OrderedTableActions");
var MKFormTable = require("mykoop-core/components/FormTable");
var MKListModButtons = require("mykoop-core/components/ListModButtons");

var _ = require("lodash");
var language = require("language");
var __ = language.__;
var taxUtils = require("../lib/common/taxUtils");

var TaxesSettings = React.createClass({
  propTypes: {
    settingsRaw: React.PropTypes.object.isRequired,
    addSettingsGetter: React.PropTypes.func.isRequired
  },

  getInitialState: function(props) {
    var props = props || this.props;
    return taxUtils.parseSettings(props.settingsRaw[taxUtils.settingsKey]);
  },

  componentWillMount: function () {
    this.props.addSettingsGetter(this.getSettings);
  },

  componentWillReceiveProps: function (nextProps) {
    this.setState(this.getInitialState(nextProps));
  },

  getSettings: function() {
    var settings = {};
    settings[taxUtils.settingsKey] = taxUtils.stringifySettings(this.state);
    return settings;
  },

  addTaxOption: function() {
    var options = this.state.taxes;
    options.push({
      name: "",
      rate: 0
    });
    this.setTaxOptions(options);
  },

  setTaxOptions: function(options) {
    this.setState({
      taxes: options
    });
  },

  render: function () {
    var self = this;
    var taxOptions = this.state.taxes;
    var areTaxesActive = this.state.active;

    var taxInfoRows = _.map(
      taxOptions,
      function(taxInfo, i) {
        var nameLink = {
          value: taxInfo.name,
          requestChange: function(newName) {
            taxOptions[i].name = newName;
            self.setTaxOptions(taxOptions);
          }
        };
        var rateLink = {
          value: taxInfo.rate,
          requestChange: function(newRate) {
            taxOptions[i].rate = newRate;
            self.setTaxOptions(taxOptions);
          }
        };
        var actions = areTaxesActive && (
          <MKOrderedTableActions
            content={taxOptions}
            index={i}
            onContentModified={self.setTaxOptions}
          />
        );
        return _.compact([
          actions,
          <BSInput
            type="text"
            valueLink={nameLink}
            readOnly={!areTaxesActive}
          />,
          <BSInput
            type="number"
            valueLink={rateLink}
            addonAfter="%"
            readOnly={!areTaxesActive}
          />
        ]);
      }
    );

    if(areTaxesActive) {
      var newTaxOptionButton = [{
        icon: "plus",
        tooltip: __("taxes::addTaxOption"),
        callback: this.addTaxOption
      }];
      taxInfoRows.unshift([
        <MKListModButtons
          buttons={newTaxOptionButton}
        />
      ]);
    }

    var length = taxOptions.length;
    var uniqueActionsCount = length > 1 ? (length > 2 ? 3 : 2) : 1;
    var tableHeaders = [
      {
        title: __("actions"),
        props: {className: "list-mod-min-width-" + uniqueActionsCount}
      },
      __("taxes::name"),
      __("taxes::rate")
    ];
    if(!areTaxesActive) {
      // No actions when inactive
      tableHeaders.shift();

    }

    var activeLink = {
      value: areTaxesActive,
      requestChange: function(newActive) {
        self.setState({
          active: +newActive
        });
      }
    }

    return (
      <BSCol md={6}>
        <BSInput
          type="checkbox"
          label={__("taxes::activeCheckboxLabel")}
          checkedLink={activeLink}
        />
        <MKFormTable
          headers={tableHeaders}
          data={taxInfoRows}
        />
      </BSCol>
    );
  }
});

module.exports = TaxesSettings;
