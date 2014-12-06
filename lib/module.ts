import utils = require("mykoop-utils");
import controllerList = require("./controllers/index");
import async = require("async");
import _ = require("lodash");
import DiscountTypes = require("./common/discountTypes");
import billUtils = require("./common/billUtils");
import BillInformation = require("./classes/BillInformation");
var MySqlHelper = utils.MySqlHelper;
var DatabaseError = utils.errors.DatabaseError;
var ApplicationError = utils.errors.ApplicationError;
var ResourceNotFoundError = ApplicationError.ResourceNotFoundError;

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
    params: mktransaction.AddBillTransaction,
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
    callback: (err, taxes?: mktransaction.TaxInfo[]) => void
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
    params: mktransaction.OpenBill,
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
    params: mktransaction.BillId,
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

  getBillDetails(
    params: mktransaction.GetBillDetails.Params,
    callback: mktransaction.GetBillDetails.Callback
  ) {
    this.callWithConnection(this.__getBillDetails, params, callback);
  }
  __getBillDetails(
    connection: mysql.IConnection,
    params: mktransaction.GetBillDetails.Params,
    callback: mktransaction.GetBillDetails.Callback
  ) {
    var self = this;
    async.waterfall([
      function(next) {
        self.__getBill(connection, {id: params.id}, next);
      },
      function(result: mktransaction.GetBill.CallbackResult, next) {
        connection.query(
          "SELECT\
            i.id,\
            b.quantity,\
            b.price,\
            coalesce(i.name, b.name) AS name,\
            i.code\
          FROM bill_item b\
          LEFT JOIN item i on b.idItem=i.id\
          WHERE idBill = ?",
          [params.id],
          function(err, rows) {
            if(err) {
              return next(new DatabaseError(err));
            }
            var items = _.map(rows, _.identity);
            next(null, _.merge(result, {items: items}));
          }
        );
      }
    ], <any>callback);
  }

  getBill(
    params: mktransaction.GetBill.Params,
    callback: mktransaction.GetBill.Callback
  ) {
    this.callWithConnection(this.__getBill, params, callback);
  }

  __getBill(
    connection: mysql.IConnection,
    params: mktransaction.GetBill.Params,
    callback: mktransaction.GetBill.Callback
  ) {
    connection.query(
      BillInformation.Get1BillQuery,
      [params.id],
      function(err, result) {
        if(err) {
          return callback(new DatabaseError(err));
        }
        if(result.length === 0) {
          return callback(new ResourceNotFoundError(null, {id: "notFound"}));
        }
        callback(null, new BillInformation(result[0]));
      }
    )
  }

  listBills(
    params: mktransaction.ListBill,
    callback: mktransaction.listBillsCallback
  ) {
    var self = this;
    var selectIsClosed = params.show === "open" ?
      BillInformation.GetOpenBillsQuery
    : BillInformation.GetCloseBillsQuery;

    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        return callback(new DatabaseError(err));
      }

      async.waterfall([
        function(callback) {
          connection.query(
            selectIsClosed,
            function(err, rows) {
              logger.silly("listBills query result", rows);
              var result: mktransaction.Bill[] = _.map(rows, function(row: any) {
                return new BillInformation(row);
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

  updateBill(
    params: mktransaction.UpdateBill.Params,
    callback: mktransaction.UpdateBill.Callback
  ) {
    this.callWithConnection(this.__updateBill, params, callback);
  }

  __updateBill(
    connection: mysql.IConnection,
    params: mktransaction.UpdateBill.Params,
    callback: mktransaction.UpdateBill.Callback
  ) {
    var newValue = {
      notes: params.notes
    };
    connection.query(
      "UPDATE bill SET ? WHERE idBill = ?",
      [newValue, params.id],
      function(err, res) {
        if(err) {
          return callback(new DatabaseError(err));
        }
        if(res.affectedRows !== 1) {
          return callback(new ResourceNotFoundError(null, {id: "notFound"}));
        }
        callback();
      }
    );
  }

  __updateInventory(
    connection: mysql.IConnection,
    params: {items: {id: number; quantity: number}[]},
    callback
  ) {
    var queryParams = [];
    var itemsIds = [];
    var cases = _(params.items)
      .filter(function(item) {
        return _.isNumber(item.id) && item.id > 0;
      })
      .reduce(function(cases, item) {
        itemsIds.push(item.id);
        queryParams.push(item.id);
        queryParams.push(item.quantity);
        return cases + " WHEN ? THEN quantity-?";
      }, "");

    if(!_.isEmpty(queryParams)) {
      connection.query(
        "UPDATE item SET quantity = CASE id " + cases +
        " END WHERE id IN (?)",
        queryParams.concat([itemsIds]),
        function(err, result) {
          if(err) {
            return callback(new DatabaseError(err));
          }
          callback();
        }
      )
    } else {
      callback();
    }
  }

  saveNewBill(
    params: mktransaction.NewBill,
    callback: mktransaction.saveNewBillCallback
  ) {
    this.callWithConnection(this.__saveNewBill, params, callback);
  }

  __saveNewBill(
    connection: mysql.IConnection,
    params: mktransaction.NewBill,
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
        var idEvent = _.isNumber(params.idEvent) && params.idEvent >= 0 ?
          params.idEvent
        : null;
        var billDiscounts =
          _.map(params.discounts, function(discount) {
            return {
              type: discount.type,
              value: discount.value,
              isAfterTax: discount.isAfterTax
            };
          }
        );
        // Create bill
        connection.query(
          "INSERT INTO bill SET \
          createdDate = NOW(), \
          total = ?, \
          notes = ?, \
          idUser = ?, \
          idEvent = ?, \
          category = ?, \
          discounts = ?, \
          closedDate = " + closedDate,
          [
            params.total,
            params.notes,
            idUser,
            idEvent,
            params.category,
            JSON.stringify(billDiscounts)
          ],
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
              item.name
            ];
          }
        );
        connection.query(
          "INSERT INTO bill_item (\
            idBill, \
            idItem, \
            quantity, \
            price, \
            name\
          ) VALUES ?",
          [
            billItems
          ],
          function(err, res) {
            callback(err && new DatabaseError(err));
          }
        );
      },
      function(callback) {
        self.__updateInventory(connection, params, callback);
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

  deleteBill(
    params: mktransaction.DeleteBill.Params,
    callback: mktransaction.DeleteBill.Callback
  ) {
    this.callWithConnection(this.__deleteBill, params, callback);
  }

  __deleteBill(
    connection: mysql.IConnection,
    params: mktransaction.DeleteBill.Params,
    callback: mktransaction.DeleteBill.Callback
  ) {
    var self = this;
    async.waterfall([
      function(next) {
        self.__getBillDetails(connection, params, next);
      },
      function(result: mktransaction.GetBillDetails.Result, next) {
        if(result.transactionCount) {
          return next(new ApplicationError(null, {transactionCount: "notEmpty"}));
        }
        var itemOpposite = _.map(result.items, function(item) {
          return {
            id: item.id,
            quantity: -item.quantity
          }
        });
        self.__updateInventory(connection, {items: itemOpposite}, next);
      },
      function(next) {
        connection.query(
          "DELETE FROM bill WHERE idbill=?",
          [params.id],
          function(err, result) {
            next(
              (err && new DatabaseError(err)) ||
              result.affectedRows !== 1 && new ResourceNotFoundError(null, {
                id: "notFound"
              })
            );
          }
        )
      }
    ], callback);
  }

  getFinancialReport(
    params: mktransaction.db.FinancialReport,
    callback: (err, report) => void
  ) {
    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        cleanup();
        return callback(new DatabaseError(err), null);
      }
      logger.verbose("Getting report from", params.fromDate ,"to", params.toDate);
      connection.query(" \
      SELECT \
        category, \
        ifnull(SUM(transaction.amount), 0) as total, \
        ifnull(SUM(CASE WHEN transaction.amount > 0 THEN transaction.amount ELSE 0 END), 0) as totalSales, \
        ifnull(SUM(CASE WHEN transaction.amount < 0 THEN transaction.amount ELSE 0 END), 0) as totalRefunds, \
        count(transaction.idTransaction) as transactions, \
        ifnull(SUM(CASE WHEN transaction.amount > 0 THEN 1 ELSE 0 END), 0) as sales, \
        ifnull(SUM(CASE WHEN transaction.amount < 0 THEN 1 ELSE 0 END), 0) as refunds  \
      FROM bill \
      INNER JOIN bill_transaction on bill.idbill = bill_transaction.idbill \
      INNER JOIN transaction on transaction.idTransaction = bill_transaction.idTransaction \
      WHERE bill.category IN( 'product', 'membership', 'subscription') \
      AND (transaction.date BETWEEN ? AND ?) \
      GROUP BY bill.category",
      [params.fromDate, params.toDate],
      function(err, rows){
        cleanup();
        callback(err && new DatabaseError(err), { reports: _.map(rows, function(report){ return report }) } );
      })
    });
  }
}

export = Module;
