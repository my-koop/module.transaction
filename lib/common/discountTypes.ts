
module DiscountTypes {
  export enum Types {
    percentage,
    fixed,
    COUNT
  }
  export var DiscountInfo = [
    {
      type: Types.percentage,
      name: Types[Types.percentage],
      symbol: "%",
      applyDiscount: function(discountValue, amount) {
        discountValue = Number(discountValue) || 0;
        return amount * ((100 - discountValue) / 100);
      }
    },
    {
      type: Types.fixed,
      name: Types[Types.fixed],
      symbol: "$",
      applyDiscount: function(discountValue, amount) {
        discountValue = Number(discountValue) || 0;
        return amount - discountValue;
      }
    }
  ];
}

export = DiscountTypes;
