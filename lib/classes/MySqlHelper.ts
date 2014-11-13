
import utils = require("mykoop-utils");
var DatabaseError = utils.errors.DatabaseError;
import _ = require("lodash");

// FIXME:: Move to mykoop-utils once concept proven
class MySqlHelper {
  private mConnection: mysql.IConnection = null;
  private mCleanup: Function = _.noop;
  private mIsInTransaction = false;

  constructor() {
    _.bindAll(this);
  }

  public connection() { return this.mConnection; }

  // cleanup first to force user to set one
  public setConnection(cleanup, connection) {
    this.mCleanup = cleanup || _.noop;
    this.mConnection = connection;
  }

  public beginTransaction(callback) {
    if(this.mConnection) {
      return this.mConnection.beginTransaction(function(err) {
        this.mIsInTransaction = !err;
        callback(err && new DatabaseError(err, "Cannot begin transaction"));
      });
    }
    callback(new DatabaseError(null, "Connection unavailable"));
  }

  public commitTransaction(callback) {
    if(this.mConnection) {
      return this.mConnection.commit(function(err) {
        // still in transaction if there's an error
        this.mIsInTransaction = !(!err);
        callback(err && new DatabaseError(err, "Cannot commit transaction"));
      });
    }
    callback(new DatabaseError(null, "Connection unavailable"));
  }

  public cleanup(err?, callback?) {
    if(err) {
      if(this.mConnection) {
        if(this.mIsInTransaction) {
          return this.mConnection.rollback(function() {
            this.mCleanup();
            callback && callback(err);
          });
        }
      }
      this.mCleanup();
      return callback && callback(err);
    }
    this.mCleanup();
    callback && callback(null);
  }

}

export = MySqlHelper;
