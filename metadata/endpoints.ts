var endpoints = {
  transaction: {
    bill: {
      new: {
        path: "/transaction/bill/new",
        method: "post",
        validation: {
          resolve: "validation",
          value: "newBill"
        }
      },
      list: {
        path: "/transaction/bill/list",
        method: "get",
        validation: {
          resolve: "validation",
          value: "listBill"
        }
      }
    }
  }
}
export = endpoints;
