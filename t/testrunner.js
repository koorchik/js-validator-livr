var testrunner = require("qunit");

testrunner.run([{
    code: "../lib/LIVR.js",
    tests: "test_suite.js"
}]);
