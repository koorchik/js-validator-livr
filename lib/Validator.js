'use strict';

const BaseValidator = require('./BaseValidator');
const util = require('./util');

const DEFAULT_RULES = {};
let IS_DEFAULT_AUTO_TRIM = 0;

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

        if (this.isAutoTrim) {
            data = this._autoTrim(data);
        }

        const errors = {};
        const result = {};

        for (const fieldName in this.validators) {
            const validators = this.validators[fieldName];
            if (!validators || !validators.length) continue;

            const value = data[fieldName];

            for (const validator of validators) {
                const fieldResultArr = [];

                const errCode = validator(
                    result.hasOwnProperty(fieldName) ? result[fieldName] : value,
                    data,
                    fieldResultArr
                );

                if (errCode) {
                    errors[fieldName] = errCode;
                    break;
                } else if (fieldResultArr.length) {
                    result[fieldName] = fieldResultArr[0];
                } else if (data.hasOwnProperty(fieldName) && !result.hasOwnProperty(fieldName)) {
                    result[fieldName] = value;
                }
            }
        }

        if (util.isEmptyObject(errors)) {
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

module.exports = Validator;
