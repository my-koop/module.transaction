import utils = require("mykoop-utils");
import controllerList = require("./controllers/index");
import async = require("async");
import _ = require("lodash");
import DiscountTypes = require("./common_modules/discountTypes");
var DatabaseError = utils.errors.DatabaseError;

class Module extends utils.BaseModule implements mktransaction.Module {
  private db: mkdatabase.Module;

  init() {
    this.db = <mkdatabase.Module>this.getModuleManager().get("database");
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
    var idBill = -1;

    this.db.getConnection(function(err, connection, cleanup) {
      if(err) {
        return callback(new DatabaseError(err));
      }
      async.waterfall([
        function(callback) {
          connection.beginTransaction(function(err) {
            callback(err && new DatabaseError(err));
          });
        },

        function(callback) {
          // Create bill
          connection.query(
            "INSERT INTO bill SET createdDate=now()",
            function(err, res) {
              callback(
                err && new DatabaseError(err),
                res && res.insertId
              )
            }
          );
        },

        function(id, callback) {
          idBill = id;
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

        cleanup();
        callback(null, {idBill: idBill});
      });
    });

  }
}

export = Module;
