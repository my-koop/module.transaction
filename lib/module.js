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
var MySqlHelper = utils.MySqlHelper;
var DatabaseError = utils.errors.DatabaseError;
var ApplicationError = utils.errors.ApplicationError;
var ResourceNotFoundError = ApplicationError.ResourceNotFoundError;
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
    Module.prototype.addBillTransaction = function (params, callback) {
        var self = this;
        this.db.getConnection(function (err, connection, cleanup) {
            if (err) {
                return callback(new DatabaseError(err));
            }
            var helper = new MySqlHelper();
            helper.setConnection(cleanup, connection);
            async.waterfall([
                helper.beginTransaction,
                function (callback) {
                    self.__addBillTransaction(helper.connection(), {
                        idBill: params.idBill,
                        amount: params.amount
                    }, callback);
                },
                function (result, callback) {
                    helper.commitTransaction(function (err) {
                        callback(err);
                    });
                }
            ], function (err) {
                helper.cleanup(err, function () {
                    callback(err);
                });
            });
        });
    };
    Module.prototype.getTaxInformation = function (params, callback) {
        this.db.getConnection(function (err, connection, cleanup) {
            if (err) {
                return callback(new DatabaseError(err));
            }
            async.waterfall([
                function (callback) {
                    connection.query("SELECT rate, localizeKey FROM taxes", function (err, rows) {
                        callback(err && new DatabaseError(err), rows);
                    });
                },
                function (rows, callback) {
                    var taxInfos = _.map(rows, function (row) {
                        return {
                            rate: row.rate,
                            localizeKey: row.localizeKey
                        };
                    });
                    callback(null, taxInfos);
                }
            ], function (err, taxInfos) {
                cleanup();
                callback(err, taxInfos);
            });
        });
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
                    connection.query("SELECT idUser from bill where idBill = ? AND closedDate IS NOT NULL", [id], function (err, row) {
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
                    connection.query("UPDATE bill SET closedDate=NULL, idUser=? WHERE idBill=?", [idUser, id], function (err, rows) {
                        callback(err && new DatabaseError(err, "Error in OpenBill"), rows && rows.affectedRows === 1);
                    });
                }
            ], function (err, result) {
                cleanup();
                callback(err || (!result && new ApplicationError(null, {})));
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
              WHERE bill.idBill=? and closedDate IS NULL\
              GROUP BY bill.idBill", [id], function (err, rows) {
                        callback(err && new DatabaseError(err), rows && rows.length === 1 && rows[0].canClose);
                    });
                },
                function (canClose, callback) {
                    if (!canClose) {
                        return callback(new ApplicationError(null, { reason: "can't close" }));
                    }
                    connection.query("UPDATE bill SET closedDate=NOW() WHERE idBill=?", [id], function (err, rows) {
                        callback(err && new DatabaseError(err), rows && rows.affectedRows === 1);
                    });
                }
            ], function (err, success) {
                cleanup();
                callback(err || (!success && new ApplicationError(null, {})));
            });
        });
    };
    Module.prototype.makeSelectBillQuery = function (whereClause) {
        return "SELECT \
      bill.idBill,\
      coalesce(sum(amount),0) AS paid,\
      createdDate,\
      closedDate,\
      total,\
      idUser,\
      coalesce(count(bill_transaction.idTransaction),0) AS transactionCount\
    FROM bill\
    LEFT JOIN bill_transaction\
      ON bill.idBill=bill_transaction.idBill \
    LEFT JOIN transaction \
      ON bill_transaction.idTransaction=transaction.idTransaction " + whereClause + " GROUP BY bill.idBill";
    };
    Module.prototype.getBill = function (params, callback) {
        this.callWithConnection(this.__getBill, params, callback);
    };
    Module.prototype.__getBill = function (connection, params, callback) {
        connection.query(this.makeSelectBillQuery("WHERE bill.idBill=?"), [params.id], function (err, result) {
            if (err) {
                return callback(new DatabaseError(err));
            }
            if (result.length === 0) {
                return callback(new ApplicationError(null, { id: "notFound" }));
            }
            var row = result[0];
            var bill = {
                closedDate: row.closedDate,
                createdDate: row.createdDate,
                idBill: params.id,
                idUser: row.idUser,
                paid: row.paid,
                total: row.total,
                transactionCount: row.transactionCount
            };
            callback(null, bill);
        });
    };
    Module.prototype.listBills = function (params, callback) {
        var self = this;
        var selectIsClosed = params.show === "open" ? "" : "NOT";
        this.db.getConnection(function (err, connection, cleanup) {
            if (err) {
                return callback(new DatabaseError(err));
            }
            async.waterfall([
                function (callback) {
                    connection.query(self.makeSelectBillQuery("WHERE closedDate IS " + selectIsClosed + " NULL"), [selectIsClosed], function (err, rows) {
                        logger.silly("listBills query result", rows);
                        var result = _.map(rows, function (row) {
                            return {
                                idBill: row.idBill,
                                idUser: row.idUser,
                                createdDate: row.createdDate,
                                closedDate: row.closedDate,
                                total: row.total,
                                paid: row.paid,
                                transactionCount: row.transactionCount
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
        this.callWithConnection(this.__saveNewBill, params, callback);
    };
    Module.prototype.__saveNewBill = function (connection, params, callback) {
        var self = this;
        var idBill = -1;
        var idUser = null;
        // can't archive a bill without a customer email
        assert(!params.archiveBill || params.customerEmail);
        logger.debug("Save new bill", params);
        var mysqlHelper = new MySqlHelper();
        mysqlHelper.setConnection(_.noop, connection);
        async.waterfall([
            function (callback) {
                logger.debug("checking if email is valid");
                if (params.customerEmail) {
                    return self.user.__getIdForEmail(connection, {
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
            mysqlHelper.beginTransaction,
            function (callback) {
                logger.debug("Create new bill id");
                var total = params.total;
                var closedDate = params.archiveBill ? "NULL" : "NOW()";
                var idEvent = _.isNumber(params.idEvent) && params.idEvent >= 0 ? params.idEvent : null;
                // Create bill
                connection.query("INSERT INTO bill SET \
          createdDate = NOW(), \
          total = ?, \
          notes = ?, \
          idUser = ?, \
          idEvent = ?, \
          closedDate = " + closedDate, [params.total, params.notes, idUser, idEvent], function (err, res) {
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
                        item.price,
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
                connection.query("INSERT INTO bill_discount (idBill, type, amount, isAfterTax) VALUES ?", [
                    billDiscounts
                ], function (err, res) {
                    callback(err && new DatabaseError(err));
                });
            },
            function (callback) {
                // must create a transaction with the full amount
                if (!params.archiveBill) {
                    self.__addBillTransaction(connection, {
                        idBill: idBill,
                        amount: params.total
                    }, function (err) {
                        callback(err);
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
    Module.prototype.__addTransaction = function (connection, params, callback) {
        logger.debug("Create a transaction with amount %d", params.amount);
        connection.query("INSERT INTO transaction SET amount=?", [params.amount], function (err, res) {
            var result = {
                idTransaction: res && res.insertId
            };
            callback(err && new DatabaseError(err), result);
        });
    };
    Module.prototype.__addBillTransaction = function (connection, params, callback) {
        this.__addTransaction(connection, { amount: params.amount }, function (err, res) {
            if (err) {
                return callback(err);
            }
            logger.debug("Link transaction [%d] to bill [%d]", res.idTransaction, params.idBill);
            connection.query("INSERT INTO bill_transaction SET idBill = ?, idTransaction = ?", [params.idBill, res.idTransaction], function (err, row) {
                var success = row && row.affectedRows === 1;
                callback((err && new DatabaseError(err, "Error inserting into bill_transaction")) || (!success && new ApplicationError(null, {}, "Error inserting into bill_transaction")), res);
            });
        });
    };
    Module.prototype.deleteBill = function (params, callback) {
        this.callWithConnection(this.__deleteBill, params, callback);
    };
    Module.prototype.__deleteBill = function (connection, params, callback) {
        var self = this;
        async.waterfall([
            function (next) {
                self.__getBill(connection, params, next);
            },
            function (result, next) {
                if (result.transactionCount) {
                    return next(new ApplicationError(null, { transactionCount: "notEmpty" }));
                }
                connection.query("DELETE FROM bill WHERE idbill=?", [params.id], function (err, result) {
                    next((err && new DatabaseError(err)) || result.affectedRows !== 1 && new ResourceNotFoundError(null, {
                        id: "notFound"
                    }));
                });
            }
        ], callback);
    };
    return Module;
})(utils.BaseModule);
module.exports = Module;
