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
      validation: validation.newBill,
      permissions: {
        invoices: {
          create: true
        }
      }
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
      endPoint: endPoints.transaction.bill.update,
      permissions: {
        invoices: {
          update: true
        }
      }
    },
    binder.makeSimpleController<mktransaction.UpdateBill.Params>(
      transaction.updateBill,
      function(req: Express.Request) {
        return {
          id: parseInt(req.param("id")),
          notes: req.param("notes"),
          idEvent: parseInt(req.param("idEvent")) || null
        }
      }
    )
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.list,
      validation: validation.listBill,
      permissions: {
        invoices: {
          read: true
        }
      }
    },
    binder.makeSimpleController("listBills", function(req: Express.Request) {
      // Assume the request is a get
      return req.query;
    })
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.get,
      permissions: {
        invoices: {
          read: true
        }
      }
    },
    binder.makeSimpleController<mktransaction.GetBill.Params>(
      transaction.getBill,
      function(req: Express.Request) {
        return {
          id: parseInt(req.param("id", 0))
        };
      }
    )
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.details,
      permissions: {
        invoices: {
          read: true
        }
      }
    },
    binder.makeSimpleController<mktransaction.GetBillDetails.Params>(
      transaction.getBillDetails,
      function(req: Express.Request) {
        return {
          id: parseInt(req.param("id", 0))
        };
      }
    )
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.close,
      permissions: {
        invoices: {
          close: true
        }
      }
    },
    binder.makeSimpleController("closeBill", function(req: Express.Request) {
      return {
        idBill: req.param("id"),
      }
    })
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.open,
      permissions: {
        invoices: {
          reopen: true
        }
      }
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
      endPoint: endPoints.transaction.bill.addTransaction,
      permissions: {
        invoices: {
          create: true
        }
      }
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
      endPoint: endPoints.transaction.taxes.get,
      permissions: {
        invoices: {
          create: true
        }
      }
    },
    binder.makeSimpleController(transaction.getTaxInformation)
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.delete,
      permissions: {
        invoices: {
          delete: true
        }
      }
    },
    binder.makeSimpleController<mktransaction.DeleteBill.Params>(
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
      endPoint: endPoints.transaction.report,
      permissions: {
        invoices: {
          reports: true
        }
      }
    },
    binder.makeSimpleController("getFinancialReport", function(req: Express.Request) {
      return {
        fromDate: new Date(req.param("fromDate")),
        toDate: new Date(req.param("toDate"))
      }
    })
  );

  binder.attach(
    {
      endPoint: endPoints.transaction.bill.history,
      permissions: {
        invoices: {
          read: true
        }
      }
    },
    binder.makeSimpleController(transaction.getBillHistory, function(req: Express.Request) {
      return {
        id: parseInt(req.param("id", -1))
      }
    })
  );

  binder.attach(
    {
      endPoint: endPoints.user.customerInfo,
      permissions: {
        users: {
          view: true
        }
      }
    },
    binder.makeSimpleController<mktransaction.GetCustomerInformations.Params>(
      transaction.getCustomerInformations,
      function(req) {
        return {
          email: req.param("email")
        }
      }
    )
  );
}
