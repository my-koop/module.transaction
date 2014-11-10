import endPoints = require("../../metadata/endpoints");
import utils = require("mykoop-utils");
import Express = require("express");

import validation = require("../validation/index");

import assert = require("assert");
assert.equal(endPoints.transaction.bill.new.method, "post");

export function attachControllers(
  binder: utils.ModuleControllersBinder<mktransaction.Module>
) {
  binder.attach(
    {
      endPoint: endPoints.transaction.bill.new,
      validation: validation.newBill
    },
    binder.makeSimpleController("saveNewBill", function(req: Express.Request) {
      // this is true because of validation and assumes the request stays a post
      return req.body;
    })
  );
}
