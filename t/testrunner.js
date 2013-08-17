var testrunner = require("qunit");

testrunner.run([{
    code: "../lib/LIVR.js",
    tests: "01-test_suite.js"
},
{
    code: "../lib/LIVR.js",
    tests: "04-custom_filters.js"
}
]);
