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

            return (value, undefined, outputArr) => {
                const errCode = validator._validateSingleField({ value }, 'value');

                if (errCode) {
                    return errorCode || errCode;
                } else {
                    outputArr.push(validator._singleFieldOutput);
                    return;
                }
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

        const fieldNames = this._fieldNames;
        const fieldValidators = this._fieldValidators;
        const result = {};
        let errors = null;

        for (let i = 0; i < fieldNames.length; i++) {
            const fieldName = fieldNames[i];
            const validators = fieldValidators[i];

            const value = data[fieldName];
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

    // Fast path for meta rules and aliases: same outcome as validate(data) for a validator
    // whose schema has the single field `fieldName`, without building result and errors objects.
    // Returns the error code, or undefined and stores the output value in this._singleFieldOutput.
    _validateSingleField(data, fieldName) {
        if (!this.isPrepared) this.prepare();

        if (this.options.autoTrim) {
            data = this._autoTrim(data);
        }

        const validators = this.validators[fieldName];

        // A field without rules is not copied to the output
        let output = validators.length ? data[fieldName] : undefined;

        for (let j = 0; j < validators.length; j++) {
            const updatedFieldValueArr = [];
            const errCode = validators[j](output, data, updatedFieldValueArr);

            if (errCode) return errCode;
            if (updatedFieldValueArr.length) output = updatedFieldValueArr[0];
        }

        this._singleFieldOutput = output;
        return;
    }

    getErrors() {
        return this.errors;
    }
}

Validator._initDefaultRules();

module.exports = Validator;
