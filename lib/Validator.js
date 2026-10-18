'use strict';

const BaseValidator = require('./BaseValidator');
const util = require('./util');

const hasOwn = Object.prototype.hasOwnProperty;

// Takes the value a rule pushed to the output array, and empties the array for the next rule.
// Reusing one array is cheaper than a new array per rule call, and pop() is cheaper than length = 0
function takeOutput(ruleOutput) {
  if (ruleOutput.length === 1) return ruleOutput.pop();

  const output = ruleOutput[0];
  ruleOutput.length = 0;
  return output;
}

class Validator extends BaseValidator {
  constructor(livrRules, options) {
    super(livrRules, options);
    this.errors = null;
  }

  static buildAliasedRule(rules, errorCode) {
    if (!rules) throw 'Alias rules required';

    const livr = { value: rules };

    return ruleBuilders => {
      // ruleBuilders comes always as a last argument
      // we register them to support custom rules in aliases
      const validator = new Validator(livr).registerRules(ruleBuilders).prepare();
      const validateValue = validator.getFieldRule('value');

      return (value, params, outputArr) => {
        const errCode = validateValue(value, { value }, outputArr);
        if (errCode) return errorCode || errCode;
      };
    };
  }

  validate(data) {
    if (!this.isPrepared) this.prepare();

    if (!util.isObject(data)) {
      this.errors = 'FORMAT_ERROR';
      return;
    }

    if (this.options.autoTrim) {
      data = this._autoTrim(data);
    }

    // this.validators may be filled or changed by a subclass, so it is read on every call
    const validatorsByField = this.validators;
    const result = {};
    let errors = null;
    const ruleOutput = [];

    for (const fieldName in validatorsByField) {
      const validators = validatorsByField[fieldName];
      if (!validators || !validators.length) continue;

      const value = util.getFieldValue(data, fieldName);
      let resultFieldValue;
      let resultFieldValueIsSet = false;

      for (let j = 0; j < validators.length; j++) {
        const errCode = validators[j](
          resultFieldValueIsSet ? resultFieldValue : value,
          data,
          ruleOutput
        );

        // Taken before the error check: the next rule gets an empty array
        const hasOutput = ruleOutput.length !== 0;
        const output = hasOutput ? takeOutput(ruleOutput) : undefined;

        if (errCode) {
          if (errors === null) errors = {};
          errors[fieldName] = errCode;
          break;
        } else if (hasOutput) {
          resultFieldValue = output;
          resultFieldValueIsSet = true;
        } else if (!resultFieldValueIsSet && hasOwn.call(data, fieldName)) {
          resultFieldValue = value;
          resultFieldValueIsSet = true;
        }
      }

      if (resultFieldValueIsSet) {
        result[fieldName] = resultFieldValue;
      }
    }

    if (errors === null) {
      this.errors = null;
      return result;
    } else {
      this.errors = errors;
      return false;
    }
  }

  // All rules of a field as one rule function: (value, allValues, outputArr) => errorCode.
  // The rules run like in validate(): in order, each gets the output of the previous one.
  // Like any rule, it pushes the output value to outputArr only when the rules change the value,
  // so a missing value stays missing. Meta rules and aliases build it once and validate every
  // value without the result and errors objects of validate().
  getFieldRule(fieldName) {
    const validators = this._getFieldValidators(fieldName);

    return (value, allValues, outputArr) => {
      // A field without rules is not in the output of validate()
      if (validators.length === 0) {
        outputArr.push(undefined);
        return;
      }

      let output = value;
      let isChanged = false;

      // allValues come from the caller as they are, usually already trimmed data
      if (this.options.autoTrim) {
        output = this._autoTrim(value);
        isChanged = output !== value;
      }

      const ruleOutput = [];

      for (let j = 0; j < validators.length; j++) {
        const errCode = validators[j](output, allValues, ruleOutput);
        if (errCode) return errCode;

        if (ruleOutput.length !== 0) {
          output = takeOutput(ruleOutput);
          isChanged = true;
        }
      }

      if (isChanged) outputArr.push(output);
    };
  }

  getErrors() {
    return this.errors;
  }
}

Validator._initDefaultRules();

module.exports = Validator;
