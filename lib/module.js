var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var utils = require("mykoop-utils");
var controllerList = require("./controllers/index");
var async = require("async");
var _ = require("lodash");
var DiscountTypes = require("./common_modules/discountTypes");
var DatabaseError = utils.errors.DatabaseError;

var Module = (function (_super) {
    __extends(Module, _super);
    function Module() {
        _super.apply(this, arguments);
    }
    Module.prototype.init = function () {
        this.db = this.getModuleManager().get("database");
        controllerList.attachControllers(new utils.ModuleControllersBinder(this));
    };

    Module.prototype.listBills = function (params, callback) {
        this.db.getConnection(function (err, connection, cleanup) {
            if (err) {
                return callback(new DatabaseError(err));
            }

            async.waterfall([
                function (callback) {
                    connection.query("SELECT * FROM bill", function (err, result) {
                        callback(err && new DatabaseError(err), result);
                    });
                }
            ], function (err, result) {
                cleanup();
                callback(err, result);
            });
        });
    };

    Module.prototype.saveNewBill = function (params, callback) {
        var idBill = -1;

        this.db.getConnection(function (err, connection, cleanup) {
            if (err) {
                return callback(new DatabaseError(err));
            }
            async.waterfall([
                function (callback) {
                    connection.beginTransaction(function (err) {
                        callback(err && new DatabaseError(err));
                    });
                },
                function (callback) {
                    // Create bill
                    connection.query("INSERT INTO bill SET createdDate=now()", function (err, res) {
                        callback(err && new DatabaseError(err), res && res.insertId);
                    });
                },
                function (id, callback) {
                    idBill = id;

                    // Add list of item in the bill
                    var billItems = _.map(params.items, function (item) {
                        var idItem = item.id >= 0 ? item.id : null;
                        return [
                            idBill,
                            idItem,
                            item.quantity,
                            item.price
                        ];
                    });
                    connection.query("INSERT INTO bill_item (idBill, idItem, quantity, price) VALUES ?", [
                        billItems
                    ], function (err, res) {
                        callback(err && new DatabaseError(err));
                    });
                },
                function (callback) {
                    if (_.isEmpty(params.discounts)) {
                        // no discounts to add
                        return callback(null);
                    }

                    // Add list of discount in the bill
                    var billDiscounts = _.map(params.discounts, function (discount) {
                        return [
                            idBill,
                            DiscountTypes.Types[discount.type],
                            discount.value,
                            discount.isAfterTax
                        ];
                    });
                    connection.query("INSERT INTO bill_discount (idBill, type, amount, isAfterTax) VALUES ?", [
                        billDiscounts
                    ], function (err, res) {
                        callback(err && new DatabaseError(err));
                    });
                },
                function (callback) {
                    // No errors yet, commit all that
                    connection.commit(function (err) {
                        callback(err && new DatabaseError(err));
                    });
                }
            ], function (err) {
                if (err) {
                    connection.rollback(function () {
                        cleanup();
                        callback(err);
                    });
                    return;
                }

                cleanup();
                callback(null, { idBill: idBill });
            });
        });
    };
    return Module;
})(utils.BaseModule);

module.exports = Module;
