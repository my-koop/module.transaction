import utils = require("mykoop-utils");
import controllerList = require("./controllers/index");
import async = require("async");
import _ = require("lodash");
import DiscountTypes = require("./common_modules/discountTypes");
import billUtils = require("./common_modules/billUtils");
var MySqlHelper = utils.MySqlHelper;
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

  addBillTransaction(
    params: Transaction.AddBillTransaction,
    callback: mktransaction.successCallback
  ) {
    var self = this;
    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        return callback(new DatabaseError(err));
      }
      var helper = new MySqlHelper();
      helper.setConnection(cleanup, connection);
      async.waterfall([
        helper.beginTransaction,
        function(callback) {
          self.__addBillTransaction(
            helper.connection(),
            {
              idBill: params.idBill,
              amount: params.amount
            }, callback
          )
        },
        function(result, callback) {
          helper.commitTransaction(function(err) {
            callback(err);
          });
        }
      ], function(err) {
        helper.cleanup(err, function() {
          callback(err);
        });
      });
    });
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
    callback: mktransaction.successCallback
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
            "SELECT idUser from bill where idBill = ? AND closedDate IS NOT NULL",
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
            "UPDATE bill SET closedDate=NULL, idUser=? WHERE idBill=?",
            [idUser, id],
            function(err, rows) {
              callback(
                err && new DatabaseError(err, "Error in OpenBill"),
                rows && rows.affectedRows === 1
              );
            }
          );
        }
      ], function(err, result: any) {
        cleanup();
        callback(err || (!result && new ApplicationError(null, {})));
      });
    });
  }

  closeBill(
    params: Transaction.BillId,
    callback: mktransaction.successCallback
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
              WHERE bill.idBill=? and closedDate IS NULL\
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
            "UPDATE bill SET closedDate=NOW() WHERE idBill=?",
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
        callback(err || (!success && new ApplicationError(null, {})));
      });
    });
  }

  listBills(
    params: Transaction.ListBill,
    callback: mktransaction.listBillsCallback
  ) {
    var selectIsClosed = params.show === "open" ? "" : "NOT";
    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        return callback(new DatabaseError(err));
      }

      async.waterfall([
        function(callback) {
          connection.query(
            "SELECT \
              bill.idBill,\
              sum(amount) AS paid,\
              createdDate,\
              closedDate,\
              total,\
              idUser\
            FROM bill\
            LEFT JOIN bill_transaction \
              ON bill.idBill=bill_transaction.idBill \
            LEFT JOIN transaction \
              ON bill_transaction.idTransaction=transaction.idTransaction \
            WHERE closedDate IS " + selectIsClosed + " NULL \
            GROUP BY bill.idBill",
            [selectIsClosed],
            function(err, rows) {
              logger.silly("listBills query result", rows);
              var result: Transaction.Bill[] = _.map(rows, function(row: any) {
                return {
                  idBill: row.idBill,
                  idUser: row.idUser,
                  createdDate: row.createdDate,
                  closedDate: row.closedDate,
                  total: row.total,
                  paid: row.paid
                };
              });
              callback(err && new DatabaseError(err), result);
            }
          )
        }

      ], function(err, result: any) {
        cleanup();
        callback(err, result);
      });
    });
  }

  saveNewBill(
    params: Transaction.NewBill,
    callback: mktransaction.saveNewBillCallback
  ) {
    this.callWithConnection(this.__saveNewBill, params, callback);
  }

  __saveNewBill(
    connection: mysql.IConnection,
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
    mysqlHelper.setConnection(_.noop, connection);

    async.waterfall([
      function(callback) {
        logger.debug("checking if email is valid");
        if(params.customerEmail) {
          return self.user.__getIdForEmail(connection, {
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

      mysqlHelper.beginTransaction,

      function(callback) {
        logger.debug("Create new bill id");
        var total = params.total;
        var closedDate = params.archiveBill ? "NULL" : "NOW()";
        // Create bill
        connection.query(
          "INSERT INTO bill SET \
          createdDate = NOW(), \
          total = ?, \
          notes = ?, \
          idUser = ?, \
          closedDate = " + closedDate,
          [params.total, params.notes, idUser],
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
        connection.query(
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
        connection.query(
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
          self.__addBillTransaction(
            connection,
            {
              idBill: idBill,
              amount: params.total
            },
            function(err) {
              callback(err);
            }
          )
          return;
        }
        callback(null);
      },

      mysqlHelper.commitTransaction
    ], <any>_.partialRight(mysqlHelper.cleanup, function(err) {
      callback(err, {idBill: idBill});
    }));
  }

  __addTransaction(
    connection: mysql.IConnection,
    params: {amount: number},
    callback: (err, result?: {idTransaction: number;}) => void
  ) {
    logger.debug("Create a transaction with amount %d", params.amount);
    connection.query(
      "INSERT INTO transaction SET amount=?",
      [params.amount],
      function(err, res) {
        var result = {
          idTransaction: res && res.insertId
        };
        callback(
          err && new DatabaseError(err),
          result
        );
      }
    );
  }

  __addBillTransaction(
    connection: mysql.IConnection,
    params: {idBill: number; amount: number},
    callback: (err, result?: {idTransaction: number;}) => void
  ) {
    this.__addTransaction(
      connection,
      {amount: params.amount},
      function(err, res) {
        if(err) {
          return callback(err);
        }
        logger.debug("Link transaction [%d] to bill [%d]",
          res.idTransaction,
          params.idBill
        );
        connection.query(
          "INSERT INTO bill_transaction SET idBill = ?, idTransaction = ?",
          [params.idBill, res.idTransaction],
          function(err, row) {
            var success = row && row.affectedRows === 1;
            callback(
              (err &&
              new DatabaseError(err, "Error inserting into bill_transaction")) ||
              (!success &&
                new ApplicationError(
                  null,
                  {},
                  "Error inserting into bill_transaction"
                )
              ),
              // Send back transaction id
              res
            )
          }
        )
      }
    )
  }
}

export = Module;
