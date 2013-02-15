var fs = require('fs');
var LIVR = require('../validator-livr');

console.log(LIVR);

var validator = new LIVR.Validator({
    name: { min_length: 2 },
    email: ['required', { max_length: 2 } ]
});


validator.prepare();

var data = validator.validate({name:'a', email: "123"});

if (data) {
    console.log('data', data);
} else {
    console.log('errors', validator.get_errors());
}

function load_json_file(file, cb) {
    if (!file) throw 'FILE FOR LOAD REQUIRED';

    fs.readFile(file, function (err, json) {
        if (err) throw err;
        console.log('READ RAW JSON');

        var data = JSON.parse(json);
        json = null;
        console.log('PARSED RAW JSON');
        
        cb(data);
    });
}
