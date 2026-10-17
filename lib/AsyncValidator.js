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

// Runs the rules of a field from rule #start. Returns the error code, or a promise of it once
// a rule returns a promise. On success pushes the output value to outputArr.
function runFieldRules(validators, start, value, allValues, outputArr) {
    let output = value;

    for (let j = start; j < validators.length; j++) {
        const fieldResultArr = [];
        const errCode = validators[j](output, allValues, fieldResultArr);

        if (util.isThenable(errCode)) {
            // Promise.resolve() also adopts thenables whose then() returns nothing
            return Promise.resolve(errCode).then(asyncErrCode => {
                if (asyncErrCode) return asyncErrCode;

                const nextValue = fieldResultArr.length ? fieldResultArr[0] : output;
                return runFieldRules(validators, j + 1, nextValue, allValues, outputArr);
            });
        }

        if (errCode) return errCode;
        if (fieldResultArr.length) output = fieldResultArr[0];
    }

    outputArr.push(output);
}

class AsyncValidator extends BaseValidator {
    static buildAliasedRule(rules, errorCode) {
        if (!rules) throw 'Alias rules required';

        const livr = { value: rules };

        return ruleBuilders => {
            // ruleBuilders comes always as a last argument
            // we register them to support custom rules in aliases
            const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();
            const validateValue = validator.getFieldRule('value');

            return async (value, undefined, outputArr) => {
                try {
                    let errCode = validateValue(value, { value }, outputArr);
                    if (util.isThenable(errCode)) errCode = await errCode;

                    if (errCode) return errorCode || errCode;
                } catch (errors) {
                    // Exceptions of rules were rejections of validate({ value })
                    return errorCode || errors.value;
                }
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

    // All rules of a field as one rule function: (value, allValues, outputArr) => errorCode.
    // The rules run like in validate(): in order, each gets the output of the previous one.
    // Returns the error code, or a promise of it only once some rule returns a promise.
    // On success the output value is pushed to outputArr. Meta rules and aliases build it once
    // and validate every value without the result and errors objects of validate().
    getFieldRule(fieldName) {
        const validators = this._getFieldValidators(fieldName);

        return (value, allValues, outputArr) => {
            if (this.options.autoTrim) {
                value = this._autoTrim(value);
                allValues = this._autoTrim(allValues);
            }

            // A field without rules is not in the output of validate()
            const output = validators.length ? value : undefined;
            return runFieldRules(validators, 0, output, allValues, outputArr);
        };
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
