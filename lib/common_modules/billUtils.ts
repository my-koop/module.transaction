import _ = require("lodash");
import discountTypes = require("./discountTypes");

// amount: total amount to apply discounts
// afterTax: if true, apply only discounts effective afterTaxes
//           if false, apply only discounts effective beforeTaxes
function applyDiscounts(
  amount: number,
  discounts: Transaction.Discount[],
  afterTax: boolean
) {
  return _.reduce(discounts, function(total, discount: Transaction.Discount) {
    // allow only 0 and 1
    var type = (discount.type >>> 0) < discountTypes.Types.COUNT ?
      discount.type
      : discountTypes.Types.percentage;

    // check if the two boolean are equal
    if(!(+discount.isAfterTax ^ +afterTax)) {
      return discountTypes.DiscountInfo[type].applyDiscount(discount.value, total);
    }
    return total;
  }, amount);
}

export function calculateBillTotal(
  items: {price: number; quantity: number}[],
  taxInfo: Transaction.TaxInfo[],
  discounts: Transaction.Discount[]
) {
  var subtotal = _.reduce(items, function(subtotal: number, item) {
      return subtotal + ((item.price * item.quantity) || 0);
  }, 0);

  var subtotalAfterDiscount = applyDiscounts(subtotal, discounts, false);
  var discountBeforeTax = subtotal - subtotalAfterDiscount;

  var total = subtotalAfterDiscount;
  // Apply taxes
  var taxes = _.map(taxInfo, function(tax, i) {
    var taxAmount = total * tax.rate;
    total += taxAmount;
    return taxAmount;
  });

  var totalAfterDiscount = applyDiscounts(total, discounts, true);
  var discountAfterTax = total - totalAfterDiscount;
  total = totalAfterDiscount;
  return {
    total: total,
    subtotal: subtotal,
    taxes: taxes,
    discountBeforeTax: discountBeforeTax && {
      discount: discountBeforeTax,

    },
    discountAfterTax: discountAfterTax
  };
}
