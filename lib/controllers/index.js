var metaData = require("../../metadata/index");

var validation = require("../validation/index");

// Controllers.
var controller1 = require("./controller1");

var endPoints = metaData.endpoints;

function attachControllers(binder) {
    binder.attach({
        endPoint: endPoints.example.get1,
        validation: validation.get1
    }, controller1);
}
exports.attachControllers = attachControllers;
