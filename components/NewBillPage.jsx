var React         = require("react");
var Typeahead     = require("react-typeahead").Typeahead;
var BSCol         = require("react-bootstrap/Col");
var BSRow         = require("react-bootstrap/Row");
var BSPanel       = require("react-bootstrap/Panel");
var BSTable       = require("react-bootstrap/Table");
var BSInput       = require("react-bootstrap/Input");
var BSButton      = require("react-bootstrap/Button");
var BSButtonGroup = require("react-bootstrap/ButtonGroup");

// My Koop components
var MKTableSorter         = require("mykoop-core/components/TableSorter");
var MKListModButtons      = require("mykoop-core/components/ListModButtons");
var MKCollapsablePanel    = require("mykoop-core/components/CollapsablePanel");
var MKAlertTrigger        = require("mykoop-core/components/AlertTrigger");
var MKIcon                = require("mykoop-core/components/Icon");
var MKDebouncerMixin      = require("mykoop-core/components/DebouncerMixin");
var MKConfirmationTrigger = require("mykoop-core/components/ConfirmationTrigger");
var MKDiscountTable       = require("./DiscountTable");
var MKBillInfo            = require("./BillInfo");
var MKCustomerInformation = require("./CustomerInformation");

var billUtils = require("../lib/common_modules/billUtils");

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
      // { info : {isAfterTax: boolean, value: number, type: DiscountType }
      // apply: ((total) => newTotal)[] }
      discounts: [],
      customerEmail: null,
      // Transaction.TaxInfo[]
      taxInfos: []
    }
  },

  componentDidMount: function () {
    var self = this;
    // Fetch inventory from database
    actions.inventory.list(function (err, res) {
      if (err) {
        console.error(err);
        MKAlertTrigger.showAlert(__("errors::error", {context: err.context}));
        return;
      }

      self.setState({
        items: res.items
      });
    });

    actions.transaction.taxes.get(function(err, taxInfos) {
      if (err) {
        console.error(err);
        MKAlertTrigger.showAlert(__("errors::error", {context: err.context}));
        return;
      }

      self.setState({
        taxInfos: taxInfos
      });
    });
  },

  ////////////////////////////
  // Member fields
  total: 0,

  ////////////////////////////
  /// component methods
  saveBill: function(archiveBill) {
    var self = this;
    actions.transaction.bill.new(
      {
        data: {
          total: this.total,
          archiveBill: archiveBill,
          customerEmail: this.state.customerEmail,
          items: _.map(this.state.bill, function(item) {
            return {
              id: item.id,
              price: item.price,
              quantity: item.quantity
            };
          }),
          discounts: _.map(this.state.discounts, function(discount) {
            return  {
              type: discount.info.type,
              value: discount.info.value,
              isAfterTax: discount.info.isAfterTax
            };
          })
        }
      }, function (err, res) {
        if (err) {
          console.error(err);
          MKAlertTrigger.showAlert(__("errors::error", {context: err.context}));
          return;
        }
        MKAlertTrigger.showAlert(__("success"));
      }
    );
  },

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

  // Need a unique id event for custom item, otherwise it deletes them all onDelete
  customItemId: -1,
  addCustomItem: function() {
    var billItems = this.state.bill;
    billItems.push({
      id: this.customItemId--,
      name: {toString: function() {return __("transaction::customItem");} },
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

  // amount: total amount to apply discounts
  // afterTax: if true, apply only discounts effective afterTaxes
  //           if false, apply only discounts effective beforeTaxes
  applyDiscounts: function(amount, afterTax) {
    return _.reduce(this.state.discounts, function(total, discount) {
      // check if the two boolean are equal
      if(!(discount.info.isAfterTax ^ afterTax)) {
        return discount.apply(total);
      }
      return total;
    }, amount);
  },

  onCustomerEmailChanged: function(email) {
    this.setState({
      customerEmail: email
    });
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
          cellGenerator: function(item, i) {
            return item.name.toString();
          }
        },
        price: {
          name: __("price"),
          cellGenerator: function(item, i) {
            if(item.id < 0) {
              var link = {
                value: item.price,
                requestChange: function(newValue) {
                  self.debounce(["bill", i], "price", function(newValue) {
                    return parseFloat(newValue) || 0;
                  }, newValue);
                }
              }
              // FIXME::addon removed until table columnWidth are fixed
              return <BSInput type="text" valueLink={link} /*addonAfter="$"*/ />
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

    //TypeAhead options
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

    var billInfo = billUtils.calculateBillTotal(
      this.state.bill,
      this.state.taxInfos,
      this.state.discounts
    );
    this.total = billInfo.total;

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
                placeholder={__("transaction::billEnterCodeOrName")}
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
          <BSCol md={3}>
            <MKBillInfo billInfo={billInfo} taxInfos={this.state.taxInfos} />
            { this.state.bill.length > 0 ?
            <BSButtonGroup>
              { this.state.customerEmail ?
                <MKConfirmationTrigger
                  message={__("areYouSure")}
                  onYes={_.bind(this.saveBill, this, true)}
                >
                  <BSButton bsStyle="success">
                    {__("transaction::saveForLater")}
                  </BSButton>
                </MKConfirmationTrigger>
              : null }
              <MKConfirmationTrigger
                message={__("areYouSure")}
                onYes={_.bind(this.saveBill, this, false)}
              >
                <BSButton  bsStyle="danger">
                  {__("transaction::recordFullPayment")}
                </BSButton>
              </MKConfirmationTrigger>
            </BSButtonGroup>
          : null }
          </BSCol>
          <BSCol md={3}>
            <MKCustomerInformation onEmailChanged={this.onCustomerEmailChanged} />
          </BSCol>
        </BSPanel>
      </BSCol>
    );
  }

});

module.exports = NewBillPage;
