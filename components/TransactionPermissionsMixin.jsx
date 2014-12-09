
var MKPermissionMixin = require("mykoop-user/components/PermissionMixin");
var validatePermission = MKPermissionMixin.statics.validateUserPermissions;

module.exports = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
  canClose: false,
  canReopen: false,
  canReports: false,
  componentWillMount: function () {
    this.canRead = validatePermission({
      invoices: {
        read: true
      }
    });
    this.canCreate = this.canRead && validatePermission({
      invoices: {
        create: true
      }
    });

    this.canUpdate = this.canRead && validatePermission({
      invoices: {
        update: true
      }
    });
    this.canDelete = this.canRead && validatePermission({
      invoices: {
        delete: true
      }
    });
    this.canClose = this.canRead && validatePermission({
      invoices: {
        close: true
      }
    });
    this.canReopen = this.canRead && validatePermission({
      invoices: {
        reopen: true
      }
    });
    this.canReports = this.canRead && validatePermission({
      invoices: {
        reports: true
      }
    });
    this.canListEvents = validatePermission({
      events: {
        view: true
      }
    });
    this.canListInventory = validatePermission({
      inventory: {
        read: true
      }
    });
    var missingPermissions = [];
    if(this.canCreate) {
      if(!this.canListEvents) {
        missingPermissions.push({key: "permissions::events.view"});
      }
      if(!this.canListEvents) {
        missingPermissions.push({key: "permissions::inventory.read"});
      }
      if(missingPermissions.length) {
        missingPermissions.unshift({
          key: "transaction::missingPermissionsCreateBill"
        });
        if(this.setFeedback) {
          this.setFeedback(missingPermissions, "warning");
        }
      }
    }
  },
};
