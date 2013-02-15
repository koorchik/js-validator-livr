var testrunner = require("qunit");

testrunner.run([{
    code: "../validator-livr.js",
    tests: "test_suite.js"
}]);
