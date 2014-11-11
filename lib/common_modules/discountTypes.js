var DiscountTypes;
(function (DiscountTypes) {
    (function (Types) {
        Types[Types["percentage"] = 0] = "percentage";
        Types[Types["fixed"] = 1] = "fixed";
        Types[Types["COUNT"] = 2] = "COUNT";
    })(DiscountTypes.Types || (DiscountTypes.Types = {}));
    var Types = DiscountTypes.Types;
    DiscountTypes.DiscountInfo = [
        {
            type: 0 /* percentage */,
            name: Types[0 /* percentage */],
            symbol: "%",
            applyDiscount: function (discountValue, amount) {
                discountValue = Number(discountValue) || 0;
                return amount * ((100 - discountValue) / 100);
            }
        },
        {
            type: 1 /* fixed */,
            name: Types[1 /* fixed */],
            symbol: "$",
            applyDiscount: function (discountValue, amount) {
                discountValue = Number(discountValue) || 0;
                return amount - discountValue;
            }
        }
    ];
})(DiscountTypes || (DiscountTypes = {}));

module.exports = DiscountTypes;
