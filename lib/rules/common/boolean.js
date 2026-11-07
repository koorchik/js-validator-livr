const util = require('../../util');

function boolean() {
  // The only argument is ruleBuilders: any argument is a schema error, null too
  if (arguments.length > 1) {
    throw new Error('LIVR: "boolean" takes no arguments');
  }

  return (value, params, outputArr) => {
    if (util.isNoValue(value)) return;
    if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

    // Strict equality: 1.0 is 1, but "True" and "01" are not booleans
    switch (value) {
      case true:
      case 1:
      case '1':
      case 'true':
        outputArr.push(true);
        return;
      case false:
      case 0:
      case '0':
      case 'false':
        outputArr.push(false);
        return;
    }

    return 'NOT_BOOLEAN';
  };
}

module.exports = boolean;
