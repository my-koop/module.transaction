var React     = require("react");
var Typeahead = require("react-typeahead").Typeahead;
var BSCol     = require("react-bootstrap/Col");
var BSRow     = require("react-bootstrap/Row");
var BSPanel   = require("react-bootstrap/Panel");
var BSInput   = require("react-bootstrap/Input");

// My Koop components
var MKTableSorter       = require("mykoop-core/components/TableSorter");
var MKListModButtons    = require("mykoop-core/components/ListModButtons");
var MKSpinner           = require("mykoop-core/components/Spinner");
var MKCollapsablePanel  = require("mykoop-core/components/CollapsablePanel");
var MKAlertTrigger      = require("mykoop-core/components/AlertTrigger");
var MKDebouncerMixin    = require("mykoop-core/components/DebouncerMixin");
var MKDiscountTable     = require("./DiscountTable");

// Utilities
var __ = require("language").__;
var formatMoney = require("language").formatMoney;
var _ = require("lodash");
var actions = require("actions");
var util = require("util");

var NewBillPage = React.createClass({
  mixins: [MKDebouncerMixin],
  ////////////////////////////
  /// Life Cycle methods

  getInitialState: function() {
    return {
      items: [],
      // {id: number, name: string, code: number, price:number, quantity: number}
      bill: [],
      // ((total) => newTotal)[]
      discounts: []
    }
  },

  componentDidMount: function () {
    var self = this;
    MKSpinner.showGlobalSpinner();

    // Fetch inventory from database
    actions.inventory.list(function (err, res) {
      MKSpinner.hideGlobalSpinner();
      if (err) {
        console.error(err);
        MKAlertTrigger.showAlert(__("errors::error", {context: err.context}));
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
          var bill = _.reject(self.state.bill, { id: item.id });
          self.setState({
            bill: bill
          });
        }
      }
    ];
  },

  addCustomItem: function() {
    var billItems = this.state.bill;
    billItems.push({
      id: -1,
      // FIXME:: baking the name here means switching language won't show the
      // localized version
      name: __("transaction::customItem"),
      code: 0,
      price: 0,
      quantity: 1
    });
    this.setState({
      bill: billItems
    });
  },

  onItemSelected: function(option) {
    var id = option.original.item.id;
    // special case for custom item
    if(id === -1) {
      return this.addCustomItem();
    }

    var billItems = this.state.bill;
    var i = _.findIndex(billItems, function(item) {
      return item.id === id;
    });
    if(~i) {
      billItems[i].quantity++;
    } else {
      var item = _.pick(option.original.item,
        "id",
        "name",
        "code",
        "price"
      );
      item.quantity = 1;
      billItems.push(item);
    }
    this.setState({bill: billItems});
  },

  onDiscountChange: function() {
    var discounts = this.refs.discountTable.getDiscounts();
    this.setState({discounts: discounts});
  },

  ////////////////////////////
  /// Render method
  render: function() {
    var self = this;

    // TableSorter Config
    var BillTableConfig = {
      defaultOrdering: [ "actions", "code", "name", "price", "quantity"],
      columns: {
        name: {
          name: __("name"),
        },
        price: {
          name: __("price"),
          cellGenerator: function(item, i) {
            if(item.id === -1) {
              var link = {
                value: item.price,
                requestChange: function(newValue) {
                  self.debounce(["bill", i], "price", function(newValue) {
                    return parseFloat(newValue) || 0;
                  }, newValue);
                }
              }
              return <BSInput type="text" valueLink={link} addonAfter="$" />
            }
            return formatMoney(item.price);
          }
        },
        quantity: {
          name: __("quantity"),
          cellGenerator: function(item, i) {
            var link = {
              value: item.quantity || 0,
              requestChange: _.bind(self.debounce, self, ["bill", i], "quantity",
                function(newValue) {
                  return parseInt(newValue) || 0;
                }
              )
            }
            return (
              <BSInput type="text" valueLink={link} />
            );
          }
        },
        code: {
          name: __("code"),
        },
        actions: {
          name: __("actions"),
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
    addItemOptions.push({
      display: __("transaction::customItem"),
      toString: function() { return this.display; },
      item: {
        id: -1,
      }
    });

    /////////////////////////////////
    // Bill total amount calculations
    var subtotal = _.reduce(this.state.bill, function(subtotal, item) {
      return subtotal + ((item.price * item.quantity) || 0);
    }, 0);
    var discounts = this.state.discounts;
    _.forEach(discounts.beforeTax, function(discount) {
      subtotal = discount(subtotal);
    });
    // FIXME:: Don't use hardcoded values
    var taxInfo = [
      {
        type: "tvq",
        rate: 0.0975
      },
      {
        type: "tps",
        rate: 0.05
      }
    ];
    var total = subtotal;
    // Apply taxes
    var taxes = _.map(taxInfo, function(tax, i) {
      var taxAmount = total * tax.rate;
      total += taxAmount;
      var taxText = util.format("%s (%s\%) : %s",
        __("transaction::tax", {context: tax.type}),
        (tax.rate * 100).toFixed(2),
        formatMoney(taxAmount)
      );
      return (
        <div key={i}>
          {taxText}
        </div>
      );
    });

    _.forEach(discounts.afterTax, function(discount) {
      total = discount(total);
    });
    /////////////////////////////////

    return (
      <BSCol md={12}>
        <h1>
          {__("transaction::newBillWelcome")}
        </h1>
        <BSPanel header={__("transaction::itemList")}>
          <BSRow>
            <BSCol md={4} sm={6}>
              <label>
                {__("transaction::addItemToBill")}
              </label>
              <Typeahead
                options={addItemOptions}
                onOptionSelected={this.onItemSelected}
                clearOnSelect
                maxVisible={4}
                customClasses={{
                  input: "form-control",
                  results: "mk-typeahead-results",
                  listItem: "mk-typeahead-item",
                  listAnchor: "mk-typeahead-anchor",
                }}
              />
            </BSCol>
          </BSRow>
          <BSRow>
            <MKTableSorter
              config={BillTableConfig}
              items={this.state.bill}
              striped
              condensed
              hover
              responsive
            />
          </BSRow>
        </BSPanel>
        <MKCollapsablePanel header={__("transaction::discountHeader")} >
          <MKDiscountTable ref="discountTable" onChange={this.onDiscountChange} />
        </MKCollapsablePanel>
        <BSPanel header={__("transaction::billInfo")}>
          { !_.isEmpty(taxInfo) ? (
              <div>
                <div>
                  {__("transaction::subtotal")} : {formatMoney(subtotal)}
                </div>
                {taxes}
              </div>
            ) : null
          }
          <div>
            {__("transaction::total")} : {formatMoney(total)}
          </div>
        </BSPanel>
      </BSCol>
    );
  }

});

module.exports = NewBillPage;
