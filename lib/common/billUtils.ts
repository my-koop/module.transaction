import _ = require("lodash");
import discountTypes = require("./discountTypes");
var discountInfo = discountTypes.DiscountInfo;
import util = require("util");

export interface DiscountInfo {
  apply: (value: number) => number;
  info: mktransaction.Discount
}

export function convertDiscounts(discounts: mktransaction.Discount[]) {
  return _.map(discounts, function(discount) {
    var func = discountInfo[discount.type]
      .applyDiscount.bind(null, discount.value);
    return {
      info: discount,
      apply: func
    };
  });
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
    // check if the two booleans are equal
    if(discount.info.isAfterTax === afterTax) {
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
  taxInfo: mktransaction.TaxInfo[],
  discounts: mktransaction.Discount[]
) {
  var subtotal = _.reduce(items, function(subtotal: number, item) {
      return subtotal + ((item.price * item.quantity) || 0);
  }, 0);
  var discountsInfo = convertDiscounts(discounts);
  var discountBeforeTax = applyDiscounts(subtotal, discountsInfo, false);

  var subtotalAfterTax = discountBeforeTax.total;

  // Apply taxes
  var totalTax = 0;
  var taxes = _.map(taxInfo, function(tax, i) {
    var taxAmount = subtotalAfterTax * tax.rate/100;
    totalTax += taxAmount;
    return taxAmount;
  });
  subtotalAfterTax += totalTax;
  var discountAfterTax = applyDiscounts(subtotalAfterTax, discountsInfo, true);

  return {
    total: discountAfterTax.total,
    subtotal: discountBeforeTax.total,
    taxes: taxes,
    discountBeforeTax: discountBeforeTax.discountInfo,
    discountAfterTax: discountAfterTax.discountInfo
  };
}

export function orderBillInfo(billInfo, taxInfos, __) {
  var infos = [];
  if(billInfo.discountBeforeTax.discount) {
    infos.push({
      text: __("transaction::subtotal"),
      amount: billInfo.discountBeforeTax.subtotal
    });
    infos.push({
      text: __("transaction::discounts"),
      amount: billInfo.discountBeforeTax.discount
    });
  }
  infos.push({
    text: __("transaction::subtotal"),
    amount: billInfo.subtotal,
    isBold: true
  });

  infos = infos.concat(_.map(billInfo.taxes, function(taxAmount, i) {
    var info = taxInfos[i];
    var taxText = util.format("%s (%s\%)",
      info.name,
      (info.rate).toFixed(3)
    );
    return {
      text: taxText,
      amount: taxAmount
    };
  }));

  if(billInfo.discountAfterTax.discount) {
    infos.push({
      text: __("transaction::subtotal"),
      amount: billInfo.discountAfterTax.subtotal
    });
    infos.push({
      text: __("transaction::discounts"),
      amount: billInfo.discountAfterTax.discount
    });
  }
  infos.push({
    text: __("transaction::total"),
    amount: billInfo.total,
    isBold: true
  });

  return infos;
}
