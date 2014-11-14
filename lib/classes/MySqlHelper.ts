
import utils = require("mykoop-utils");
var DatabaseError = utils.errors.DatabaseError;
import _ = require("lodash");

// FIXME:: Move to mykoop-utils once concept proven
class MySqlHelper {
  private mConnection: mysql.IConnection = null;
  private mCleanup: Function = _.noop;
  private mIsInTransaction = false;

  constructor() {
    // this is to make sure all call to these method uses this
    // especially usefull when using the methods in a waterfall
    _.bindAll(this);
  }

  public connection() { return this.mConnection; }

  // cleanup first to force user to set one
  public setConnection(cleanup, connection) {
    this.mCleanup = cleanup || _.noop;
    this.mConnection = connection;
  }

  public beginTransaction(callback) {
    var self = this;
    if(this.mConnection) {
      return this.mConnection.beginTransaction(function(err) {
        self.mIsInTransaction = !err;
        callback(err && new DatabaseError(err, "Cannot begin transaction"));
      });
    }
    callback(new DatabaseError(null, "Connection unavailable"));
  }

  public commitTransaction(callback) {
    var self = this;
    if(this.mConnection) {
      return this.mConnection.commit(function(err) {
        // still in transaction if there's an error
        self.mIsInTransaction = !(!err);
        callback(err && new DatabaseError(err, "Cannot commit transaction"));
      });
    }
    callback(new DatabaseError(null, "Connection unavailable"));
  }

  public cleanup(err?, callback?) {
    if(err && this.mConnection && this.mIsInTransaction) {
      // Cleanup when in transaction
      var self = this;
      return this.mConnection.rollback(function() {
        self.mCleanup();
        callback && callback(err);
      });
    }

    this.mCleanup();
    callback && callback(err);
  }

}

export = MySqlHelper;
