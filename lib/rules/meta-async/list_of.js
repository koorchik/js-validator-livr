const AsyncValidator = require('../../AsyncValidator');
const util = require('../../util');

function list_of(rules, ruleBuilders) {
    if (!Array.isArray(rules)) {
        rules = Array.prototype.slice.call(arguments);
        ruleBuilders = rules.pop();
    }

    const livr = { field: rules };
    const validator = new AsyncValidator(livr).registerRules(ruleBuilders).prepare();
    const validateItem = validator.getFieldRule('field');

    return (values, params, outputArr) => {
        if (util.isNoValue(values)) return;

        if (!Array.isArray(values)) return 'FORMAT_ERROR';

        const state = { results: [], errors: [], hasErrors: false };
        return validateItems(validateItem, values, 0, state, outputArr);
    };
}

// Validates the items from #start. Stays synchronous while the item rules return plain values,
// and returns a promise only once some item rule returns one.
function validateItems(validateItem, values, start, state, outputArr) {
    for (let i = start; i < values.length; i++) {
        let errCode;

        try {
            // Rules of an item see it as the only field of the data, like in validate().
            // The output of a valid item is pushed to results
            errCode = validateItem(values[i], { field: values[i] }, state.results);
        } catch (error) {
            addItemError(state, error);
            continue;
        }

        if (util.isThenable(errCode)) {
            return Promise.resolve(errCode).then(
                asyncErrCode => {
                    addItemOutcome(state, asyncErrCode);
                    return validateItems(validateItem, values, i + 1, state, outputArr);
                },
                error => {
                    addItemError(state, error);
                    return validateItems(validateItem, values, i + 1, state, outputArr);
                }
            );
        }

        addItemOutcome(state, errCode);
    }

    if (state.hasErrors) return state.errors;

    outputArr.push(state.results);
    return;
}

function addItemOutcome(state, errCode) {
    if (errCode) {
        addItemError(state, errCode);
    } else {
        state.errors.push(null);
    }
}

// Also for exceptions of rules: an exception is the error of the item, like in list_of_objects
function addItemError(state, errCode) {
    state.hasErrors = true;
    state.errors.push(errCode);
    state.results.push(null);
}

module.exports = list_of;
