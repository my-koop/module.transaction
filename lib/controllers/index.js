var endPoints = require("../../metadata/endpoints");

var validation = require("../validation/index");

var assert = require("assert");
assert.equal(endPoints.transaction.bill.new.method, "post");

function attachControllers(binder) {
    binder.attach({
        endPoint: endPoints.transaction.bill.new,
        validation: validation.newBill
    }, binder.makeSimpleController("saveNewBill", function (req) {
        // this is true because of validation and assumes the request stays a post
        return req.body;
    }));
}
exports.attachControllers = attachControllers;
