var endPoints = require("../../metadata/endpoints");
var validation = require("../validation/index");
var assert = require("assert");
assert.equal(endPoints.transaction.bill.new.method, "post");
assert.equal(endPoints.transaction.bill.list.method, "get");
function attachControllers(binder) {
    var transaction = binder.moduleInstance;
    binder.attach({
        endPoint: endPoints.transaction.bill.new,
        validation: validation.newBill
    }, binder.makeSimpleController(transaction.saveNewBill, function (req) {
        // this is true because of validation and assumes the request stays a post
        return req.body;
    }));
    binder.attach({
        endPoint: endPoints.transaction.bill.update,
    }, binder.makeSimpleController(transaction.updateBill, function (req) {
        return {
            id: parseInt(req.param("id")),
            notes: req.param("notes")
        };
    }));
    binder.attach({
        endPoint: endPoints.transaction.bill.list,
        validation: validation.listBill
    }, binder.makeSimpleController("listBills", function (req) {
        // Assume the request is a get
        return req.query;
    }));
    binder.attach({
        endPoint: endPoints.transaction.bill.get
    }, binder.makeSimpleController(transaction.getBill, function (req) {
        return {
            id: parseInt(req.param("id", 0))
        };
    }));
    binder.attach({
        endPoint: endPoints.transaction.bill.details
    }, binder.makeSimpleController(transaction.getBillDetails, function (req) {
        return {
            id: parseInt(req.param("id", 0))
        };
    }));
    binder.attach({
        endPoint: endPoints.transaction.bill.close
    }, binder.makeSimpleController("closeBill", function (req) {
        return {
            idBill: req.param("id"),
        };
    }));
    binder.attach({
        endPoint: endPoints.transaction.bill.open
    }, binder.makeSimpleController("openBill", function (req) {
        return {
            idBill: req.param("id"),
            customerEmail: req.param("email")
        };
    }));
    binder.attach({
        endPoint: endPoints.transaction.bill.addTransaction
    }, binder.makeSimpleController("addBillTransaction", function (req) {
        return {
            idBill: req.param("id"),
            amount: req.param("amount")
        };
    }));
    binder.attach({
        endPoint: endPoints.transaction.taxes.get
    }, binder.makeSimpleController(transaction.getTaxInformation));
    binder.attach({
        endPoint: endPoints.transaction.bill.delete
    }, binder.makeSimpleController(transaction.deleteBill, function (req) {
        return {
            id: parseInt(req.param("id", -1))
        };
    }));
    binder.attach({
        endPoint: endPoints.transaction.report
    }, binder.makeSimpleController("getFinancialReport", function (req) {
        return {
            fromDate: req.param("fromDate"),
            toDate: req.param("toDate")
        };
    }));
    binder.attach({
        endPoint: endPoints.transaction.bill.history
    }, binder.makeSimpleController(transaction.getBillHistory, function (req) {
        return {
            id: parseInt(req.param("id", -1))
        };
    }));
}
exports.attachControllers = attachControllers;
