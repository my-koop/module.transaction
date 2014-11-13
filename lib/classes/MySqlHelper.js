var utils = require("mykoop-utils");
var DatabaseError = utils.errors.DatabaseError;
var _ = require("lodash");

// FIXME:: Move to mykoop-utils once concept proven
var MySqlHelper = (function () {
    function MySqlHelper() {
        this.mConnection = null;
        this.mCleanup = _.noop;
        this.mIsInTransaction = false;
        _.bindAll(this);
    }
    MySqlHelper.prototype.connection = function () {
        return this.mConnection;
    };

    // cleanup first to force user to set one
    MySqlHelper.prototype.setConnection = function (cleanup, connection) {
        this.mCleanup = cleanup || _.noop;
        this.mConnection = connection;
    };

    MySqlHelper.prototype.beginTransaction = function (callback) {
        if (this.mConnection) {
            return this.mConnection.beginTransaction(function (err) {
                this.mIsInTransaction = !err;
                callback(err && new DatabaseError(err, "Cannot begin transaction"));
            });
        }
        callback(new DatabaseError(null, "Connection unavailable"));
    };

    MySqlHelper.prototype.commitTransaction = function (callback) {
        if (this.mConnection) {
            return this.mConnection.commit(function (err) {
                // still in transaction if there's an error
                this.mIsInTransaction = !(!err);
                callback(err && new DatabaseError(err, "Cannot commit transaction"));
            });
        }
        callback(new DatabaseError(null, "Connection unavailable"));
    };

    MySqlHelper.prototype.cleanup = function (err, callback) {
        if (err) {
            if (this.mConnection) {
                if (this.mIsInTransaction) {
                    return this.mConnection.rollback(function () {
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
    };
    return MySqlHelper;
})();

module.exports = MySqlHelper;
