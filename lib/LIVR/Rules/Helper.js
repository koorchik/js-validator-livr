var Validator = require('../Validator');

module.exports = {
    nested_object: function(livr, rule_builders) {
        var validator = new Validator(livr).registerRules(rule_builders).prepare();

        return function(nested_object, params, output_arr) {
            if ( nested_object === undefined || nested_object === null || nested_object === '' ) return;

            if ( typeof nested_object !== 'object' ) return 'FORMAT_ERROR'; //TODO check if hash

            var result = validator.validate( nested_object );
            
            if ( result ) {
                output_arr.push(result);
                return;
            } else {
                return validator.getErrors();
            }
        };
    },

    list_of: function(rules, rule_builders) {
        var livr = { field: rules };
        var validator = new Validator(livr).registerRules(rule_builders).prepare();

        return function(values, params, output_arr) {
            if (values === undefined || values === null || values === '' ) return;

            if ( ! Array.isArray(values) ) return 'FORMAT_ERROR';

            var results = [];
            var errors = [];
            var has_errors = false;

            for ( var i=0; i<values.length; i++ ) {
                var result = validator.validate( { field: values[i] } );

                if ( result ) {
                    results.push(result.field);
                    errors.push(null);
                } else {
                    has_errors = true;
                    errors.push( validator.getErrors().field );
                    results.push(null);
                }
            }

            if ( has_errors ) {
                return errors;
            } else {
                output_arr.push(results);
                return;
            }
        };
    },

    list_of_objects: function(livr, rule_builders) {
        var validator = new Validator(livr).registerRules(rule_builders).prepare();

        return function(objects, params, output_arr) {
            if ( objects === undefined || objects === null || objects === '' ) return;

            if ( ! Array.isArray(objects) ) return 'FORMAT_ERROR';
           
            var results = [];
            var errors = [];
            var has_errors = false;

            for ( var i=0; i<objects.length; i++ ) {
                var result = validator.validate( objects[i] );

                if ( result ) {
                    results.push(result);
                    errors.push(null);
                } else {
                    has_errors = true;
                    errors.push( validator.getErrors() );
                    results.push(null);
                }
            }

            if ( has_errors ) {
                return errors;
            } else {
                output_arr.push(results);
                return;
            }
        };
    },
    
    list_of_different_objects: function() {
        return function(value) {

        };
    }
};
