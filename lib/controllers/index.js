var endPoints = require("../../metadata/endpoints");

var validation = require("../validation/index");

var assert = require("assert");
assert.equal(endPoints.transaction.bill.new.method, "post");
assert.equal(endPoints.transaction.bill.list.method, "get");

function attachControllers(binder) {
    binder.attach({
        endPoint: endPoints.transaction.bill.new,
        validation: validation.newBill
    }, binder.makeSimpleController("saveNewBill", function (req) {
        // this is true because of validation and assumes the request stays a post
        return req.body;
    }));

    binder.attach({
        endPoint: endPoints.transaction.bill.list,
        validation: validation.listBill
    }, binder.makeSimpleController("listBills", function (req) {
        // Assume the request is a get
        return req.query;
    }));

    binder.attach({
        endPoint: endPoints.transaction.bill.close
    }, binder.makeSimpleController("closeBill", function (req) {
        return {
            idBill: req.param("id")
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
}
exports.attachControllers = attachControllers;
