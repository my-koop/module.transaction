// see http://validatejs.org/ for documentation on how to do contraints
import common = require("mykoop-utils/common");
var validate = common.validation;
import DiscountTypes = require("../common_modules/discountTypes");
var _ = require("lodash");

export function newBill(obj) {
  var itemConstraint = {
    id: {
      presence: true
    },
    price: {
      presence: true,
      numericality: true
    },
    quantity: {
      presence: true,
      numericality: {
        onlyInteger: true
      }
    }
  };

  var discountConstraint = {
    type: {
      presence: true,
      numericality: {
        greaterThanOrEqualTo: 0,
        lessThan: DiscountTypes.Types.COUNT
      }
    },
    value: {
      presence: true,
      numericality: true
    }
  }
  var newBillConstraint = {
    items: {
      presence: true,
      length: {
        minimum: 1
      }
    },
    discounts: {
    }
  }
  var newBillErrors = validate(obj, newBillConstraint);
  if(newBillErrors) {
    return newBillErrors;
  }

  var errors = _(obj.items).map(function(item) {
    return validate(item, itemConstraint);
  }).concat(_.map(obj.discounts, function(discount) {
    return validate(discount, discountConstraint);
  })).filter(function(errors) {
    return !_.isEmpty(errors);
  }).value();
  return _.isEmpty(errors) ? undefined : errors;
}
