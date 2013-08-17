var DEFAULT_RULES = {};
var IS_DEFAULT_AUTO_TRIM = 0;

Validator = function(livrRules, isAutoTrim) {
    this.isPrepared = false;
    this.livrRules   = livrRules;
    this.validators  = {};
    this.validatorBuilders = {};
    this.errors = null;

    if ( isAutoTrim !== null && isAutoTrim !== undefined ) {
        this.isAutoTrim = isAutoTrim;
    } else {
        this.isAutoTrim = IS_DEFAULT_AUTO_TRIM;
    }

    this.registerRules(DEFAULT_RULES);

}

Validator.registerDefaultRules = function(rules) {
    for (var ruleName in rules) {
        DEFAULT_RULES[ruleName] = rules[ruleName];
    }
};

Validator.prototype = {
    prepare: function() {
        var allRules = this.livrRules;

        for (var field in allRules) {
            var fieldRules = allRules[field];

            if ( !Array.isArray(fieldRules) ) {
                fieldRules = [fieldRules];
            }

            var validators = [];

            for (var i=0; i<fieldRules.length; i++) {
                var parsed = this._parseRule(fieldRules[i]);
                validators.push( this._buildValidator(parsed.name, parsed.args) );
            }

            this.validators[field] = validators;
        }

        this.isPrepared = true;
        return this;
    },

    validate: function(data) {
        if (!this.isPrepared) this.prepare();

        if (! isObject(data) ) {
            this.errors = 'FORMAT_ERROR';
            return;
        }

        var errors = {}, result = {};

        for (var fieldName in this.validators) {
            var validators = this.validators[fieldName];
            if (!validators || !validators.length) continue;

            var value = data[fieldName]
            var isOk = 1;
            var fieldResultArr;

            for (var i=0; i<validators.length; i++) {
                fieldResultArr = [];

                var errCode = validators[i](value, data, fieldResultArr);

                if (errCode) {
                    errors[fieldName] = errCode;
                    isOk = 0;
                    break;
                }
            }

            if ( isOk && data.hasOwnProperty(fieldName) ) {
                if (fieldResultArr.length) {
                    result[fieldName] = fieldResultArr[0];
                } else {
                    result[fieldName] = value;
                }
            }
        }

        if (isEmpty(errors)) {
            this.errors = null;
            return result;
        }
        else {
            this.errors = errors;
            return false;
        }

    },

    getErrors: function() {
        return this.errors;
    },

    registerRules: function(rules) {
        for (var ruleName in rules) {
            this.validatorBuilders[ruleName] = rules[ruleName];
        }
        
        return this;
    },
    
    getRules: function() {
        return this.validatorBuilders;
    },

    _parseRule: function(livrRule) {
        var name, args;

        if ( isObject(livrRule) ) {
            name = Object.keys(livrRule)[0];
            args = livrRule[ name ];

            if ( ! Array.isArray(args) ) args = [args];
        } else {
            name = livrRule;
            args = [];
        }
     
        return {name: name, args: args};
    },

    _buildValidator: function(name, args)  {
    
        if ( !this.validatorBuilders[name] ) {
            throw "Rule [" + name + "] not registered";
        }

        var allArgs = [];

        allArgs.push.apply(allArgs, args);
        allArgs.push( this.getRules() );

        return this.validatorBuilders[name].apply(this.validatorBuilders, allArgs);

    },
    
};


function isObject(obj) { 
    // TODO make better checking
    return obj === Object(obj);
}

function isEmpty(map) {
    for(var key in map) {
        if (map.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

module.exports = Validator;