var _ = require("lodash");

// amount: total amount to apply discounts
// afterTax: if true, apply only discounts effective afterTaxes
//           if false, apply only discounts effective beforeTaxes
function applyDiscounts(subtotal, discounts, afterTax) {
    var amountAfterDiscount = _.reduce(discounts, function (total, discount) {
        // check if the two boolean are equal
        if (!(+discount.info.isAfterTax ^ +afterTax)) {
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

function calculateBillTotal(items, taxInfo, discounts) {
    var subtotal = _.reduce(items, function (subtotal, item) {
        return subtotal + ((item.price * item.quantity) || 0);
    }, 0);

    var discountBeforeTax = applyDiscounts(subtotal, discounts, false);

    var subtotalAfterTax = discountBeforeTax.total;

    // Apply taxes
    var taxes = _.map(taxInfo, function (tax, i) {
        var taxAmount = subtotalAfterTax * tax.rate;
        subtotalAfterTax += taxAmount;
        return taxAmount;
    });

    var taxAmount = subtotalAfterTax - discountBeforeTax.total;

    var discountAfterTax = applyDiscounts(subtotalAfterTax, discounts, true);

    return {
        total: discountAfterTax.total,
        subtotal: discountBeforeTax.total,
        taxes: taxes,
        discountBeforeTax: discountBeforeTax.discountInfo,
        discountAfterTax: discountAfterTax.discountInfo
    };
}
exports.calculateBillTotal = calculateBillTotal;
