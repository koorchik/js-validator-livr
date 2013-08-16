var DEFAULT_RULES = {};
var IS_DEFAULT_AUTO_TRIM = 0;

Validator = function(livr_rules, is_auto_trim) {
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

Validator.register_default_rules = function(rules) {
    for (var rule_name in rules) {
        DEFAULT_RULES[rule_name] = rules[rule_name];
    }
};

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
                } else {
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
        
        return this;
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

    },
    
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

module.exports = Validator;