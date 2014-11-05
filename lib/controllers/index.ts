import metaData = require("../../metadata/index");
import utils = require("mykoop-utils");

import validation = require("../validation/index");

// Controllers.
import controller1 = require ("./controller1");

var endPoints = metaData.endpoints;

export function attachControllers(binder) {
  binder.attach(
    {
      endPoint: endPoints.example.get1,
      validation: validation.get1
    },
    controller1
  );
}
