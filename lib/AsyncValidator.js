'use strict';

const util = require('./util');
const BaseValidator = require('./BaseValidator');

const hasOwn = Object.prototype.hasOwnProperty;

// Applies a rule outcome to result and errors. Returns true when the field failed.
function applyRuleResult(fieldName, errCode, fieldResultArr, value, data, result, errors) {
    if (errCode) {
        errors[fieldName] = errCode;
        return true;
    } else if (fieldResultArr.length) {
        result[fieldName] = fieldResultArr[0];
    } else if (hasOwn.call(data, fieldName) && !hasOwn.call(result, fieldName)) {
        result[fieldName] = value;
    }

    return false;
}

class AsyncValidator extends BaseValidator {
    static buildAliasedRule(rules, errorCode) {
        if (!rules) throw 'Alias rules required';

        const livr = { value: rules };

        return ruleBuilders => {
            // ruleBuilders comes always as a last argument
            // we register them to support custom rules in aliases
            const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();

            return async (value, undefined, outputArr) => {
                let outcome = validator._validateOutcome({ value });
                if (util.isThenable(outcome)) outcome = await outcome;

                if (!outcome.result) return errorCode || outcome.errors.value;

                outputArr.push(outcome.result.value);
                return;
            };
        };
    }

    async validate(data) {
        let outcome = this._validateMaybeSync(data);
        if (util.isThenable(outcome)) outcome = await outcome;

        if (!outcome.result) return Promise.reject(outcome.errors);
        return outcome.result;
    }

    // Same as validate(), but stays synchronous while rules return plain values.
    // Returns { result } or { errors }, or a promise of it once some rule returns a promise.
    // Exceptions thrown by rules are not caught.
    _validateMaybeSync(data) {
        if (!this.isPrepared) this.prepare();

        if (!util.isObject(data)) {
            this.errors = 'FORMAT_ERROR';
            return { errors: 'FORMAT_ERROR' };
        }

        if (this.options.autoTrim) {
            data = this._autoTrim(data);
        }

        const errors = {};
        const result = {};

        // A subclass may override validateField(), keep calling it then
        const pending =
            this.validateField === AsyncValidator.prototype.validateField
                ? this._validateFields(data, result, errors)
                : Object.keys(this.validators).map(fieldName =>
                      this.validateField(fieldName, data, result, errors)
                  );

        if (!pending) return this._buildOutcome(result, errors);

        return Promise.all(pending).then(() => this._buildOutcome(result, errors));
    }

    // For meta rules and aliases: same as _validateMaybeSync(), but an exception thrown by a rule
    // is returned as { errors }, the way validate() rejects with it
    _validateOutcome(data) {
        let outcome;
        try {
            outcome = this._validateMaybeSync(data);
        } catch (errors) {
            return { errors };
        }

        if (util.isThenable(outcome)) return outcome.catch(errors => ({ errors }));
        return outcome;
    }

    _buildOutcome(result, errors) {
        if (util.isEmptyObject(errors)) {
            this.errors = null;
            return { result };
        } else {
            this.errors = errors;
            return { errors };
        }
    }

    // Runs rule #0 of every field, then rule #1 of every field, and so on. This is the order in
    // which awaiting every rule applied synchronous rules, so keys of result and errors keep their
    // order. A field whose rule returns a promise continues asynchronously.
    // Returns null when all fields are done, otherwise an array of promises.
    _validateFields(data, result, errors) {
        const fieldNames = this._fieldNames;
        const fieldValidators = this._fieldValidators;
        const values = new Array(fieldNames.length);
        let pending = null;
        let activeFields = [];

        for (let i = 0; i < fieldNames.length; i++) activeFields.push(i);

        try {
            for (let ruleIndex = 0; activeFields.length; ruleIndex++) {
                const nextActiveFields = [];

                for (let k = 0; k < activeFields.length; k++) {
                    const i = activeFields[k];
                    const fieldName = fieldNames[i];
                    const validators = fieldValidators[i];

                    if (ruleIndex === 0) values[i] = util.getFieldValue(data, fieldName);
                    const value = values[i];

                    const fieldResultArr = [];
                    const errCode = validators[ruleIndex](
                        hasOwn.call(result, fieldName) ? result[fieldName] : value,
                        data,
                        fieldResultArr
                    );

                    if (util.isThenable(errCode)) {
                        if (!pending) pending = [];
                        pending.push(
                            this._continueField(
                                errCode,
                                fieldResultArr,
                                ruleIndex,
                                i,
                                value,
                                data,
                                result,
                                errors
                            )
                        );
                        continue;
                    }

                    const isFailed = applyRuleResult(
                        fieldName,
                        errCode,
                        fieldResultArr,
                        value,
                        data,
                        result,
                        errors
                    );

                    if (!isFailed && ruleIndex + 1 < validators.length) {
                        nextActiveFields.push(i);
                    }
                }

                activeFields = nextActiveFields;
            }
        } catch (error) {
            // A rule threw: validation rejects with this error and does not wait for the fields
            // that went async. Their later rejections must not become unhandled ones
            if (pending) for (const promise of pending) promise.catch(() => {});
            throw error;
        }

        return pending;
    }

    // Finishes a field whose rule #ruleIndex returned a promise
    async _continueField(promise, resultArr, ruleIndex, fieldIndex, value, data, result, errors) {
        const fieldName = this._fieldNames[fieldIndex];
        const validators = this._fieldValidators[fieldIndex];

        let errCode = await promise;
        let fieldResultArr = resultArr;

        for (let j = ruleIndex + 1; ; j++) {
            if (applyRuleResult(fieldName, errCode, fieldResultArr, value, data, result, errors)) {
                return;
            }

            if (j >= validators.length) return;

            fieldResultArr = [];
            errCode = validators[j](
                hasOwn.call(result, fieldName) ? result[fieldName] : value,
                data,
                fieldResultArr
            );

            if (util.isThenable(errCode)) errCode = await errCode;
        }
    }

    async validateField(fieldName, data, result, errors) {
        const validators = this.validators[fieldName];
        if (!validators || !validators.length) return;

        const value = util.getFieldValue(data, fieldName);

        for (const validator of validators) {
            const fieldResultArr = [];

            const errCode = await validator(
                hasOwn.call(result, fieldName) ? result[fieldName] : value,
                data,
                fieldResultArr
            );

            if (errCode) {
                errors[fieldName] = errCode;
                break;
            } else if (fieldResultArr.length) {
                result[fieldName] = fieldResultArr[0];
            } else if (hasOwn.call(data, fieldName) && !hasOwn.call(result, fieldName)) {
                result[fieldName] = value;
            }
        }
    }
}

AsyncValidator._initDefaultRules();

module.exports = AsyncValidator;
