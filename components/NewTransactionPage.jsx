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
var formatMoney = require("language").formatMoney;
var _ = require("lodash");
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
        items: res.items
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

  onItemSelected: function(option) {
    var id = option.original.item.id;
    var transactionItems = this.state.transaction;
    var i = _.findIndex(transactionItems, function(item) {
      return item.id === id;
    });
    if(~i) {
      transactionItems[i].quantity++;
    } else {
      var item = _.pick(option.original.item,
        "id",
        "name",
        "code",
        "price"
      );
      item.quantity = 1;
      transactionItems.push(item);
    }
    this.setState({transaction: transactionItems});
  },

  render: function() {
    var self = this;
    // TableSorter Config
    var CONFIG = {
      defaultOrdering: ["code", "name", "price", "quantity", "actions"],
      columns: {
        name: {
          name: __("inventory::name"),
        },
        price: {
          name: __("inventory::price"),
          cellGenerator: function(item, i) {
            return formatMoney(item.price);
          }
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
      return {
        display: util.format("%s: %s", _(item.code).toString(), _(item.name).toString()),
        toString: function(){ return this.display; },
        item: item
      };
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
              onOptionSelected={this.onItemSelected}
              clearOnSelect
              maxVisible={4}
              // FIXME:: selected Item has "hover" class, but no css handle that class
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
