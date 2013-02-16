var fs = require('fs');
var LIVR = require('../lib/LIVR');

console.log(LIVR);

var validator = new LIVR.Validator({
    name: { min_length: 2 },
    email: ['required', { max_length: 2 } ],
    age: 'positive_decimal',
    password: {'one_of': [['test', 123]] },
    password2: {'equal_to_field': 'password'}
});


validator.prepare();

var data = validator.validate({name:'a', email: "123", age:'-20', password: '123', password2: 1234});

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
