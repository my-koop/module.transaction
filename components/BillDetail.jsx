var React         = require("react");
var Typeahead     = require("react-typeahead").Typeahead;
var BSCol         = require("react-bootstrap/Col");
var BSRow         = require("react-bootstrap/Row");
var BSPanel       = require("react-bootstrap/Panel");
var BSTable       = require("react-bootstrap/Table");
var BSInput       = require("react-bootstrap/Input");
var BSButton      = require("react-bootstrap/Button");
var BSButtonGroup = require("react-bootstrap/ButtonGroup");
var Router        = require("react-router");

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

var billUtils = require("../lib/common/billUtils");

// Utilities
var __ = require("language").__;
var _ = require("lodash");
var formatMoney = require("language").formatMoney;
var actions = require("actions");
var util = require("util");
var async = require("async");

var BillDetail = React.createClass({
  mixins: [MKDebouncerMixin],
  ////////////////////////////
  /// Life Cycle methods
  propTypes: {
    readOnly: React.PropTypes.bool,
    idBill: React.PropTypes.number,
    billDetails: React.PropTypes.shape({
      items: React.PropTypes.array,
      discounts: React.PropTypes.array,
      customerEmail: React.PropTypes.string,
      taxes: React.PropTypes.array,
      notes: React.PropTypes.string,
      idEvent: React.PropTypes.number
    })
  },

  getDefaultProps: function() {
    return {
      billDetails: {}
    }
  },

  getInitialState: function(props) {
    props = props || this.props;
    var billDetails = props.billDetails || {};
    return {
      // {id: number, name: string, code: number, price:number, quantity: number}
      bill: billDetails.items || [],
      // {isAfterTax: boolean, value: number, type: DiscountType }[]
      discounts: billDetails.discounts || [],
      customerEmail: billDetails.customerEmail || null,
      // mktransaction.TaxInfo[]
      taxInfos: billDetails.taxes || [],
      notes: billDetails.notes || null,
      idEvent: billDetails.idEvent || -1,
      finishedLoading: props.readOnly
    }
  },

  componentDidMount: function () {
    if(this.props.readOnly) {
      return;
    }
    var self = this;
    var items = [];
    var taxes;
    var events;
    var queries = [
      {
        action: actions.inventory.list,
        processResult: function(res) {
          items = res.items;
        }
      },
      {
        action: actions.transaction.taxes.get,
        processResult: function(res) {
          taxes = res;
        }
      },
      {
        action: actions.event.list,
        data: {isClosed: false, startedOnly: true},
        processResult: function(res) {
          events = res.events;
        }
      },
    ];

    async.each(queries, function(query, next) {
      query.action({
        i18nErrors: {},
        data: query.data
      }, function(err, res) {
        if(!err) {
          query.processResult(res);
        }
        next(err);
      });
    }, function(err) {
      if(err) {
        var firstError = err.i18n[0];
        return MKAlertTrigger.showAlert(__(firstError.key, firstError));
      }
      self.setState({
        events: events,
        items: items,
        taxInfos: taxes,
        finishedLoading: true
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
          archiveBill: archiveBill,
          customerEmail: this.state.customerEmail,
          idEvent: this.state.idEvent,
          category: "product",
          items: _.map(this.state.bill, function(item) {
            return {
              id: item.id,
              price: item.price,
              quantity: item.quantity,
              name: item.name
            };
          }),
          discounts: _.map(this.state.discounts, function(discount) {
            return  {
              type: discount.type,
              value: discount.value,
              isAfterTax: discount.isAfterTax
            };
          }),
          notes: this.state.notes
        }
      }, function (err, res) {
        if (err) {
          console.error(err);
          MKAlertTrigger.showAlert(__("errors::error", {context: err.context}));
          return;
        }
        Router.transitionTo(
          "listBills",
          {
            state: archiveBill ? "open" : "closed"
          }
        );
        MKAlertTrigger.showAlert(__("success"));
      }
    );
  },

  updateBill: function() {
    actions.transaction.bill.update({
      i18nErrors: {
        prefix: "transaction::errors",
        keys: ["app"]
      },
      alertErrors: true,
      alertSuccess: true,
      data: {
        id: this.props.idBill,
        notes: this.state.notes
      }
    });
  },

  actionsGenerator: function(item) {
    var self = this;
    if(!this.props.readOnly) {
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
    }
    return [];
  },

  // Need a unique id event for custom item, otherwise it deletes them all onDelete
  customItemId: -1,
  addCustomItem: function() {
    var billItems = this.state.bill;
    billItems.push({
      id: this.customItemId--,
      name: "",
      code: null,
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

  onDiscountChange: function(discounts) {
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
    if(!self.state.finishedLoading) {
      return null;
    }
    var readOnly = this.props.readOnly;

    // TableSorter Config
    var BillTableConfig = {
      defaultOrdering: [ "actions", "code", "name", "price", "quantity"],
      columns: {
        name: {
          name: __("name"),
          cellGenerator: function(item, i) {
            if(item.id < 0 && !readOnly) {
              var link = {
                value: item.name,
                requestChange: function(newName) {
                  var items = self.state.bill;
                  items[i].name = newName;
                  self.setState({
                    bill: items
                  });
                }
              }
              return <BSInput type="text" valueLink={link} />;
            }
            return item.name;
          }
        },
        price: {
          name: __("price"),
          cellGenerator: function(item, i) {
            if(item.id < 0 && !readOnly) {
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
            if(!readOnly) {
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
            return item.quantity;
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

    if(!readOnly) {
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
    }

    var noteLink = {
      value: this.state.notes,
      requestChange: function(newNotes) {
        self.setState({
          notes: newNotes
        });
      }
    };
    var eventLink = {
      value: this.state.idEvent,
      requestChange: function(newId) {
        self.setState({
          idEvent: parseInt(newId)
        });
      }
    };

    var billInfo = billUtils.calculateBillTotal(
      this.state.bill,
      this.state.taxInfos,
      this.state.discounts
    );
    this.total = billInfo.total;

    var showArchive = this.state.bill.length && this.state.customerEmail;
    var showPayNow = this.state.bill.length > 0;
    if(!readOnly) {
      var buttonsConfig = [
        {
          content: __("transaction::saveForLater"),
          warningMessage: __("areYouSure"),
          callback: _.bind(this.saveBill, this, true),
          props: {
            bsStyle: "primary",
            disabled: !showArchive
          }
        },
        {
          content: __("transaction::recordFullPayment"),
          warningMessage: __("areYouSure"),
          callback: _.bind(this.saveBill, this, false),
          props: {
            bsStyle: "success",
            disabled: !showPayNow
          }
        }
      ];
    } else {
      var buttonsConfig = [
        {
          content: __("update"),
          warningMessage: __("areYouSure"),
          callback: this.updateBill,
          props: {
            bsStyle: "primary",
          }
        }
      ];
    }
    var initialDiscounts = this.state.discounts || [];
    return (
      <div>
        <BSPanel header={__("transaction::itemList")}>
          {!readOnly ?
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
          : null}
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
        {!readOnly || (initialDiscounts.length > 0) ?
          <MKCollapsablePanel header={__("transaction::discountHeader")} >
            <MKDiscountTable
              readOnly={readOnly}
              onChange={this.onDiscountChange}
              hasTaxes={!_.isEmpty(this.state.taxInfos)}
              discounts={this.state.discounts}
            />
          </MKCollapsablePanel>
        : null}
        <BSPanel header={__("transaction::billInfo")}>
          <BSCol lg={4} md={6}>
            <MKBillInfo billInfo={billInfo} taxInfos={this.state.taxInfos} />
            <MKListModButtons buttons={buttonsConfig} />
          </BSCol>
          <BSCol lg={4} md={6}>
            {!readOnly ?
              <BSInput
                type="select"
                label={__("transaction::linkToEvent")}
                valueLink={eventLink}
              >
                <option value={-1} key={-1}>{__("none")}</option>
                {_.map(this.state.events, function(event) {
                  return <option value={event.id} key={event.id}>{event.name}</option>
                })}
              </BSInput>
            : [
                <label key={1}>
                  {__("transaction::linkToEvent")}
                </label>,
                <p key={2}>{this.props.billDetails.idEvent ?
                  "#" + this.props.billDetails.idEvent + ": " +
                   this.props.billDetails.eventName
                  : __("none")
                }
                </p>
              ]
            }
            <MKCustomerInformation
              readOnly={readOnly}
              email={this.state.customerEmail}
              onEmailChanged={this.onCustomerEmailChanged}
            />
            <BSInput
              type="textarea"
              className="textarea-resize-vertical"
              label={__("transaction::billNotes")}
              placeholder={__("transaction::billNotesPlaceholder")}
              valueLink={noteLink}
            />
          </BSCol>
        </BSPanel>
      </div>
    );
  }

});

module.exports = BillDetail;
