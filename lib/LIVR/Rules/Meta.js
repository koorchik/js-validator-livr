const Validator = require('../Validator');
const util = require('../util');

module.exports = {
    nested_object(livr, ruleBuilders) {
        const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return (nestedObject, params, outputArr) => {
            if ( util.isNoValue(nestedObject) ) return;
            if ( !util.isObject(nestedObject) ) return 'FORMAT_ERROR';

            const result = validator.validate( nestedObject );

            if ( result ) {
                outputArr.push(result);
                return;
            } else {
                return validator.getErrors();
            }
        };
    },

    variable_object(selectorField, livrs, ruleBuilders) {
        const validators = {};

        for (const selectorValue in livrs) {
            const validator = new Validator(livrs[selectorValue]).registerRules(ruleBuilders).prepare();
            validators[selectorValue] = validator;
        }

        return (object, params, outputArr) => {
            if ( util.isNoValue(object) ) return;

            if ( !util.isObject(object) || !object[selectorField] || !validators[ object[selectorField] ] ) {
                return 'FORMAT_ERROR';
            }

            const validator = validators[ object[selectorField] ];
            const result = validator.validate( object );

            if ( result ) {
                outputArr.push(result);
                return;
            } else {
                return validator.getErrors();
            }
        };
    },

    list_of(rules, ruleBuilders) {
        if (! Array.isArray(rules) ) {
            rules = Array.prototype.slice.call(arguments);
            ruleBuilders = rules.pop();
        }

        const livr = { field: rules };
        const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return (values, params, outputArr) => {
            if ( util.isNoValue(values) ) return;

            if ( ! Array.isArray(values) ) return 'FORMAT_ERROR';

            const results   = [];
            const errors    = [];
            let hasErrors = false;

            for ( let i=0; i<values.length; i++ ) {
                const result = validator.validate( { field: values[i] } );

                if ( result ) {
                    results.push(result.field);
                    errors.push(null);
                } else {
                    hasErrors = true;
                    errors.push( validator.getErrors().field );
                    results.push(null);
                }
            }

            if ( hasErrors ) {
                return errors;
            } else {
                outputArr.push(results);
                return;
            }
        };
    },

    list_of_objects(livr, ruleBuilders) {
        const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return (objects, params, outputArr) => {
            if ( util.isNoValue(objects) ) return;
            if ( ! Array.isArray(objects) ) return 'FORMAT_ERROR';

            const results   = [];
            const errors    = [];
            let hasErrors = false;

            for ( let i=0; i<objects.length; i++ ) {
                const result = validator.validate( objects[i] );

                if ( result ) {
                    results.push(result);
                    errors.push(null);
                } else {
                    hasErrors = true;
                    errors.push( validator.getErrors() );
                    results.push(null);
                }
            }

            if ( hasErrors ) {
                return errors;
            } else {
                outputArr.push(results);
                return;
            }
        };
    },

    list_of_different_objects(selectorField, livrs, ruleBuilders) {
        const validators = {};

        for (const selectorValue in livrs) {
            const validator = new Validator(livrs[selectorValue]).registerRules(ruleBuilders).prepare();
            validators[selectorValue] = validator;
        }

        return (objects, params, outputArr) => {
            if ( util.isNoValue(objects) ) return;
            if ( ! Array.isArray(objects) ) return 'FORMAT_ERROR';

            const results = [];
            const errors  = [];
            let hasErrors = false;

            for ( let i=0; i<objects.length; i++ ) {
                const object = objects[i];

                if ( typeof object != 'object' || !object[selectorField] || !validators[ object[selectorField] ] ) {
                    errors.push('FORMAT_ERROR');
                    continue;
                }

                const validator = validators[ object[selectorField] ];
                const result = validator.validate( object );

                if ( result ) {
                    results.push(result);
                    errors.push(null);
                } else {
                    hasErrors = true;
                    errors.push( validator.getErrors() );
                    results.push(null);
                }
            }

            if ( hasErrors ) {
                return errors;
            } else {
                outputArr.push(results);
                return;
            }
        };
    },

    or() {
        const ruleSets = Array.prototype.slice.call(arguments);
        const ruleBuilders = ruleSets.pop();

        const validators = ruleSets.map(rules => {
            const livr = { field: rules };
            const validator = new Validator(livr).registerRules(ruleBuilders).prepare();

            return validator;
        });

        return (value, params, outputArr) => {
            if ( util.isNoValue(value) ) return;

            let lastError;

            for (let i = 0; i < validators.length; i++) {
                const validator = validators[i];
                const result = validator.validate({ field: value });

                if ( result ) {
                    outputArr.push(result.field);
                    return;
                } else {
                    lastError = validator.getErrors().field;
                }
            }

            if (lastError) {
                return lastError;
            }
        };
    },
};
