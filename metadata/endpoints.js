var endpoints = {
    transaction: {
        bill: {
            new: {
                path: "/transaction/bill",
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
            },
            close: {
                path: "/transaction/bill/close/:id",
                method: "put"
            },
            open: {
                path: "/transaction/bill/open/:id",
                method: "put"
            }
        }
    }
};
module.exports = endpoints;
