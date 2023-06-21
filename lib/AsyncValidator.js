'use strict';

const util = require('./util');
const BaseValidator = require('./BaseValidator');

class AsyncValidator extends BaseValidator {
    static buildAliasedRule(rules, errorCode) {
        if (!rules) throw 'Alias rules required';

        const livr = { value: rules };

        return ruleBuilders => {
            // ruleBuilders comes always as a last argument
            // we register them to support custom rules in aliases
            const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

            return async (value, undefined, outputArr) => {
                try {
                    const result = await validator.validate({ value });    
                    outputArr.push(result.value);
                    return;
                } catch (errors) {
                    return errorCode || errors.value;
                }
            };
        };
    }

    async validate(data) {
        if (!this.isPrepared) this.prepare();

        if (!util.isObject(data)) {
            this.errors = 'FORMAT_ERROR';
            return Promise.reject('FORMAT_ERROR');
        }

        if (this.options.autoTrim) {
            data = this._autoTrim(data);
        }

        const errors = {};
        const result = {};

        await Promise.all(
            Object.keys(this.validators).map(
                fieldName => this.validateField(fieldName, data, result, errors)
            )
        );

        if (util.isEmptyObject(errors)) {
            this.errors = null;
            return result;
        } else {
            this.errors = errors;
            return Promise.reject(errors);
        }
    }

    async validateField(fieldName, data, result, errors) {
        const validators = this.validators[fieldName];
        if (!validators || !validators.length) return;

        const value = data[fieldName];

        for (const validator of validators) {
            const fieldResultArr = [];

            const errCode = await validator(
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

}

module.exports = AsyncValidator;
