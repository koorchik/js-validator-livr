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
// a rule returns a promise. On success pushes the output value to outputArr if it was changed.
function runFieldRules(validators, start, value, allValues, outputArr, isChanged) {
    let output = value;

    for (let j = start; j < validators.length; j++) {
        const fieldResultArr = [];
        const errCode = validators[j](output, allValues, fieldResultArr);

        if (util.isThenable(errCode)) {
            // Promise.resolve() also adopts thenables whose then() returns nothing
            return Promise.resolve(errCode).then(asyncErrCode => {
                if (asyncErrCode) return asyncErrCode;

                const hasOutput = fieldResultArr.length !== 0;
                const nextValue = hasOutput ? fieldResultArr[0] : output;
                const nextIsChanged = isChanged || hasOutput;
                return runFieldRules(validators, j + 1, nextValue, allValues, outputArr, nextIsChanged);
            });
        }

        if (errCode) return errCode;

        if (fieldResultArr.length) {
            output = fieldResultArr[0];
            isChanged = true;
        }
    }

    if (isChanged) outputArr.push(output);
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

            // Stays synchronous while the rules return plain values. An exception of a rule
            // is the error of the alias, like in nested_object
            return (value, params, outputArr) => {
                let errCode;

                try {
                    errCode = validateValue(value, { value }, outputArr);
                } catch (error) {
                    return errorCode || error;
                }

                if (util.isThenable(errCode)) {
                    return Promise.resolve(errCode).then(
                        asyncErrCode => (asyncErrCode ? errorCode || asyncErrCode : undefined),
                        error => errorCode || error
                    );
                }

                if (errCode) return errorCode || errCode;
            };
        };
    }

    async validate(data) {
        if (!this.isPrepared) this.prepare();

        if (!util.isObject(data)) {
            this.errors = 'FORMAT_ERROR';
            throw 'FORMAT_ERROR';
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

        // Rules that returned plain values cost no await
        if (pending) await Promise.all(pending);

        if (util.isEmptyObject(errors)) {
            this.errors = null;
            return result;
        }

        this.errors = errors;
        throw errors;
    }

    // All rules of a field as one rule function: (value, allValues, outputArr) => errorCode.
    // The rules run like in validate(): in order, each gets the output of the previous one.
    // Returns the error code, or a promise of it only once some rule returns a promise.
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

            // allValues come from the caller as they are, usually already trimmed data
            const output = this.options.autoTrim ? this._autoTrim(value) : value;
            return runFieldRules(validators, 0, output, allValues, outputArr, output !== value);
        };
    }

    // Runs rule #0 of every field, then rule #1 of every field, and so on. This is the order in
    // which awaiting every rule applied synchronous rules, so keys of result and errors keep their
    // order. A field whose rule returns a promise continues asynchronously.
    // Returns null when all fields are done, otherwise an array of promises.
    _validateFields(data, result, errors) {
        // this.validators may be filled or changed by a subclass, so it is read on every call.
        // Fields that run their next rule, one after another: name, rules, value
        let activeFields = [];

        for (const fieldName in this.validators) {
            const validators = this.validators[fieldName];
            if (validators && validators.length) {
                activeFields.push(fieldName, validators, undefined);
            }
        }

        let pending = null;

        try {
            for (let ruleIndex = 0; activeFields.length; ruleIndex++) {
                const nextActiveFields = [];

                for (let k = 0; k < activeFields.length; k += 3) {
                    const fieldName = activeFields[k];
                    const validators = activeFields[k + 1];
                    const value =
                        ruleIndex === 0 ? util.getFieldValue(data, fieldName) : activeFields[k + 2];

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
                                fieldName,
                                validators,
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
                        nextActiveFields.push(fieldName, validators, value);
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
    async _continueField(
        promise,
        resultArr,
        ruleIndex,
        fieldName,
        validators,
        value,
        data,
        result,
        errors
    ) {
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

            if (applyRuleResult(fieldName, errCode, fieldResultArr, value, data, result, errors)) {
                break;
            }
        }
    }
}

AsyncValidator._initDefaultRules();

module.exports = AsyncValidator;
