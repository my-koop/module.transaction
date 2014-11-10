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
            }
        }
    }
};
module.exports = endpoints;
