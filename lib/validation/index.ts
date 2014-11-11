// see http://validatejs.org/ for documentation on how to do contraints
import common = require("mykoop-utils/common");
var validate = common.validation;
import DiscountTypes = require("../common_modules/discountTypes");
var _ = require("lodash");

export function newBill(obj) {

  var itemConstraint = {
    id: {presence: true},
    price: {
      presence: true,
      numericality: true
    },
    quantity: {
      presence: true,
      numericality: {onlyInteger: true}
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
  };

  var newBillConstraint = {
    total: {numericality: true},
    customerEmail: {email: true},
    archiveBill: {},
    items: {
      presence: true,
      length: {minimum: 1}
    },
    discounts: {}
  };

  var newBillErrors = validate(obj, newBillConstraint);
  if(newBillErrors) {
    return newBillErrors;
  }
  if(!obj.customerEmail && obj.archiveBill) {
    return {
      customerEmail: ["can't archive a bill without a customer email"]
    };
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

export function listBill(obj) {
  var constraint = {
    show: {
      presence: true,
      inclusion: ["open", "closed"]
    }
  };
  return validate(obj, constraint);
}
