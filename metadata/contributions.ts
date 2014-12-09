var contributions = {
  user: {
    profileEdit: {
      billhistory: {
        titleKey: "transaction::billHistoryTab",
        hash: "billhistory",
        component: {
          resolve: "component",
          value: "BillHistoryPage"
        },
        priority: 240,
        permissions: {
          invoices: {
            read: true
          }
        }
      }
    }
  },
  core: {
    settings: {
      taxes: {
        titleKey: "taxes::settingsTitle",
        component: {
          resolve: "component",
          value: "TaxesSettings"
        },
        priority: 150,
        permissions: {
          website: {
            settings: true
          }
        }
      }
    }
  }
};

export = contributions;
