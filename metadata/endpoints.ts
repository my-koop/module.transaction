
var endpoints = {
  transaction: {
    bill: {
      new: {
        path: "/transaction/bills",
        method: "post",
        validation: {
          resolve: "validation",
          value: "newBill"
        }
      },
      list: {
        path: "/transaction/bills",
        method: "get",
        validation: {
          resolve: "validation",
          value: "listBill"
        }
      },
      close: {
        path: "/transaction/bills/:id/close",
        method: "put"
      },
      open: {
        path: "/transaction/bills/:id/open",
        method: "put"
      },
      get: {
        path: "/transaction/bills/:id",
        method: "get"
      },
      addTransaction : {
        path: "/transaction/bills/:id",
        method: "post"
      },
      delete: {
        path: "/transaction/bills/:id",
        method: "delete"
      }
    },
    taxes: {
      get: {
        path: "/transaction/taxes",
        method: "get"
      }
    }
  }
}
export = endpoints;
