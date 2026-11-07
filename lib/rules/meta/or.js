const Validator = require('../../Validator');

// A rest parameter instead of slicing `arguments`, which is slow
function or(...ruleSets) {
  const ruleBuilders = ruleSets.pop();

  const fieldRules = ruleSets.map(rules => {
    const livr = { field: rules };
    const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

    return validator.getFieldRule('field');
  });

  return (value, params, outputArr) => {
    let lastError;

    for (const fieldRule of fieldRules) {
      // On success fieldRule pushes the output value to outputArr itself;
      // a failed rule set pushes nothing. The rule sets are transparent: their rules see the
      // siblings of the field
      const errCode = fieldRule(value, params, outputArr);
      if (!errCode) return;

      lastError = errCode;
    }

    return lastError;
  };
}

module.exports = or;
