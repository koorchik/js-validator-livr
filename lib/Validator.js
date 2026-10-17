'use strict';

const BaseValidator = require('./BaseValidator');
const util = require('./util');

const hasOwn = Object.prototype.hasOwnProperty;

class Validator extends BaseValidator {
    constructor(...args) {
        super(...args);
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

        for (const fieldName in validatorsByField) {
            const validators = validatorsByField[fieldName];
            if (!validators || !validators.length) continue;

            const value = util.getFieldValue(data, fieldName);
            let resultFieldValue;
            let resultFieldValueIsSet = false;

            for (let j = 0; j < validators.length; j++) {
                const updatedFieldValueArr = [];

                const errCode = validators[j](
                    resultFieldValueIsSet ? resultFieldValue : value,
                    data,
                    updatedFieldValueArr
                );

                if (errCode) {
                    if (errors === null) errors = {};
                    errors[fieldName] = errCode;
                    break;
                } else if (updatedFieldValueArr.length) {
                    resultFieldValue = updatedFieldValueArr[0];
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
    // On success the output value is pushed to outputArr. Meta rules and aliases build it once
    // and validate every value without the result and errors objects of validate().
    getFieldRule(fieldName) {
        const validators = this._getFieldValidators(fieldName);

        return (value, allValues, outputArr) => {
            // allValues come from the caller as they are, usually already trimmed data
            if (this.options.autoTrim) value = this._autoTrim(value);

            // A field without rules is not in the output of validate()
            let output = validators.length ? value : undefined;

            for (let j = 0; j < validators.length; j++) {
                const updatedFieldValueArr = [];
                const errCode = validators[j](output, allValues, updatedFieldValueArr);

                if (errCode) return errCode;
                if (updatedFieldValueArr.length) output = updatedFieldValueArr[0];
            }

            outputArr.push(output);
        };
    }

    getErrors() {
        return this.errors;
    }
}

Validator._initDefaultRules();

module.exports = Validator;
