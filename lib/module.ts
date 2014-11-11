import utils = require("mykoop-utils");
import controllerList = require("./controllers/index");
import async = require("async");
import _ = require("lodash");
import DiscountTypes = require("./common_modules/discountTypes");
var DatabaseError = utils.errors.DatabaseError;
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

  listBills(
    params: any,
    callback: (err, result?) => void
  ) {

    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        return callback(new DatabaseError(err));
      }

      async.waterfall([
        function(callback) {
          connection.query(
            "SELECT * FROM bill",
            function(err, result) {
              callback(err && new DatabaseError(err), result);
            }
          )
        }

      ], function(err, result) {
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
    // can't archive a bill without a customer email
    assert(!params.archiveBill || params.customerEmail);

    logger.debug("Save new bill", params);
    var connection, cleanup = _.noop;
    async.waterfall([
      function(callback) {
        logger.debug("checking if email is valid");
        if(params.customerEmail) {
          return self.user.checkEmailExists({
              email: params.customerEmail
            },
            callback
          );
        }
        // no email is considered valid if we don't archive the bill
        callback(null, !params.archiveBill);
      },

      function(isValid, callback) {
        logger.debug("email validity is ", isValid);
        callback(!isValid && new ApplicationError(null, {customerEmail: ["invalid"]}));
      },

      function(callback) {
        logger.debug("getting connection");
        self.db.getConnection(function(err, connection_, cleanup_) {
          if(err) {
            return callback(new DatabaseError(err));
          }
          connection = connection_;
          cleanup = cleanup_;
          callback(null);
        });
      },

      function(callback) {
        logger.debug("Begin transaction");
        connection.beginTransaction(function(err) {
          callback(err && new DatabaseError(err));
        });
      },

      function(callback) {
        logger.debug("Create new bill id");
        // Create bill
        connection.query(
          "INSERT INTO bill SET createdDate=now()",
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
          logger.debug("Create a transaction with full amount for idBill: %d", idBill);
          connection.query(
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
          connection.query(
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

      function(callback) {
        logger.debug("Commiting transaction");
        // No errors yet, commit all that
        connection.commit(function(err) {
          callback(err && new DatabaseError(err));
        });
      }
    ], function(err) {
      if(err) {
        connection.rollback(function() {
          cleanup();
          callback(err);
        });
        return;
      }
      // success
      cleanup();
      callback(null, {idBill: idBill});
    });
  }
}

export = Module;
