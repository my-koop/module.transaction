function controller1(req, res) {
    var self = this;

    var id = req.param("id");
    var value = req.param("value");
    if (!id || typeof value !== "string") {
        return res.status(400).send("Missing data");
    }

    var params = {
        id: parseInt(id) || 0,
        value: value
    };

    self.method1(params, function (err, ret) {
        if (err) {
            return res.send(500);
        }

        res.send(ret);
    });
}
;

module.exports = controller1;
