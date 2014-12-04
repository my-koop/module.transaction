var endpoints = {
    transaction: {
        bill: {
            new: {
                path: "/bills",
                method: "post",
                validation: {
                    resolve: "validation",
                    value: "newBill"
                }
            },
            list: {
                path: "/bills",
                method: "get",
                validation: {
                    resolve: "validation",
                    value: "listBill"
                }
            },
            close: {
                path: "/bills/:id/close",
                method: "put"
            },
            open: {
                path: "/bills/:id/open",
                method: "put"
            },
            get: {
                path: "/bills/:id",
                method: "get"
            },
            details: {
                path: "/bills/:id/details",
                method: "get"
            },
            addTransaction: {
                path: "/bills/:id/transactions",
                method: "post"
            },
            delete: {
                path: "/bills/:id",
                method: "delete"
            }
        },
        taxes: {
            get: {
                path: "/configs/taxes",
                method: "get"
            }
        },
        report: {
            path: "/transaction/report",
            method: "get"
        }
    }
};
module.exports = endpoints;
