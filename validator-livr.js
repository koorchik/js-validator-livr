(function(root) {
    var COMMON_RULES = {
        required: function() {
            return function(value) {

            };
        },
        not_empty: function() {
            return function(value) {

            };
        }
    };

    var STRING_RULES = {
        one_of: function() {
            return function(value) {
                if (value === undefined || value === null || value === '' ) return;

                return 'NOT_INTEGER';
            };
        },
        max_length: function() {
            return function(value) {

            };
        },
        min_length: function() {
            return function(value) {

            }
        },
        length_equal: function() {
            return function(value) {

            }
        },
        length_brrtween: function() {
            return function(value) {

            }
        },            
        like: function() {
            return function(value) {

            }
        }
    };

    var NUMERIC_RULES = {
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

    var SPECIAL_RULES = {
        email: function() {
            return function(value) {

            };
        },
        equal_to_field: function() {
            return function(value) {

            };
        }
    };

    var HELPER_RULES = {
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

    var IS_DEFAULT_AUTO_TRIM = 0;

    function Validator(livr_rules, is_auto_trim) {
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
    }

    Validator.prototype = {
        prepare: function() {
            var all_rules = this.livr_rules;

            for (var field in all_rules) {
                var field_rules = all_rules[field];

                if ( !Array.isArray(field_rules) ) {
                    field_rules = [field_rules];
                }

                var validators = [];

                for (var i=0; i<field_rules.length; i++) {
                    var parsed = this._parse_rule(field_rules[i])
                    validators.push( this._build_validator(parsed.name, parsed.args) );
                }

                this.validators[field] = validators;
            }

            this.is_prepared = true;
            return this;
        },

        _parse_rule: function(livr_rule) {
            var name, args;

            if ( isPlainObject(livr_rule) ) {
                name = livr_rule[ Object.keys(livr_rule)[0] ];
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


            return this.validator_builders[name].apply(all_args);

        }
    };


     function isPlainObject( obj ) {
      // Must be an Object.
      // Because of IE, we also have to check the presence of the constructor property.
      // Make sure that DOM nodes and window objects don't pass through, as well
      if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType ) {
         return false;
      }
      
      // Not own constructor property must be Object
      if ( obj.constructor &&
         !hasOwn.call(obj, "constructor") &&
         !hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
         return false;
      }
      
      // Own properties are enumerated firstly, so to speed up,
      // if last one is own, then all properties are own.
   
      var key;
      for ( key in obj ) {}
      
      return key === undefined || hasOwn.call( obj, key );
   };
})(window || module.exports);