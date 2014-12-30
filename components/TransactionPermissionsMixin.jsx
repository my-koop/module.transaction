
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
    this.canReadInvoices = validatePermission({
      invoices: {
        read: true
      }
    });
    this.canCreateInvoices = validatePermission({
      invoices: {
        create: true
      }
    });

    this.canUpdateInvoices = this.canReadInvoices && validatePermission({
      invoices: {
        update: true
      }
    });
    this.canDeleteInvoices = this.canReadInvoices && validatePermission({
      invoices: {
        delete: true
      }
    });
    this.canCloseInvoices = this.canReadInvoices && validatePermission({
      invoices: {
        close: true
      }
    });
    this.canReopenInvoices = this.canReadInvoices && validatePermission({
      invoices: {
        reopen: true
      }
    });
    this.canReportsFinances = this.canReadInvoices && validatePermission({
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
  },
};
