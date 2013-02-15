(function(root) {
    var LIVR = { rules : {} };
    module.exports = LIVR; //export

    LIVR.rules.common = {
        required: function() {
            return function(value) {
                if (value === null || value === undefined || value === '') {
                    return 'REQUIRED';
                }

                return;
            };
        },
        not_empty: function() {
            return function(value) {
                if (value !== null && value !== undefined && value === '') {
                    return 'CANNOT_BE_EMPTY';
                }

                return;
            };
        }
    };

    LIVR.rules.string = {
        one_of: function(allowed_values) {
            return function(value) {
                if (value === undefined || value === null || value === '' ) return;

                for (var i=0; i<allowed_values.length; i++) {
                    if ( value == allowed_values[i] ) {
                        return;    
                    }
                }

                return 'NOT_ALLOWED_VALUE';
            };
        },

        max_length: function(max_length) {
            return function(value) {
                if (value === undefined || value === null || value === '' ) return;

                if ( value.length > max_length ) return 'TOO_LONG';
                return;
            };
        },

        min_length: function(min_length) {
            return function(value) {
                if (value === undefined || value === null || value === '' ) return;

                if ( value.length < min_length ) return 'TOO_SHORT';
                return;
            }
        },

        length_equal: function(length) {
            return function(value) {
                if (value === undefined || value === null || value === '' ) return;

                if ( value.length < length ) return 'TOO_SHORT';
                if ( value.length > length ) return 'TOO_LONG';
                return;
            }
        },

        length_between: function(min_length, max_length) {
            return function(value) {
                if (value === undefined || value === null || value === '' ) return;

                if ( value.length < min_length ) return 'TOO_SHORT';
                if ( value.length > max_length ) return 'TOO_LONG';
                return;
            }
        },            

        like: function(re) {
            return function(value) {
                if (value === undefined || value === null || value === '' ) return;

                if ( !value.match(re) ) return 'WRONG_FORMAT';
                return;
            }
        }
    };

    LIVR.rules.numeric = {
        integer: function() {
            return function(value) {
                if (value === undefined || value === null || value === '' ) return;

                return 'NOT_INTEGER';
            };
        },
        positive_integer: function() {
            return function(value) {

            };
        },
        decimal: function() {
            return function(value) {

            }
        },
        positive_decimal: function() {
            return function(value) {

            }
        },
        max_number: function() {
            return function(value) {

            }
        },            
        min_number: function() {
            return function(value) {

            }
        },            
        number_between: function() {
            return function(value) {

            }
        },            
    };

    LIVR.rules.special = {
        email: function() {
            return function(value) {

            };
        },
        equal_to_field: function() {
            return function(value) {

            };
        }
    };

    LIVR.rules.helper = {
        nested_object: function() {
            return function(value) {

            };
        },
        list_of: function() {
            return function(value) {

            };
        },
        list_of_objects: function() {
            return function(value) {

            };
        },
        list_of_different_objects: function() {
            return function(value) {

            };
        }
    };

    var DEFAULT_RULES = {
        required:         LIVR.rules.common.required,
        not_empty:        LIVR.rules.common.not_empty,

        one_of:           LIVR.rules.string.one_of, 
        max_length:       LIVR.rules.string.max_length, 
        min_length:       LIVR.rules.string.min_length, 
        length_equal:     LIVR.rules.string.length_equal, 
        length_between:   LIVR.rules.string.length_between, 
        like:             LIVR.rules.string.like,

        integer:          LIVR.rules.numeric.integer, 
        positive_integer: LIVR.rules.numeric.positive_integer, 
        decimal:          LIVR.rules.numeric.decimal, 
        positive_decimal: LIVR.rules.numeric.positive_decimal, 
        max_number:       LIVR.rules.numeric.max_number, 
        min_number:       LIVR.rules.numeric.min_number, 
        number_between:   LIVR.rules.numeric.number_between,  

        email:            LIVR.rules.special.email,
        equal_to_field:   LIVR.rules.special.equal_to_field,

        nested_object:    LIVR.rules.helper.nested_object,
        list_of:          LIVR.rules.helper.list_of,
        list_of_objects:  LIVR.rules.helper.list_of_objects,
        list_of_different_objects: LIVR.rules.helper.list_of_different_objects
    };

    var IS_DEFAULT_AUTO_TRIM = 0;

    LIVR.Validator = function(livr_rules, is_auto_trim) {
        this.is_prepared = false;
        this.livr_rules  = livr_rules;
        this.validators  = {};
        this.validator_builders = {};
        this.errors = null;

        if ( is_auto_trim !== null && is_auto_trim !== undefined ) {
            this.is_auto_trim = is_auto_trim;
        } else {
            this.is_auto_trim = IS_DEFAULT_AUTO_TRIM;
        }

        this.register_rules(DEFAULT_RULES);

    }

    LIVR.Validator.prototype = {
        prepare: function() {
            var all_rules = this.livr_rules;

            for (var field in all_rules) {
                var field_rules = all_rules[field];

                if ( !Array.isArray(field_rules) ) {
                    field_rules = [field_rules];
                }

                var validators = [];

                for (var i=0; i<field_rules.length; i++) {
                    var parsed = this._parse_rule(field_rules[i]);
                    validators.push( this._build_validator(parsed.name, parsed.args) );
                }

                this.validators[field] = validators;
            }

            this.is_prepared = true;
            return this;
        },

        validate: function(data) {
            if (!this.is_prepared) this.prepare();

            if (! is_object(data) ) {
                this.errors = 'FORMAT_ERROR';
            }

            var errors = {}, result = {};

            for (var field_name in this.validators) {
                var validators = this.validators[field_name];
                if (!validators || !validators.length) continue;

                var value = data[field_name]
                var is_ok = 1;
                var field_result;

                for (var i=0; i<validators.length; i++) {
                    field_result = [];

                    var err_code = validators[i](value, data, field_result);

                    if (err_code) {
                        errors[field_name] = err_code;
                        is_ok = 0;
                        break;
                    }
                }

                if ( is_ok && data.hasOwnProperty(field_name) ) {
                    if (field_result.length) {
                        result[field_name] = field_result[0];
                    }else {
                        result[field_name] = value;
                    }
                }
            }

            if (is_empty(errors)) {
                this.errors = null;
                return result;
            }
            else {
                this.errors = errors;
                return false;
            }

        },

        get_errors: function() {
            return this.errors;
        },

        register_rules: function(rules) {
            for (var rule_name in rules) {
                this.validator_builders[rule_name] = rules[rule_name];
            }
        },

        get_rules: function() {
            return this.validator_builders;
        },

        _parse_rule: function(livr_rule) {
            var name, args;

            if ( is_object(livr_rule) ) {
                name = Object.keys(livr_rule)[0];
                args = livr_rule[ name ];

                if ( ! Array.isArray(args) ) args = [args];
            } else {
                name = livr_rule;
                args = [];
            }
         
            return {name: name, args: args};
        },

        _build_validator: function(name, args)  {
        
            if ( !this.validator_builders[name] ) {
                throw "Rule [" + name + "] not registered";
            }

            var all_args = [];

            all_args.push.apply(all_args, args);
            all_args.push( this.get_rules() );

            return this.validator_builders[name].apply(this.validator_builders, all_args);

        }
    };


    function is_object(obj) { 
        // TODO make better checking
        return obj === Object(obj);
    }

    function is_empty(map) {
        for(var key in map) {
            if (map.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
})(module.exports);