var React = require("react");
var Typeahead = require("react-typeahead").Typeahead;
var PropTypes = React.PropTypes;
var BSCol = require("react-bootstrap/Col");
var BSPanel = require("react-bootstrap/Panel");
var BSInput = require("react-bootstrap/Input");

var MKTableSorter = require("mykoop-core/components/TableSorter");
var MKListModButtons = require("mykoop-core/components/ListModButtons");

// Use this to provide localization strings.
var __ = require("language").__;
var actions = require("actions");
var util = require("util");

var NewTransactionPage = React.createClass({
  ////////////////////////////
  /// Life Cycle methods

  getInitialState: function() {
    return {
      items: [],
      transaction: []
    }
  },

  componentDidMount: function () {
    var self = this;

    actions.inventory.list(function (err, res) {
      if (err) {
        console.error(err);
        return;
      }

      self.setState({
        items: res.items,
        transaction: res.items
      });
    });
  },

  ////////////////////////////
  /// component methods
  actionsGenerator: function(item) {
    var self = this;
    return [
      {
        icon: "remove",
        warningMessage: __("areYouSure"),
        tooltip: {
          text: __("remove"),
          overlayProps: {
            placement: "top"
          }
        },
        callback: function() {
          var transaction = _.reject(self.state.transaction, { id: item.id });
          self.setState({
            transaction: transaction
          });
        }
      }
    ];
  },


  render: function() {
    var self = this;
    // TableSorter Config
    var CONFIG = {
      columns: {
        name: {
          name: __("inventory::name"),
        },
        quantity: {
          name: __("inventory::quantity"),
          cellGenerator: function(item, i) {
            var link = {
              value: item.quantity || 0,
              requestChange: function(newValue) {
                self.state.transaction[i].quantity = parseInt(newValue);
                self.setState({
                  transaction: self.state.transaction
                });
              }
            }
            return (
              <BSInput type="number" valueLink={link} />
            );
          }
        },
        code: {
          name: __("inventory::code"),
        },
        actions: {
          name: __("inventory::actions"),
          isStatic: true,
          cellGenerator: function(item) {
            return (
              <MKListModButtons
                defaultTooltipDelay={500}
                buttons={self.actionsGenerator(item)}
              />
            );
          }
        }
      }
    };

    var addItemOptions = _.map(this.state.items, function(item) {
      return util.format("%s: %s", _(item.code).toString(), _(item.name).toString());
    });

    return (
      <BSCol md={12}>
        <h1>
          {__("transaction::newTransactionWelcome")}
        </h1>
        <BSPanel header={__("transaction::itemList")}>
          <MKTableSorter
            config={CONFIG}
            items={this.state.transaction}
            striped
            condensed
            hover
            responsive
          />
          <BSCol md={2} sm={4} >
            <Typeahead
              options={addItemOptions}
              maxVisible={4}
              customClasses={{
                input: "form-control",
                results: "list-group",
                listItem: "list-group-item",
                listAnchor: "",
              }}
            />
          </BSCol>
        </BSPanel>
      </BSCol>
    );
  }

});

module.exports = NewTransactionPage;
