import _ = require("lodash");
import discountTypes = require("./discountTypes");

export interface DiscountInfo {
  apply: (value: number) => number;
  info: Transaction.Discount
}

// amount: total amount to apply discounts
// afterTax: if true, apply only discounts effective afterTaxes
//           if false, apply only discounts effective beforeTaxes
function applyDiscounts(
  subtotal: number,
  discounts: DiscountInfo[],
  afterTax: boolean
) {
  var amountAfterDiscount = _.reduce(discounts, function(total: number, discount) {
    // check if the two boolean are equal
    if(!(+discount.info.isAfterTax ^ +afterTax)) {
      return discount.apply(total);
    }
    return total;
  }, subtotal);

  var discountAmount = amountAfterDiscount - subtotal;

  return {
    total: amountAfterDiscount,
    discountInfo: {
      discount: discountAmount,
      subtotal: subtotal
    }
  };
}

export function calculateBillTotal(
  items: {price: number; quantity: number}[],
  taxInfo: Transaction.TaxInfo[],
  discounts: DiscountInfo[]
) {
  var subtotal = _.reduce(items, function(subtotal: number, item) {
      return subtotal + ((item.price * item.quantity) || 0);
  }, 0);

  var discountBeforeTax = applyDiscounts(subtotal, discounts, false);

  var subtotalAfterTax = discountBeforeTax.total;

  // Apply taxes
  var taxes = _.map(taxInfo, function(tax, i) {
    var taxAmount = subtotalAfterTax * tax.rate;
    subtotalAfterTax += taxAmount;
    return taxAmount;
  });

  var taxAmount = subtotalAfterTax - subtotal;

  var discountAfterTax = applyDiscounts(subtotalAfterTax, discounts, true);

  //if there are not taxes combine discounts
  if(!taxAmount) {
    discountBeforeTax.discountInfo.discount += discountAfterTax.discountInfo.discount;
    discountAfterTax.discountInfo.discount = 0;
  }

  return {
    total: discountAfterTax.total,
    subtotal: discountBeforeTax.total,
    taxes: taxes,
    discountBeforeTax: discountBeforeTax.discountInfo,
    discountAfterTax: discountAfterTax.discountInfo
  };
}
