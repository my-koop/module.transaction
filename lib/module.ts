import utils = require("mykoop-utils");
import controllerList = require("./controllers/index");
import async = require("async");
import _ = require("lodash");
import DiscountTypes = require("./common_modules/discountTypes");
import billUtils = require("./common_modules/billUtils");
import MySqlHelper = require("./classes/MySqlHelper");
var DatabaseError = utils.errors.DatabaseError;
var ApplicationError = utils.errors.ApplicationError;

import assert = require("assert");
var logger = utils.getLogger(module);

class Module extends utils.BaseModule implements mktransaction.Module {
  private db: mkdatabase.Module;
  private user: mkuser.Module;

  init() {
    this.db = <mkdatabase.Module>this.getModuleManager().get("database");
    this.user = <mkuser.Module>this.getModuleManager().get("user");
    controllerList.attachControllers(new utils.ModuleControllersBinder(this));
  }

  getTaxInformation(
    params: any,
    callback: (err, taxes?: Transaction.TaxInfo[]) => void
  ) {
    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        return callback(new DatabaseError(err));
      }
      async.waterfall([
        function(callback) {
          connection.query(
            "SELECT rate, localizeKey FROM taxes",
            function(err, rows) {
              callback(err && new DatabaseError(err), rows);
            }
          );
        },
        function(rows, callback) {
          var taxInfos = _.map(rows, function(row: any) {
            return {
              rate: row.rate,
              localizeKey: row.localizeKey
            };
          });
          callback(null, taxInfos);
        }
      ], function(err, taxInfos: any[]) {
        cleanup();
        callback(err, taxInfos);
      });
    });
  }

  openBill(
    params: Transaction.OpenBill,
    callback: mktransaction.changeBillStateCallback
  ) {
    var id = params.idBill;
    var self = this;
    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        return callback(new DatabaseError(err));
      }

      async.waterfall([
        function findCurrentCustomer(callback) {
          connection.query(
            "SELECT idUser from bill where idBill = ?",
            [id],
            function(err, row) {
              callback(err && new DatabaseError(err, "Error in findCurrentCustomer"), row);
            }
          )
        },
        function checkNewCustomer(row, callback) {
          if(_.isEmpty(row)) {
            return callback(new ApplicationError(
              null,
              {idBill: "Invalid bill id"}
            ));
          }
          if(!row[0].idUser) {
            if(_.isEmpty(params.customerEmail)) {
              return callback(new ApplicationError(
                null,
                {customerEmail: "can't be null"},
                "Missing customer email"
              ));
            }
            return self.user.__getIdForEmail(
              connection,
              {
                email: params.customerEmail
              },
              callback
            );
          }

          callback(null, row[0].idUser);
        },
        function openBill(idUser, callback) {
          logger.verbose(idUser);
          if(!_.isNumber(idUser) || idUser === -1) {
            return callback(new ApplicationError(
              null,
              {customerEmail: "invalid"},
              "Invalid customer email"
            ));
          }
          connection.query(
            "UPDATE bill SET isClosed=0, idUser=? WHERE idBill=?",
            [idUser, id],
            function(err, rows) {
              callback(
                err && new DatabaseError(err, "Error in OpenBill"),
                {
                  success: rows && rows.affectedRows === 1
                }
              );
            }
          );
        }
      ], function(err, result: any) {
        cleanup();
        callback(err, result);
      });
    });
  }

  closeBill(
    params: Transaction.BillId,
    callback: mktransaction.changeBillStateCallback
  ) {
    var id = params.idBill;
    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        return callback(new DatabaseError(err));
      }

      async.waterfall([
        function(callback) {
          connection.query(
            "SELECT total=sum(amount) AS canClose FROM bill\
              LEFT JOIN bill_transaction\
              ON bill.idBill=bill_transaction.idBill\
              LEFT JOIN transaction\
              ON bill_transaction.idTransaction=transaction.idTransaction\
              WHERE bill.idBill=? and isClosed=0\
              GROUP BY bill.idBill",
            [id],
            function(err, rows) {
              callback(
                err && new DatabaseError(err),
                rows && rows.length === 1 && rows[0].canClose
              );
            }
          )
        },

        function(canClose, callback) {
          if(!canClose) {
            return callback(new ApplicationError(null, {reason: "can't close"}));
          }
          connection.query(
            "UPDATE bill SET isClosed=1 WHERE idBill=?",
            [id],
            function(err, rows) {
              callback(
                err && new DatabaseError(err),
                rows && rows.affectedRows === 1
              );
            }
          );
        }

      ], function(err, success: any) {
        cleanup();
        callback(err, {
          success: success
        });
      });
    });
  }

  listBills(
    params: Transaction.ListBill,
    callback: mktransaction.listBillsCallback
  ) {
    var selectIsClosed = params.show === "open" ? 0 : 1;
    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        return callback(new DatabaseError(err));
      }

      async.waterfall([
        function(callback) {
          connection.query(
            "SELECT bill.idBill, sum(amount) AS paid, createdDate, total, idUser FROM bill\
                LEFT JOIN bill_transaction \
                ON bill.idBill=bill_transaction.idBill \
                LEFT JOIN transaction \
                ON bill_transaction.idTransaction=transaction.idTransaction \
                WHERE isClosed = ? \
                GROUP BY bill.idBill",
            [selectIsClosed],
            function(err, rows) {
              logger.silly("listBills query result", rows);
              var result: Transaction.Bill[] = _.map(rows, function(row: any) {
                return {
                  idBill: row.idBill,
                  idUser: row.idUser,
                  createdDate: row.createdDate,
                  total: row.total,
                  paid: row.paid
                };
              });
              callback(err && new DatabaseError(err), result);
            }
          )
        }

      ], function(err, result: Transaction.Bill[]) {
        cleanup();
        callback(err, result);
      });
    });
  }

  saveNewBill(
    params: Transaction.NewBill,
    callback: mktransaction.saveNewBillCallback
  ) {
    var self = this;
    var idBill = -1;
    var idUser = null;
    // can't archive a bill without a customer email
    assert(!params.archiveBill || params.customerEmail);

    logger.debug("Save new bill", params);
    var mysqlHelper = new MySqlHelper();

    async.waterfall([
      function(callback) {
        logger.debug("checking if email is valid");
        if(params.customerEmail) {
          return self.user.getIdForEmail({
              email: params.customerEmail
            },
            callback
          );
        }
        // no email is considered valid if we don't archive the bill
        callback(null, null);
      },

      function(id, callback) {
        idUser = ~id ? id : null;
        logger.debug("user id is ", idUser);
        // an id of -1 is an error, but null is acceptable
        callback(
          !(~id) &&
          new ApplicationError(null, {customerEmail: ["invalid"]})
        );
      },

      function(callback) {
        logger.debug("getting connection");
        self.db.getConnection(function(err, connection, cleanup) {
          if(err) {
            return callback(new DatabaseError(err));
          }
          mysqlHelper.setConnection(cleanup, connection);
          callback(null);
        });
      },

      mysqlHelper.beginTransaction,

      function(callback) {
        logger.debug("Create new bill id");
        // Create bill
        mysqlHelper.connection().query(
          "INSERT INTO bill SET createdDate = now(), total = ?, idUser = ?, isClosed = ?",
          [params.total, idUser, !params.archiveBill],
          function(err, res) {
            callback(
              err && new DatabaseError(err),
              res && res.insertId
            );
          }
        );
      },

      function(id, callback) {
        idBill = id;
        logger.debug("Link items to idBill: %d", idBill);
        // Add list of item in the bill
        var billItems =
          _.map(params.items, function(item) {
            var idItem = item.id >= 0 ? item.id : null;
            return [
              idBill,
              idItem,
              item.quantity,
              item.price,
            ];
          }
        );
        mysqlHelper.connection().query(
          "INSERT INTO bill_item (idBill, idItem, quantity, price) VALUES ?",
          [
            billItems
          ],
          function(err, res) {
            callback(err && new DatabaseError(err));
          }
        );
      },

      function(callback) {
        if(_.isEmpty(params.discounts)) {
          // no discounts to add
          return callback(null);
        }
        logger.debug("Link discounts to idBill: %d", idBill);

        // Add list of discount in the bill
        var billDiscounts =
          _.map(params.discounts, function(discount) {
            return [
              idBill,
              DiscountTypes.Types[discount.type],
              discount.value,
              discount.isAfterTax
            ];
          }
        );
        mysqlHelper.connection().query(
          "INSERT INTO bill_discount (idBill, type, amount, isAfterTax) VALUES ?",
          [
            billDiscounts
          ],
          function(err, res) {
            callback(err && new DatabaseError(err));
          }
        );
      },

      function(callback) {
        // must create a transaction with the full amount
        if(!params.archiveBill) {
          logger.debug("Create a transaction with full amount for idBill: %d", idBill);
          mysqlHelper.connection().query(
            "INSERT INTO transaction SET amount=?",
            [params.total],
            function(err, res) {
              callback(
                err && new DatabaseError(err),
                res && res.insertId
              );
            }
          );
          return;
        }
        callback(null, 0);
      },

      function(idTransaction, callback) {
        if(!params.archiveBill) {
          logger.debug("Link transaction [%d] to bill [%d]", idTransaction, idBill);
          mysqlHelper.connection().query(
            "INSERT INTO bill_transaction SET idBill = ?, idTransaction = ?",
            [idBill, idTransaction],
            function(err, res) {
              callback(
                err && new DatabaseError(err)
              );
            }
          );
          return;
        }
        callback(null);
      },

      mysqlHelper.commitTransaction
    ], <any>_.partialRight(mysqlHelper.cleanup, function(err) {
      callback(err, {idBill: idBill});
    }));
  }
}

export = Module;
