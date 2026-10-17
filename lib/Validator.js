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
                const result = validator.validate({ value });

                if (result) {
                    outputArr.push(result.value);
                    return;
                } else {
                    return errorCode || validator.getErrors().value;
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

    getErrors() {
        return this.errors;
    }
}

Validator._initDefaultRules();

module.exports = Validator;
