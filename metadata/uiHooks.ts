var uiHooks = {
  navbar_main_dashboard: {
    invoices: {
      type: "item",
      content: {
        icon: "book",
        text: "transaction::navbar.invoices",
        link: {
          to: "listBills",
          params: {
            state: "open"
          }
        }
      },
      permissions: {
        invoices: {
          view: true
        }
      },
      priority: 125
    },
    quickactions: {
      content: {
        children: {
          createInvoice: {
            type: "item",
            content: {
              icon: "book",
              text: "transaction::navbar.quickActions.createInvoice",
              link: "newBill"
            },
            priority: 25,
            permissions: {
              invoices: {
                create: true
              }
            }
          },
        },
      }
    }
  },
  sidebar: {
    invoices: {
      type: "item",
      content: {
        icon: "book",
        text: "transaction::sidebar.invoices",
        children: {
          createInvoice: {
            type: "item",
            content: {
              icon: "plus",
              text: "transaction::sidebar.createInvoice",
              link: "newBill"
            },
            priority: 100,
            permissions: {
              invoices: {
                create: true
              }
            }
          },
          listInvoices: {
            type: "item",
            content: {
              icon: "list-ul",
              text: "transaction::sidebar.listInvoices",
              link: {
                to: "listBills",
                params: {
                  state: "open"
                }
              }
            },
            permissions: {
              invoices: {
                view: true
              }
            },
            priority: 150
          },
          reports: {
            type: "item",
            content: {
              icon: "bar-chart",
              text: "transaction::sidebar.reports",
              link: "financialReport"
            },
            permissions: {
              invoices: {
                reports: true
              }
            },
            priority: 200
          }
        }
      },
      priority: 150,
      permissions: {
        invoices: {
          view: true
        }
      }
    }
  }
};

export = uiHooks;
