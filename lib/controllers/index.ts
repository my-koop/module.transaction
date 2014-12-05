import endPoints = require("../../metadata/endpoints");
import utils = require("mykoop-utils");
import Express = require("express");

import validation = require("../validation/index");

import assert = require("assert");
assert.equal(endPoints.transaction.bill.new.method, "post");
assert.equal(endPoints.transaction.bill.list.method, "get");

export function attachControllers(
  binder: utils.ModuleControllersBinder<mktransaction.Module>
) {
  var transaction = binder.moduleInstance;
  binder.attach(
    {
      endPoint: endPoints.transaction.bill.new,
      validation: validation.newBill
    },
    binder.makeSimpleController(transaction.saveNewBill,
      function(req: Express.Request) {
        // this is true because of validation and assumes the request stays a post
        return req.body;
      }
    )
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.list,
      validation: validation.listBill
    },
    binder.makeSimpleController("listBills", function(req: Express.Request) {
      // Assume the request is a get
      return req.query;
    })
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.get
    },
    binder.makeSimpleController<Transaction.GetBill.Params>(transaction.getBill,
      function(req: Express.Request) {
        return {
          id: parseInt(req.param("id", 0))
        };
      }
    )
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.close
    },
    binder.makeSimpleController("closeBill", function(req: Express.Request) {
      return {
        idBill: req.param("id"),
      }
    })
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.open
    },
    binder.makeSimpleController("openBill", function(req: Express.Request) {
      return {
        idBill: req.param("id"),
        customerEmail: req.param("email")
      }
    })
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.addTransaction
    },
    binder.makeSimpleController("addBillTransaction", function(req: Express.Request) {
      return {
        idBill: req.param("id"),
        amount: req.param("amount")
      }
    })
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.taxes.get
    },
    binder.makeSimpleController("getTaxInformation")
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.delete
    },
    binder.makeSimpleController<Transaction.DeleteBill.Params>(
      transaction.deleteBill,
      function(req) {
        return {
          id: parseInt(req.param("id", -1))
        };
      }
    )
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.report
    },
    binder.makeSimpleController("getFinancialReport", function(req: Express.Request) {
      return {
        fromDate: req.param("fromDate"),
        toDate: req.param("toDate")
      }
    })
  );


}
