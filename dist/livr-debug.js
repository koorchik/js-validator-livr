;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var LIVR = {rules: {}};

LIVR.rules.common  = require('./LIVR/Rules/Common');
LIVR.rules.string  = require('./LIVR/Rules/String');
LIVR.rules.numeric = require('./LIVR/Rules/Numeric');
LIVR.rules.special = require('./LIVR/Rules/Special');
LIVR.rules.helper  = require('./LIVR/Rules/Helper');
LIVR.rules.filters = require('./LIVR/Rules/Filters');


LIVR.Validator = require('./LIVR/Validator');

LIVR.Validator.registerDefaultRules({
    required:         LIVR.rules.common.required,
    not_empty:        LIVR.rules.common.not_empty,
    not_empty_list:   LIVR.rules.common.not_empty_list,

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
    list_of_different_objects: LIVR.rules.helper.list_of_different_objects,

    trim:             LIVR.rules.filters.trim,
    to_lc:            LIVR.rules.filters.to_lc,
    to_uc:            LIVR.rules.filters.to_uc
});

module.exports = LIVR;

},{"./LIVR/Rules/Common":2,"./LIVR/Rules/Filters":3,"./LIVR/Rules/Helper":4,"./LIVR/Rules/Numeric":5,"./LIVR/Rules/Special":6,"./LIVR/Rules/String":7,"./LIVR/Validator":8}],2:[function(require,module,exports){
module.exports = {
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
    },
    not_empty_list: function() {
        return function(list) {
            if (list === undefined || list === '') return 'CANNOT_BE_EMPTY';
            if (! Array.isArray(list) ) return 'WRONG_FORMAT';
            if (list.length < 1) return 'CANNOT_BE_EMPTY';
            return;
        };
    },
};

},{}],3:[function(require,module,exports){
module.exports = {
    trim: function() {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just do not trim numbers
            outputArr.push( value.replace(/^\s*/, '').replace(/\s*$/, '') );
        };
    },
    to_lc: function(field) {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skup numbers
            outputArr.push( value.toLowerCase() );
        };
    },
    to_uc: function(field) {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skup numbers
            outputArr.push( value.toUpperCase() );
        };
    }
};
},{}],4:[function(require,module,exports){
var Validator = require('../Validator');

module.exports = {
    nested_object: function(livr, ruleBuilders) {
        var validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return function(nestedObject, params, outputArr) {
            if ( nestedObject === undefined || nestedObject === null || nestedObject === '' ) return;

            if ( typeof nestedObject !== 'object' ) return 'FORMAT_ERROR'; //TODO check if hash

            var result = validator.validate( nestedObject );
            
            if ( result ) {
                outputArr.push(result);
                return;
            } else {
                return validator.getErrors();
            }
        };
    },

    list_of: function(rules, ruleBuilders) {
        var livr = { field: rules };
        var validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return function(values, params, outputArr) {
            if (values === undefined || values === null || values === '' ) return;

            if ( ! Array.isArray(values) ) return 'FORMAT_ERROR';

            var results = [];
            var errors = [];
            var hasErrors = false;

            for ( var i=0; i<values.length; i++ ) {
                var result = validator.validate( { field: values[i] } );

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

    list_of_objects: function(livr, ruleBuilders) {
        var validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return function(objects, params, outputArr) {
            if ( objects === undefined || objects === null || objects === '' ) return;

            if ( ! Array.isArray(objects) ) return 'FORMAT_ERROR';
           
            var results = [];
            var errors = [];
            var hasErrors = false;

            for ( var i=0; i<objects.length; i++ ) {
                var result = validator.validate( objects[i] );

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
    
    list_of_different_objects: function(selectorField, livrs, ruleBuilders) {
        var validators = {};

        for (var selectorValue in livrs) {
            var validator = new Validator(livrs[selectorValue]).registerRules(ruleBuilders).prepare();
            validators[selectorValue] = validator;
        }

        return function(objects, params, outputArr) {
            if ( objects === undefined || objects === null || objects === '' ) return;

            if ( ! Array.isArray(objects) ) return 'FORMAT_ERROR';
           
            var results = [];
            var errors = [];
            var hasErrors = false;

            for ( var i=0; i<objects.length; i++ ) {
                var object = objects[i];

                if ( typeof object != 'object' || !object[selectorField] || !validators[ object[selectorField] ] ) {
                    errors.push('FORMAT_ERROR');
                    continue;
                }

                var validator = validators[ object[selectorField] ];
                var result = validator.validate( object );

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
    }
};
},{"../Validator":8}],5:[function(require,module,exports){
module.exports = {
    integer: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( !value.match(/^\-?[0-9]+$/) ) return 'NOT_INTEGER';
            return;
        };
    },
    positive_integer: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            
            value += '';
            if ( ! /^[1-9][0-9]*$/.test(value) ) return 'NOT_POSITIVE_INTEGER';
            return;
        };
    },
    decimal: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( ! /^(?:\-?(?:[0-9]+\.[0-9]+)|(?:[0-9]+))$/.test(value) ) return 'NOT_DECIMAL';
            return;
        };
    },
    positive_decimal: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( ! /^(?:(?:[1-9][0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value) ) return 'NOT_POSITIVE_DECIMAL';
            return;
        };
    },
    max_number: function(maxNumber) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value > maxNumber ) return 'TOO_HIGH';
            return;
        };
    },
    min_number: function(minNumber) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value < minNumber ) return 'TOO_LOW';
            return;

        };
    },
    number_between: function(minNumber, maxNumber) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            if ( value < minNumber ) return 'TOO_LOW';
            if ( value > maxNumber ) return 'TOO_HIGH';
            return;
        };
    },
};


function make_number(value) {
    if ( typeof(value) === "number") {
        return value;
    } else {
        return parseFloat(value);
    }
}
},{}],6:[function(require,module,exports){
module.exports = {
    email: function() {
        var emailRe = new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/);

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( ! emailRe.test(value) ) return 'WRONG_EMAIL';
            if ( /\@.*\@/.test(value) ) return 'WRONG_EMAIL';
            return;
        };
    },
    equal_to_field: function(field) {
        return function(value, params) {
            if (value === undefined || value === null || value === '' ) return;
            
            if ( value != params[field] ) return 'FIELDS_NOT_EQUAL';
            return;
        };
    }
};
},{}],7:[function(require,module,exports){
module.exports =  {
    one_of: function(allowedValues) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            for (var i=0; i<allowedValues.length; i++) {
                if ( value == allowedValues[i] ) {
                    return;    
                }
            }

            return 'NOT_ALLOWED_VALUE';
        };
    },

    max_length: function(maxLength) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( value.length > maxLength ) return 'TOO_LONG';
            return;
        };
    },

    min_length: function(minLength) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            return;
        }
    },

    length_equal: function(length) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( value.length < length ) return 'TOO_SHORT';
            if ( value.length > length ) return 'TOO_LONG';
            return;
        }
    },

    length_between: function(minLength, maxLength) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            if ( value.length > maxLength ) return 'TOO_LONG';
            return;
        }
    },            

    like: function(re) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;

            value += '';
            if ( !value.match(re) ) return 'WRONG_FORMAT';
            return;
        }
    }
};
},{}],8:[function(require,module,exports){
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

Validator.defaultAutoTrim = function(isAutoTrim) {
    IS_DEFAULT_AUTO_TRIM = !!isAutoTrim;
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

        if ( this.isAutoTrim ) {
            data = this._autoTrim(data);    
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

                var errCode = validators[i](
                    result.hasOwnProperty(fieldName) ? result[fieldName] : value, 
                    data, 
                    fieldResultArr
                );

                if (errCode) {
                    errors[fieldName] = errCode;
                    isOk = 0;
                    break;
                } else if ( data.hasOwnProperty(fieldName) ) {
                    if ( fieldResultArr.length ) {
                        result[fieldName] = fieldResultArr[0];
                    } else {
                        result[fieldName] = value;
                    }
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
    
    _autoTrim: function(data) {
        var dataType = typeof data;

        if ( dataType !== 'object' && data ) {
            if (data.replace) {
                return data.replace(/^\s*/, '').replace(/\s*$/, '');
            } else {
                return data;
            }
        } else if ( dataType == 'object' && Array.isArray(data) ) {
            var trimmedData = [];

            for (var i = 0; i < data.length; i++) {
                trimmedData[i] = this._autoTrim( data[i] );
            }

            return trimmedData;
        } else if ( dataType == 'object' && isObject(data) ) {
            var trimmedData = {};

            for (var key in data) {
                if ( data.hasOwnProperty(key) ) {
                    trimmedData[key] = this._autoTrim( data[key] );
                }
            }
            
            return trimmedData;
        }

        return data;
    }
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
},{}],9:[function(require,module,exports){
window.LIVR = require("../lib/LIVR");
},{"../lib/LIVR":1}]},{},[9])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMva29vcmNoaWsvd29yay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL0NvbW1vbi5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL0ZpbHRlcnMuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi9SdWxlcy9IZWxwZXIuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi9SdWxlcy9OdW1lcmljLmpzIiwiL1VzZXJzL2tvb3JjaGlrL3dvcmsvanMtdmFsaWRhdG9yLWxpdnIvbGliL0xJVlIvUnVsZXMvU3BlY2lhbC5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL1N0cmluZy5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1ZhbGlkYXRvci5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2pzLXZhbGlkYXRvci1saXZyL3NjcmlwdHMvYnJvd3NlcmlmeV9lbnRyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUEiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgTElWUiA9IHtydWxlczoge319O1xuXG5MSVZSLnJ1bGVzLmNvbW1vbiAgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvQ29tbW9uJyk7XG5MSVZSLnJ1bGVzLnN0cmluZyAgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvU3RyaW5nJyk7XG5MSVZSLnJ1bGVzLm51bWVyaWMgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvTnVtZXJpYycpO1xuTElWUi5ydWxlcy5zcGVjaWFsID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL1NwZWNpYWwnKTtcbkxJVlIucnVsZXMuaGVscGVyICA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9IZWxwZXInKTtcbkxJVlIucnVsZXMuZmlsdGVycyA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9GaWx0ZXJzJyk7XG5cblxuTElWUi5WYWxpZGF0b3IgPSByZXF1aXJlKCcuL0xJVlIvVmFsaWRhdG9yJyk7XG5cbkxJVlIuVmFsaWRhdG9yLnJlZ2lzdGVyRGVmYXVsdFJ1bGVzKHtcbiAgICByZXF1aXJlZDogICAgICAgICBMSVZSLnJ1bGVzLmNvbW1vbi5yZXF1aXJlZCxcbiAgICBub3RfZW1wdHk6ICAgICAgICBMSVZSLnJ1bGVzLmNvbW1vbi5ub3RfZW1wdHksXG4gICAgbm90X2VtcHR5X2xpc3Q6ICAgTElWUi5ydWxlcy5jb21tb24ubm90X2VtcHR5X2xpc3QsXG5cbiAgICBvbmVfb2Y6ICAgICAgICAgICBMSVZSLnJ1bGVzLnN0cmluZy5vbmVfb2YsXG4gICAgbWF4X2xlbmd0aDogICAgICAgTElWUi5ydWxlcy5zdHJpbmcubWF4X2xlbmd0aCxcbiAgICBtaW5fbGVuZ3RoOiAgICAgICBMSVZSLnJ1bGVzLnN0cmluZy5taW5fbGVuZ3RoLFxuICAgIGxlbmd0aF9lcXVhbDogICAgIExJVlIucnVsZXMuc3RyaW5nLmxlbmd0aF9lcXVhbCxcbiAgICBsZW5ndGhfYmV0d2VlbjogICBMSVZSLnJ1bGVzLnN0cmluZy5sZW5ndGhfYmV0d2VlbixcbiAgICBsaWtlOiAgICAgICAgICAgICBMSVZSLnJ1bGVzLnN0cmluZy5saWtlLFxuXG4gICAgaW50ZWdlcjogICAgICAgICAgTElWUi5ydWxlcy5udW1lcmljLmludGVnZXIsXG4gICAgcG9zaXRpdmVfaW50ZWdlcjogTElWUi5ydWxlcy5udW1lcmljLnBvc2l0aXZlX2ludGVnZXIsXG4gICAgZGVjaW1hbDogICAgICAgICAgTElWUi5ydWxlcy5udW1lcmljLmRlY2ltYWwsXG4gICAgcG9zaXRpdmVfZGVjaW1hbDogTElWUi5ydWxlcy5udW1lcmljLnBvc2l0aXZlX2RlY2ltYWwsXG4gICAgbWF4X251bWJlcjogICAgICAgTElWUi5ydWxlcy5udW1lcmljLm1heF9udW1iZXIsXG4gICAgbWluX251bWJlcjogICAgICAgTElWUi5ydWxlcy5udW1lcmljLm1pbl9udW1iZXIsXG4gICAgbnVtYmVyX2JldHdlZW46ICAgTElWUi5ydWxlcy5udW1lcmljLm51bWJlcl9iZXR3ZWVuLFxuXG4gICAgZW1haWw6ICAgICAgICAgICAgTElWUi5ydWxlcy5zcGVjaWFsLmVtYWlsLFxuICAgIGVxdWFsX3RvX2ZpZWxkOiAgIExJVlIucnVsZXMuc3BlY2lhbC5lcXVhbF90b19maWVsZCxcblxuICAgIG5lc3RlZF9vYmplY3Q6ICAgIExJVlIucnVsZXMuaGVscGVyLm5lc3RlZF9vYmplY3QsXG4gICAgbGlzdF9vZjogICAgICAgICAgTElWUi5ydWxlcy5oZWxwZXIubGlzdF9vZixcbiAgICBsaXN0X29mX29iamVjdHM6ICBMSVZSLnJ1bGVzLmhlbHBlci5saXN0X29mX29iamVjdHMsXG4gICAgbGlzdF9vZl9kaWZmZXJlbnRfb2JqZWN0czogTElWUi5ydWxlcy5oZWxwZXIubGlzdF9vZl9kaWZmZXJlbnRfb2JqZWN0cyxcblxuICAgIHRyaW06ICAgICAgICAgICAgIExJVlIucnVsZXMuZmlsdGVycy50cmltLFxuICAgIHRvX2xjOiAgICAgICAgICAgIExJVlIucnVsZXMuZmlsdGVycy50b19sYyxcbiAgICB0b191YzogICAgICAgICAgICBMSVZSLnJ1bGVzLmZpbHRlcnMudG9fdWNcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExJVlI7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByZXF1aXJlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdSRVFVSVJFRCc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIG5vdF9lbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdDQU5OT1RfQkVfRU1QVFknO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBub3RfZW1wdHlfbGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihsaXN0KSB7XG4gICAgICAgICAgICBpZiAobGlzdCA9PT0gdW5kZWZpbmVkIHx8IGxpc3QgPT09ICcnKSByZXR1cm4gJ0NBTk5PVF9CRV9FTVBUWSc7XG4gICAgICAgICAgICBpZiAoISBBcnJheS5pc0FycmF5KGxpc3QpICkgcmV0dXJuICdXUk9OR19GT1JNQVQnO1xuICAgICAgICAgICAgaWYgKGxpc3QubGVuZ3RoIDwgMSkgcmV0dXJuICdDQU5OT1RfQkVfRU1QVFknO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdHJpbTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgdW5kZWZpbmVkLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IGRvIG5vdCB0cmltIG51bWJlcnNcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCB2YWx1ZS5yZXBsYWNlKC9eXFxzKi8sICcnKS5yZXBsYWNlKC9cXHMqJC8sICcnKSApO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgdG9fbGM6IGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgdW5kZWZpbmVkLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNrdXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnRvTG93ZXJDYXNlKCkgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHRvX3VjOiBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHVuZGVmaW5lZCwgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7IC8vIFRPRE8ganVzdCBza3VwIG51bWJlcnNcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCB2YWx1ZS50b1VwcGVyQ2FzZSgpICk7XG4gICAgICAgIH07XG4gICAgfVxufTsiLCJ2YXIgVmFsaWRhdG9yID0gcmVxdWlyZSgnLi4vVmFsaWRhdG9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5lc3RlZF9vYmplY3Q6IGZ1bmN0aW9uKGxpdnIsIHJ1bGVCdWlsZGVycykge1xuICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihuZXN0ZWRPYmplY3QsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIG5lc3RlZE9iamVjdCA9PT0gdW5kZWZpbmVkIHx8IG5lc3RlZE9iamVjdCA9PT0gbnVsbCB8fCBuZXN0ZWRPYmplY3QgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBuZXN0ZWRPYmplY3QgIT09ICdvYmplY3QnICkgcmV0dXJuICdGT1JNQVRfRVJST1InOyAvL1RPRE8gY2hlY2sgaWYgaGFzaFxuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsaWRhdG9yLnZhbGlkYXRlKCBuZXN0ZWRPYmplY3QgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWxpZGF0b3IuZ2V0RXJyb3JzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxpc3Rfb2Y6IGZ1bmN0aW9uKHJ1bGVzLCBydWxlQnVpbGRlcnMpIHtcbiAgICAgICAgdmFyIGxpdnIgPSB7IGZpZWxkOiBydWxlcyB9O1xuICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZXMsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAodmFsdWVzID09PSB1bmRlZmluZWQgfHwgdmFsdWVzID09PSBudWxsIHx8IHZhbHVlcyA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KHZhbHVlcykgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICAgICAgICB2YXIgaGFzRXJyb3JzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpPTA7IGk8dmFsdWVzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIHsgZmllbGQ6IHZhbHVlc1tpXSB9ICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdC5maWVsZCk7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCB2YWxpZGF0b3IuZ2V0RXJyb3JzKCkuZmllbGQgKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBoYXNFcnJvcnMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsaXN0X29mX29iamVjdHM6IGZ1bmN0aW9uKGxpdnIsIHJ1bGVCdWlsZGVycykge1xuICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3RzLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCBvYmplY3RzID09PSB1bmRlZmluZWQgfHwgb2JqZWN0cyA9PT0gbnVsbCB8fCBvYmplY3RzID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkob2JqZWN0cykgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG4gICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBoYXNFcnJvcnMgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmplY3RzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIG9iamVjdHNbaV0gKTtcblxuICAgICAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3JzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goIHZhbGlkYXRvci5nZXRFcnJvcnMoKSApO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIGhhc0Vycm9ycyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBcbiAgICBsaXN0X29mX2RpZmZlcmVudF9vYmplY3RzOiBmdW5jdGlvbihzZWxlY3RvckZpZWxkLCBsaXZycywgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3JzID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgc2VsZWN0b3JWYWx1ZSBpbiBsaXZycykge1xuICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cnNbc2VsZWN0b3JWYWx1ZV0pLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG4gICAgICAgICAgICB2YWxpZGF0b3JzW3NlbGVjdG9yVmFsdWVdID0gdmFsaWRhdG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdHMsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIG9iamVjdHMgPT09IHVuZGVmaW5lZCB8fCBvYmplY3RzID09PSBudWxsIHx8IG9iamVjdHMgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheShvYmplY3RzKSApIHJldHVybiAnRk9STUFUX0VSUk9SJztcbiAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhc0Vycm9ycyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPG9iamVjdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9iamVjdCA9IG9iamVjdHNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBvYmplY3QgIT0gJ29iamVjdCcgfHwgIW9iamVjdFtzZWxlY3RvckZpZWxkXSB8fCAhdmFsaWRhdG9yc1sgb2JqZWN0W3NlbGVjdG9yRmllbGRdIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCdGT1JNQVRfRVJST1InKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IHZhbGlkYXRvcnNbIG9iamVjdFtzZWxlY3RvckZpZWxkXSBdO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIG9iamVjdCApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYXNFcnJvcnMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCggdmFsaWRhdG9yLmdldEVycm9ycygpICk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICggaGFzRXJyb3JzICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59OyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGludGVnZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICF2YWx1ZS5tYXRjaCgvXlxcLT9bMC05XSskLykgKSByZXR1cm4gJ05PVF9JTlRFR0VSJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHBvc2l0aXZlX2ludGVnZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgL15bMS05XVswLTldKiQvLnRlc3QodmFsdWUpICkgcmV0dXJuICdOT1RfUE9TSVRJVkVfSU5URUdFUic7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBkZWNpbWFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhIC9eKD86XFwtPyg/OlswLTldK1xcLlswLTldKyl8KD86WzAtOV0rKSkkLy50ZXN0KHZhbHVlKSApIHJldHVybiAnTk9UX0RFQ0lNQUwnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgcG9zaXRpdmVfZGVjaW1hbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggISAvXig/Oig/OlsxLTldWzAtOV0qXFwuWzAtOV0rKXwoPzpbMS05XVswLTldKikpJC8udGVzdCh2YWx1ZSkgKSByZXR1cm4gJ05PVF9QT1NJVElWRV9ERUNJTUFMJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIG1heF9udW1iZXI6IGZ1bmN0aW9uKG1heE51bWJlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCB2YWx1ZSA+IG1heE51bWJlciApIHJldHVybiAnVE9PX0hJR0gnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgbWluX251bWJlcjogZnVuY3Rpb24obWluTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoIHZhbHVlIDwgbWluTnVtYmVyICkgcmV0dXJuICdUT09fTE9XJztcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB9O1xuICAgIH0sXG4gICAgbnVtYmVyX2JldHdlZW46IGZ1bmN0aW9uKG1pbk51bWJlciwgbWF4TnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoIHZhbHVlIDwgbWluTnVtYmVyICkgcmV0dXJuICdUT09fTE9XJztcbiAgICAgICAgICAgIGlmICggdmFsdWUgPiBtYXhOdW1iZXIgKSByZXR1cm4gJ1RPT19ISUdIJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxufTtcblxuXG5mdW5jdGlvbiBtYWtlX251bWJlcih2YWx1ZSkge1xuICAgIGlmICggdHlwZW9mKHZhbHVlKSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUpO1xuICAgIH1cbn0iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBlbWFpbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbWFpbFJlID0gbmV3IFJlZ0V4cCgvKD86W2EtejAtOSEjJCUmJyorLz0/Xl9ge3x9fi1dKyg/OlxcLlthLXowLTkhIyQlJicqKy89P15fYHt8fX4tXSspKnxcIig/OltcXHgwMS1cXHgwOFxceDBiXFx4MGNcXHgwZS1cXHgxZlxceDIxXFx4MjMtXFx4NWJcXHg1ZC1cXHg3Zl18XFxcXFtcXHgwMS1cXHgwOVxceDBiXFx4MGNcXHgwZS1cXHg3Zl0pKlwiKUAoPzooPzpbYS16MC05XSg/OlthLXowLTktXSpbYS16MC05XSk/XFwuKStbYS16MC05XSg/OlthLXowLTktXSpbYS16MC05XSk/fFxcWyg/Oig/OjI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPylcXC4pezN9KD86MjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/fFthLXowLTktXSpbYS16MC05XTooPzpbXFx4MDEtXFx4MDhcXHgwYlxceDBjXFx4MGUtXFx4MWZcXHgyMS1cXHg1YVxceDUzLVxceDdmXXxcXFxcW1xceDAxLVxceDA5XFx4MGJcXHgwY1xceDBlLVxceDdmXSkrKVxcXSkvKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgZW1haWxSZS50ZXN0KHZhbHVlKSApIHJldHVybiAnV1JPTkdfRU1BSUwnO1xuICAgICAgICAgICAgaWYgKCAvXFxALipcXEAvLnRlc3QodmFsdWUpICkgcmV0dXJuICdXUk9OR19FTUFJTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBlcXVhbF90b19maWVsZDogZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCB2YWx1ZSAhPSBwYXJhbXNbZmllbGRdICkgcmV0dXJuICdGSUVMRFNfTk9UX0VRVUFMJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9XG59OyIsIm1vZHVsZS5leHBvcnRzID0gIHtcbiAgICBvbmVfb2Y6IGZ1bmN0aW9uKGFsbG93ZWRWYWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxhbGxvd2VkVmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB2YWx1ZSA9PSBhbGxvd2VkVmFsdWVzW2ldICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47ICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICdOT1RfQUxMT1dFRF9WQUxVRSc7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG1heF9sZW5ndGg6IGZ1bmN0aW9uKG1heExlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IG1heExlbmd0aCApIHJldHVybiAnVE9PX0xPTkcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBtaW5fbGVuZ3RoOiBmdW5jdGlvbihtaW5MZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPCBtaW5MZW5ndGggKSByZXR1cm4gJ1RPT19TSE9SVCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbGVuZ3RoX2VxdWFsOiBmdW5jdGlvbihsZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPCBsZW5ndGggKSByZXR1cm4gJ1RPT19TSE9SVCc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IGxlbmd0aCApIHJldHVybiAnVE9PX0xPTkcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGxlbmd0aF9iZXR3ZWVuOiBmdW5jdGlvbihtaW5MZW5ndGgsIG1heExlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA8IG1pbkxlbmd0aCApIHJldHVybiAnVE9PX1NIT1JUJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoID4gbWF4TGVuZ3RoICkgcmV0dXJuICdUT09fTE9ORyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LCAgICAgICAgICAgIFxuXG4gICAgbGlrZTogZnVuY3Rpb24ocmUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhdmFsdWUubWF0Y2gocmUpICkgcmV0dXJuICdXUk9OR19GT1JNQVQnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJ2YXIgREVGQVVMVF9SVUxFUyA9IHt9O1xudmFyIElTX0RFRkFVTFRfQVVUT19UUklNID0gMDtcblxuVmFsaWRhdG9yID0gZnVuY3Rpb24obGl2clJ1bGVzLCBpc0F1dG9UcmltKSB7XG4gICAgdGhpcy5pc1ByZXBhcmVkID0gZmFsc2U7XG4gICAgdGhpcy5saXZyUnVsZXMgICA9IGxpdnJSdWxlcztcbiAgICB0aGlzLnZhbGlkYXRvcnMgID0ge307XG4gICAgdGhpcy52YWxpZGF0b3JCdWlsZGVycyA9IHt9O1xuICAgIHRoaXMuZXJyb3JzID0gbnVsbDtcblxuICAgIGlmICggaXNBdXRvVHJpbSAhPT0gbnVsbCAmJiBpc0F1dG9UcmltICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIHRoaXMuaXNBdXRvVHJpbSA9IGlzQXV0b1RyaW07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pc0F1dG9UcmltID0gSVNfREVGQVVMVF9BVVRPX1RSSU07XG4gICAgfVxuXG4gICAgdGhpcy5yZWdpc3RlclJ1bGVzKERFRkFVTFRfUlVMRVMpO1xufVxuXG5WYWxpZGF0b3IucmVnaXN0ZXJEZWZhdWx0UnVsZXMgPSBmdW5jdGlvbihydWxlcykge1xuICAgIGZvciAodmFyIHJ1bGVOYW1lIGluIHJ1bGVzKSB7XG4gICAgICAgIERFRkFVTFRfUlVMRVNbcnVsZU5hbWVdID0gcnVsZXNbcnVsZU5hbWVdO1xuICAgIH1cbn07XG5cblZhbGlkYXRvci5kZWZhdWx0QXV0b1RyaW0gPSBmdW5jdGlvbihpc0F1dG9UcmltKSB7XG4gICAgSVNfREVGQVVMVF9BVVRPX1RSSU0gPSAhIWlzQXV0b1RyaW07XG59O1xuXG5WYWxpZGF0b3IucHJvdG90eXBlID0ge1xuICAgIHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYWxsUnVsZXMgPSB0aGlzLmxpdnJSdWxlcztcblxuICAgICAgICBmb3IgKHZhciBmaWVsZCBpbiBhbGxSdWxlcykge1xuICAgICAgICAgICAgdmFyIGZpZWxkUnVsZXMgPSBhbGxSdWxlc1tmaWVsZF07XG5cbiAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoZmllbGRSdWxlcykgKSB7XG4gICAgICAgICAgICAgICAgZmllbGRSdWxlcyA9IFtmaWVsZFJ1bGVzXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHZhbGlkYXRvcnMgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGZpZWxkUnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkID0gdGhpcy5fcGFyc2VSdWxlKGZpZWxkUnVsZXNbaV0pO1xuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnMucHVzaCggdGhpcy5fYnVpbGRWYWxpZGF0b3IocGFyc2VkLm5hbWUsIHBhcnNlZC5hcmdzKSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvcnNbZmllbGRdID0gdmFsaWRhdG9ycztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaXNQcmVwYXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNQcmVwYXJlZCkgdGhpcy5wcmVwYXJlKCk7XG5cbiAgICAgICAgaWYgKCEgaXNPYmplY3QoZGF0YSkgKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9ICdGT1JNQVRfRVJST1InO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCB0aGlzLmlzQXV0b1RyaW0gKSB7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5fYXV0b1RyaW0oZGF0YSk7ICAgIFxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVycm9ycyA9IHt9LCByZXN1bHQgPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBmaWVsZE5hbWUgaW4gdGhpcy52YWxpZGF0b3JzKSB7XG4gICAgICAgICAgICB2YXIgdmFsaWRhdG9ycyA9IHRoaXMudmFsaWRhdG9yc1tmaWVsZE5hbWVdO1xuICAgICAgICAgICAgaWYgKCF2YWxpZGF0b3JzIHx8ICF2YWxpZGF0b3JzLmxlbmd0aCkgY29udGludWU7XG5cbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbZmllbGROYW1lXVxuICAgICAgICAgICAgdmFyIGlzT2sgPSAxO1xuICAgICAgICAgICAgdmFyIGZpZWxkUmVzdWx0QXJyO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8dmFsaWRhdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGZpZWxkUmVzdWx0QXJyID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgZXJyQ29kZSA9IHZhbGlkYXRvcnNbaV0oXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5oYXNPd25Qcm9wZXJ0eShmaWVsZE5hbWUpID8gcmVzdWx0W2ZpZWxkTmFtZV0gOiB2YWx1ZSwgXG4gICAgICAgICAgICAgICAgICAgIGRhdGEsIFxuICAgICAgICAgICAgICAgICAgICBmaWVsZFJlc3VsdEFyclxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnNbZmllbGROYW1lXSA9IGVyckNvZGU7XG4gICAgICAgICAgICAgICAgICAgIGlzT2sgPSAwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBkYXRhLmhhc093blByb3BlcnR5KGZpZWxkTmFtZSkgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggZmllbGRSZXN1bHRBcnIubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkTmFtZV0gPSBmaWVsZFJlc3VsdEFyclswXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtmaWVsZE5hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNFbXB0eShlcnJvcnMpKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSBlcnJvcnM7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgIH0sXG5cbiAgICBnZXRFcnJvcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lcnJvcnM7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyUnVsZXM6IGZ1bmN0aW9uKHJ1bGVzKSB7XG4gICAgICAgIGZvciAodmFyIHJ1bGVOYW1lIGluIHJ1bGVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzW3J1bGVOYW1lXSA9IHJ1bGVzW3J1bGVOYW1lXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBcbiAgICBnZXRSdWxlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzO1xuICAgIH0sXG5cbiAgICBfcGFyc2VSdWxlOiBmdW5jdGlvbihsaXZyUnVsZSkge1xuICAgICAgICB2YXIgbmFtZSwgYXJncztcblxuICAgICAgICBpZiAoIGlzT2JqZWN0KGxpdnJSdWxlKSApIHtcbiAgICAgICAgICAgIG5hbWUgPSBPYmplY3Qua2V5cyhsaXZyUnVsZSlbMF07XG4gICAgICAgICAgICBhcmdzID0gbGl2clJ1bGVbIG5hbWUgXTtcblxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkoYXJncykgKSBhcmdzID0gW2FyZ3NdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmFtZSA9IGxpdnJSdWxlO1xuICAgICAgICAgICAgYXJncyA9IFtdO1xuICAgICAgICB9XG4gICAgIFxuICAgICAgICByZXR1cm4ge25hbWU6IG5hbWUsIGFyZ3M6IGFyZ3N9O1xuICAgIH0sXG5cbiAgICBfYnVpbGRWYWxpZGF0b3I6IGZ1bmN0aW9uKG5hbWUsIGFyZ3MpICB7XG4gICAgXG4gICAgICAgIGlmICggIXRoaXMudmFsaWRhdG9yQnVpbGRlcnNbbmFtZV0gKSB7XG4gICAgICAgICAgICB0aHJvdyBcIlJ1bGUgW1wiICsgbmFtZSArIFwiXSBub3QgcmVnaXN0ZXJlZFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFsbEFyZ3MgPSBbXTtcblxuICAgICAgICBhbGxBcmdzLnB1c2guYXBwbHkoYWxsQXJncywgYXJncyk7XG4gICAgICAgIGFsbEFyZ3MucHVzaCggdGhpcy5nZXRSdWxlcygpICk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdG9yQnVpbGRlcnNbbmFtZV0uYXBwbHkodGhpcy52YWxpZGF0b3JCdWlsZGVycywgYWxsQXJncyk7XG5cbiAgICB9LFxuICAgIFxuICAgIF9hdXRvVHJpbTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgZGF0YVR5cGUgPSB0eXBlb2YgZGF0YTtcblxuICAgICAgICBpZiAoIGRhdGFUeXBlICE9PSAnb2JqZWN0JyAmJiBkYXRhICkge1xuICAgICAgICAgICAgaWYgKGRhdGEucmVwbGFjZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLnJlcGxhY2UoL15cXHMqLywgJycpLnJlcGxhY2UoL1xccyokLywgJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICggZGF0YVR5cGUgPT0gJ29iamVjdCcgJiYgQXJyYXkuaXNBcnJheShkYXRhKSApIHtcbiAgICAgICAgICAgIHZhciB0cmltbWVkRGF0YSA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0cmltbWVkRGF0YVtpXSA9IHRoaXMuX2F1dG9UcmltKCBkYXRhW2ldICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cmltbWVkRGF0YTtcbiAgICAgICAgfSBlbHNlIGlmICggZGF0YVR5cGUgPT0gJ29iamVjdCcgJiYgaXNPYmplY3QoZGF0YSkgKSB7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZERhdGEgPSB7fTtcblxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuaGFzT3duUHJvcGVydHkoa2V5KSApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJpbW1lZERhdGFba2V5XSA9IHRoaXMuX2F1dG9UcmltKCBkYXRhW2tleV0gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0cmltbWVkRGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KG9iaikgeyBcbiAgICAvLyBUT0RPIG1ha2UgYmV0dGVyIGNoZWNraW5nXG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHkobWFwKSB7XG4gICAgZm9yKHZhciBrZXkgaW4gbWFwKSB7XG4gICAgICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRvcjsiLCJ3aW5kb3cuTElWUiA9IHJlcXVpcmUoXCIuLi9saWIvTElWUlwiKTsiXX0=
;