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
var MySqlHelper = require("./classes/MySqlHelper");
var DatabaseError = utils.errors.DatabaseError;
var ApplicationError = utils.errors.ApplicationError;

var assert = require("assert");
var logger = utils.getLogger(module);

var Module = (function (_super) {
    __extends(Module, _super);
    function Module() {
        _super.apply(this, arguments);
    }
    Module.prototype.init = function () {
        this.db = this.getModuleManager().get("database");
        this.user = this.getModuleManager().get("user");
        controllerList.attachControllers(new utils.ModuleControllersBinder(this));
    };

    Module.prototype.openBill = function (params, callback) {
        var id = params.idBill;
        var self = this;
        this.db.getConnection(function (err, connection, cleanup) {
            if (err) {
                return callback(new DatabaseError(err));
            }

            async.waterfall([
                function findCurrentCustomer(callback) {
                    connection.query("SELECT idUser from bill where idBill = ?", [id], function (err, row) {
                        callback(err && new DatabaseError(err, "Error in findCurrentCustomer"), row);
                    });
                },
                function checkNewCustomer(row, callback) {
                    if (_.isEmpty(row)) {
                        return callback(new ApplicationError(null, { idBill: "Invalid bill id" }));
                    }
                    if (!row[0].idUser) {
                        if (_.isEmpty(params.customerEmail)) {
                            return callback(new ApplicationError(null, { customerEmail: "can't be null" }, "Missing customer email"));
                        }
                        return self.user.__getIdForEmail(connection, {
                            email: params.customerEmail
                        }, callback);
                    }

                    callback(null, row[0].idUser);
                },
                function openBill(idUser, callback) {
                    logger.verbose(idUser);
                    if (!_.isNumber(idUser) || idUser === -1) {
                        return callback(new ApplicationError(null, { customerEmail: "invalid" }, "Invalid customer email"));
                    }
                    connection.query("UPDATE bill SET isClosed=0, idUser=? WHERE idBill=?", [idUser, id], function (err, rows) {
                        callback(err && new DatabaseError(err, "Error in OpenBill"), {
                            success: rows && rows.affectedRows === 1
                        });
                    });
                }
            ], function (err, result) {
                cleanup();
                callback(err, result);
            });
        });
    };

    Module.prototype.closeBill = function (params, callback) {
        var id = params.idBill;
        this.db.getConnection(function (err, connection, cleanup) {
            if (err) {
                return callback(new DatabaseError(err));
            }

            async.waterfall([
                function (callback) {
                    connection.query("SELECT total=sum(amount) AS canClose FROM bill\
              LEFT JOIN bill_transaction\
              ON bill.idBill=bill_transaction.idBill\
              LEFT JOIN transaction\
              ON bill_transaction.idTransaction=transaction.idTransaction\
              WHERE bill.idBill=? and isClosed=0\
              GROUP BY bill.idBill", [id], function (err, rows) {
                        callback(err && new DatabaseError(err), rows && rows.length === 1 && rows[0].canClose);
                    });
                },
                function (canClose, callback) {
                    if (!canClose) {
                        return callback(new ApplicationError(null, { reason: "can't close" }));
                    }
                    connection.query("UPDATE bill SET isClosed=1 WHERE idBill=?", [id], function (err, rows) {
                        callback(err && new DatabaseError(err), rows && rows.affectedRows === 1);
                    });
                }
            ], function (err, success) {
                cleanup();
                callback(err, {
                    success: success
                });
            });
        });
    };

    Module.prototype.listBills = function (params, callback) {
        var selectIsClosed = params.show === "open" ? 0 : 1;
        this.db.getConnection(function (err, connection, cleanup) {
            if (err) {
                return callback(new DatabaseError(err));
            }

            async.waterfall([
                function (callback) {
                    connection.query("SELECT bill.idBill, sum(amount) AS paid, createdDate, total, idUser FROM bill\
                LEFT JOIN bill_transaction \
                ON bill.idBill=bill_transaction.idBill \
                LEFT JOIN transaction \
                ON bill_transaction.idTransaction=transaction.idTransaction \
                WHERE isClosed = ? \
                GROUP BY bill.idBill", [selectIsClosed], function (err, rows) {
                        logger.silly("listBills query result", rows);
                        var result = _.map(rows, function (row) {
                            return {
                                idBill: row.idBill,
                                idUser: row.idUser,
                                createdDate: row.createdDate,
                                total: row.total,
                                paid: row.paid
                            };
                        });
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
        var self = this;
        var idBill = -1;
        var idUser = null;

        // can't archive a bill without a customer email
        assert(!params.archiveBill || params.customerEmail);

        logger.debug("Save new bill", params);
        var mysqlHelper = new MySqlHelper();

        async.waterfall([
            function (callback) {
                logger.debug("checking if email is valid");
                if (params.customerEmail) {
                    return self.user.getIdForEmail({
                        email: params.customerEmail
                    }, callback);
                }

                // no email is considered valid if we don't archive the bill
                callback(null, null);
            },
            function (id, callback) {
                idUser = ~id ? id : null;
                logger.debug("user id is ", idUser);

                // an id of -1 is an error, but null is acceptable
                callback(!(~id) && new ApplicationError(null, { customerEmail: ["invalid"] }));
            },
            function (callback) {
                logger.debug("getting connection");
                self.db.getConnection(function (err, connection, cleanup) {
                    if (err) {
                        return callback(new DatabaseError(err));
                    }
                    mysqlHelper.setConnection(cleanup, connection);
                    callback(null);
                });
            },
            mysqlHelper.beginTransaction,
            function (callback) {
                logger.debug("Create new bill id");

                // Create bill
                mysqlHelper.connection().query("INSERT INTO bill SET createdDate = now(), total = ?, idUser = ?, isClosed = ?", [params.total, idUser, !params.archiveBill], function (err, res) {
                    callback(err && new DatabaseError(err), res && res.insertId);
                });
            },
            function (id, callback) {
                idBill = id;
                logger.debug("Link items to idBill: %d", idBill);

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
                mysqlHelper.connection().query("INSERT INTO bill_item (idBill, idItem, quantity, price) VALUES ?", [
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
                logger.debug("Link discounts to idBill: %d", idBill);

                // Add list of discount in the bill
                var billDiscounts = _.map(params.discounts, function (discount) {
                    return [
                        idBill,
                        DiscountTypes.Types[discount.type],
                        discount.value,
                        discount.isAfterTax
                    ];
                });
                mysqlHelper.connection().query("INSERT INTO bill_discount (idBill, type, amount, isAfterTax) VALUES ?", [
                    billDiscounts
                ], function (err, res) {
                    callback(err && new DatabaseError(err));
                });
            },
            function (callback) {
                // must create a transaction with the full amount
                if (!params.archiveBill) {
                    logger.debug("Create a transaction with full amount for idBill: %d", idBill);
                    mysqlHelper.connection().query("INSERT INTO transaction SET amount=?", [params.total], function (err, res) {
                        callback(err && new DatabaseError(err), res && res.insertId);
                    });
                    return;
                }
                callback(null, 0);
            },
            function (idTransaction, callback) {
                if (!params.archiveBill) {
                    logger.debug("Link transaction [%d] to bill [%d]", idTransaction, idBill);
                    mysqlHelper.connection().query("INSERT INTO bill_transaction SET idBill = ?, idTransaction = ?", [idBill, idTransaction], function (err, res) {
                        callback(err && new DatabaseError(err));
                    });
                    return;
                }
                callback(null);
            },
            mysqlHelper.commitTransaction
        ], _.partialRight(mysqlHelper.cleanup, function (err) {
            callback(err, { idBill: idBill });
        }));
    };
    return Module;
})(utils.BaseModule);

module.exports = Module;
