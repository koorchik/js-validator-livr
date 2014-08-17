(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

            for (var i=0; i<validators.length; i++) {
                var fieldResultArr = [];

                var errCode = validators[i](
                    result.hasOwnProperty(fieldName) ? result[fieldName] : value,
                    data,
                    fieldResultArr
                );

                if (errCode) {
                    errors[fieldName] = errCode;
                    break;
                } else if ( data.hasOwnProperty(fieldName) ) {
                    if ( fieldResultArr.length ) {
                        result[fieldName] = fieldResultArr[0];
                    } else if ( ! result.hasOwnProperty(fieldName) ) {
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

        return this.validatorBuilders[name].apply(null, allArgs);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL0NvbW1vbi5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL0ZpbHRlcnMuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi9SdWxlcy9IZWxwZXIuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi9SdWxlcy9OdW1lcmljLmpzIiwiL1VzZXJzL2tvb3JjaGlrL3dvcmsva29vcmNoaWsvanMtdmFsaWRhdG9yLWxpdnIvbGliL0xJVlIvUnVsZXMvU3BlY2lhbC5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL1N0cmluZy5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1ZhbGlkYXRvci5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL3NjcmlwdHMvYnJvd3NlcmlmeV9lbnRyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek1BIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBMSVZSID0ge3J1bGVzOiB7fX07XG5cbkxJVlIucnVsZXMuY29tbW9uICA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9Db21tb24nKTtcbkxJVlIucnVsZXMuc3RyaW5nICA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9TdHJpbmcnKTtcbkxJVlIucnVsZXMubnVtZXJpYyA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9OdW1lcmljJyk7XG5MSVZSLnJ1bGVzLnNwZWNpYWwgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvU3BlY2lhbCcpO1xuTElWUi5ydWxlcy5oZWxwZXIgID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL0hlbHBlcicpO1xuTElWUi5ydWxlcy5maWx0ZXJzID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL0ZpbHRlcnMnKTtcblxuXG5MSVZSLlZhbGlkYXRvciA9IHJlcXVpcmUoJy4vTElWUi9WYWxpZGF0b3InKTtcblxuTElWUi5WYWxpZGF0b3IucmVnaXN0ZXJEZWZhdWx0UnVsZXMoe1xuICAgIHJlcXVpcmVkOiAgICAgICAgIExJVlIucnVsZXMuY29tbW9uLnJlcXVpcmVkLFxuICAgIG5vdF9lbXB0eTogICAgICAgIExJVlIucnVsZXMuY29tbW9uLm5vdF9lbXB0eSxcbiAgICBub3RfZW1wdHlfbGlzdDogICBMSVZSLnJ1bGVzLmNvbW1vbi5ub3RfZW1wdHlfbGlzdCxcblxuICAgIG9uZV9vZjogICAgICAgICAgIExJVlIucnVsZXMuc3RyaW5nLm9uZV9vZixcbiAgICBtYXhfbGVuZ3RoOiAgICAgICBMSVZSLnJ1bGVzLnN0cmluZy5tYXhfbGVuZ3RoLFxuICAgIG1pbl9sZW5ndGg6ICAgICAgIExJVlIucnVsZXMuc3RyaW5nLm1pbl9sZW5ndGgsXG4gICAgbGVuZ3RoX2VxdWFsOiAgICAgTElWUi5ydWxlcy5zdHJpbmcubGVuZ3RoX2VxdWFsLFxuICAgIGxlbmd0aF9iZXR3ZWVuOiAgIExJVlIucnVsZXMuc3RyaW5nLmxlbmd0aF9iZXR3ZWVuLFxuICAgIGxpa2U6ICAgICAgICAgICAgIExJVlIucnVsZXMuc3RyaW5nLmxpa2UsXG5cbiAgICBpbnRlZ2VyOiAgICAgICAgICBMSVZSLnJ1bGVzLm51bWVyaWMuaW50ZWdlcixcbiAgICBwb3NpdGl2ZV9pbnRlZ2VyOiBMSVZSLnJ1bGVzLm51bWVyaWMucG9zaXRpdmVfaW50ZWdlcixcbiAgICBkZWNpbWFsOiAgICAgICAgICBMSVZSLnJ1bGVzLm51bWVyaWMuZGVjaW1hbCxcbiAgICBwb3NpdGl2ZV9kZWNpbWFsOiBMSVZSLnJ1bGVzLm51bWVyaWMucG9zaXRpdmVfZGVjaW1hbCxcbiAgICBtYXhfbnVtYmVyOiAgICAgICBMSVZSLnJ1bGVzLm51bWVyaWMubWF4X251bWJlcixcbiAgICBtaW5fbnVtYmVyOiAgICAgICBMSVZSLnJ1bGVzLm51bWVyaWMubWluX251bWJlcixcbiAgICBudW1iZXJfYmV0d2VlbjogICBMSVZSLnJ1bGVzLm51bWVyaWMubnVtYmVyX2JldHdlZW4sXG5cbiAgICBlbWFpbDogICAgICAgICAgICBMSVZSLnJ1bGVzLnNwZWNpYWwuZW1haWwsXG4gICAgZXF1YWxfdG9fZmllbGQ6ICAgTElWUi5ydWxlcy5zcGVjaWFsLmVxdWFsX3RvX2ZpZWxkLFxuXG4gICAgbmVzdGVkX29iamVjdDogICAgTElWUi5ydWxlcy5oZWxwZXIubmVzdGVkX29iamVjdCxcbiAgICBsaXN0X29mOiAgICAgICAgICBMSVZSLnJ1bGVzLmhlbHBlci5saXN0X29mLFxuICAgIGxpc3Rfb2Zfb2JqZWN0czogIExJVlIucnVsZXMuaGVscGVyLmxpc3Rfb2Zfb2JqZWN0cyxcbiAgICBsaXN0X29mX2RpZmZlcmVudF9vYmplY3RzOiBMSVZSLnJ1bGVzLmhlbHBlci5saXN0X29mX2RpZmZlcmVudF9vYmplY3RzLFxuXG4gICAgdHJpbTogICAgICAgICAgICAgTElWUi5ydWxlcy5maWx0ZXJzLnRyaW0sXG4gICAgdG9fbGM6ICAgICAgICAgICAgTElWUi5ydWxlcy5maWx0ZXJzLnRvX2xjLFxuICAgIHRvX3VjOiAgICAgICAgICAgIExJVlIucnVsZXMuZmlsdGVycy50b191Y1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTElWUjtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlcXVpcmVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1JFUVVJUkVEJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgbm90X2VtcHR5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ0NBTk5PVF9CRV9FTVBUWSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIG5vdF9lbXB0eV9saXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGxpc3QpIHtcbiAgICAgICAgICAgIGlmIChsaXN0ID09PSB1bmRlZmluZWQgfHwgbGlzdCA9PT0gJycpIHJldHVybiAnQ0FOTk9UX0JFX0VNUFRZJztcbiAgICAgICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkobGlzdCkgKSByZXR1cm4gJ1dST05HX0ZPUk1BVCc7XG4gICAgICAgICAgICBpZiAobGlzdC5sZW5ndGggPCAxKSByZXR1cm4gJ0NBTk5PVF9CRV9FTVBUWSc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB0cmltOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCB1bmRlZmluZWQsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnOyAvLyBUT0RPIGp1c3QgZG8gbm90IHRyaW0gbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnJlcGxhY2UoL15cXHMqLywgJycpLnJlcGxhY2UoL1xccyokLywgJycpICk7XG4gICAgICAgIH07XG4gICAgfSxcbiAgICB0b19sYzogZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCB1bmRlZmluZWQsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnOyAvLyBUT0RPIGp1c3Qgc2t1cCBudW1iZXJzXG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCggdmFsdWUudG9Mb3dlckNhc2UoKSApO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgdG9fdWM6IGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgdW5kZWZpbmVkLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNrdXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnRvVXBwZXJDYXNlKCkgKTtcbiAgICAgICAgfTtcbiAgICB9XG59OyIsInZhciBWYWxpZGF0b3IgPSByZXF1aXJlKCcuLi9WYWxpZGF0b3InKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbmVzdGVkX29iamVjdDogZnVuY3Rpb24obGl2ciwgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5lc3RlZE9iamVjdCwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggbmVzdGVkT2JqZWN0ID09PSB1bmRlZmluZWQgfHwgbmVzdGVkT2JqZWN0ID09PSBudWxsIHx8IG5lc3RlZE9iamVjdCA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICggdHlwZW9mIG5lc3RlZE9iamVjdCAhPT0gJ29iamVjdCcgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7IC8vVE9ETyBjaGVjayBpZiBoYXNoXG5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIG5lc3RlZE9iamVjdCApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5nZXRFcnJvcnMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGlzdF9vZjogZnVuY3Rpb24ocnVsZXMsIHJ1bGVCdWlsZGVycykge1xuICAgICAgICB2YXIgbGl2ciA9IHsgZmllbGQ6IHJ1bGVzIH07XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcywgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZXMgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZXMgPT09IG51bGwgfHwgdmFsdWVzID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkodmFsdWVzKSApIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBoYXNFcnJvcnMgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggeyBmaWVsZDogdmFsdWVzW2ldIH0gKTtcblxuICAgICAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0LmZpZWxkKTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3JzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goIHZhbGlkYXRvci5nZXRFcnJvcnMoKS5maWVsZCApO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIGhhc0Vycm9ycyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxpc3Rfb2Zfb2JqZWN0czogZnVuY3Rpb24obGl2ciwgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdHMsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIG9iamVjdHMgPT09IHVuZGVmaW5lZCB8fCBvYmplY3RzID09PSBudWxsIHx8IG9iamVjdHMgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheShvYmplY3RzKSApIHJldHVybiAnRk9STUFUX0VSUk9SJztcbiAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhc0Vycm9ycyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPG9iamVjdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggb2JqZWN0c1tpXSApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYXNFcnJvcnMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCggdmFsaWRhdG9yLmdldEVycm9ycygpICk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICggaGFzRXJyb3JzICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIFxuICAgIGxpc3Rfb2ZfZGlmZmVyZW50X29iamVjdHM6IGZ1bmN0aW9uKHNlbGVjdG9yRmllbGQsIGxpdnJzLCBydWxlQnVpbGRlcnMpIHtcbiAgICAgICAgdmFyIHZhbGlkYXRvcnMgPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBzZWxlY3RvclZhbHVlIGluIGxpdnJzKSB7XG4gICAgICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyc1tzZWxlY3RvclZhbHVlXSkucmVnaXN0ZXJSdWxlcyhydWxlQnVpbGRlcnMpLnByZXBhcmUoKTtcbiAgICAgICAgICAgIHZhbGlkYXRvcnNbc2VsZWN0b3JWYWx1ZV0gPSB2YWxpZGF0b3I7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0cywgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggb2JqZWN0cyA9PT0gdW5kZWZpbmVkIHx8IG9iamVjdHMgPT09IG51bGwgfHwgb2JqZWN0cyA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KG9iamVjdHMpICkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICAgICAgICB2YXIgaGFzRXJyb3JzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqZWN0cy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICB2YXIgb2JqZWN0ID0gb2JqZWN0c1tpXTtcblxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9iamVjdCAhPSAnb2JqZWN0JyB8fCAhb2JqZWN0W3NlbGVjdG9yRmllbGRdIHx8ICF2YWxpZGF0b3JzWyBvYmplY3Rbc2VsZWN0b3JGaWVsZF0gXSApIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goJ0ZPUk1BVF9FUlJPUicpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRhdG9yID0gdmFsaWRhdG9yc1sgb2JqZWN0W3NlbGVjdG9yRmllbGRdIF07XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggb2JqZWN0ICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCB2YWxpZGF0b3IuZ2V0RXJyb3JzKCkgKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBoYXNFcnJvcnMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbn07IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW50ZWdlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggIXZhbHVlLm1hdGNoKC9eXFwtP1swLTldKyQvKSApIHJldHVybiAnTk9UX0lOVEVHRVInO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgcG9zaXRpdmVfaW50ZWdlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggISAvXlsxLTldWzAtOV0qJC8udGVzdCh2YWx1ZSkgKSByZXR1cm4gJ05PVF9QT1NJVElWRV9JTlRFR0VSJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGRlY2ltYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgL14oPzpcXC0/KD86WzAtOV0rXFwuWzAtOV0rKXwoPzpbMC05XSspKSQvLnRlc3QodmFsdWUpICkgcmV0dXJuICdOT1RfREVDSU1BTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBwb3NpdGl2ZV9kZWNpbWFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhIC9eKD86KD86WzEtOV1bMC05XSpcXC5bMC05XSspfCg/OlsxLTldWzAtOV0qKSkkLy50ZXN0KHZhbHVlKSApIHJldHVybiAnTk9UX1BPU0lUSVZFX0RFQ0lNQUwnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgbWF4X251bWJlcjogZnVuY3Rpb24obWF4TnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoIHZhbHVlID4gbWF4TnVtYmVyICkgcmV0dXJuICdUT09fSElHSCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBtaW5fbnVtYmVyOiBmdW5jdGlvbihtaW5OdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICggdmFsdWUgPCBtaW5OdW1iZXIgKSByZXR1cm4gJ1RPT19MT1cnO1xuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBudW1iZXJfYmV0d2VlbjogZnVuY3Rpb24obWluTnVtYmVyLCBtYXhOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICggdmFsdWUgPCBtaW5OdW1iZXIgKSByZXR1cm4gJ1RPT19MT1cnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZSA+IG1heE51bWJlciApIHJldHVybiAnVE9PX0hJR0gnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG59O1xuXG5cbmZ1bmN0aW9uIG1ha2VfbnVtYmVyKHZhbHVlKSB7XG4gICAgaWYgKCB0eXBlb2YodmFsdWUpID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSk7XG4gICAgfVxufSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGVtYWlsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVtYWlsUmUgPSBuZXcgUmVnRXhwKC8oPzpbYS16MC05ISMkJSYnKisvPT9eX2B7fH1+LV0rKD86XFwuW2EtejAtOSEjJCUmJyorLz0/Xl9ge3x9fi1dKykqfFwiKD86W1xceDAxLVxceDA4XFx4MGJcXHgwY1xceDBlLVxceDFmXFx4MjFcXHgyMy1cXHg1YlxceDVkLVxceDdmXXxcXFxcW1xceDAxLVxceDA5XFx4MGJcXHgwY1xceDBlLVxceDdmXSkqXCIpQCg/Oig/OlthLXowLTldKD86W2EtejAtOS1dKlthLXowLTldKT9cXC4pK1thLXowLTldKD86W2EtejAtOS1dKlthLXowLTldKT98XFxbKD86KD86MjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KVxcLil7M30oPzoyNVswLTVdfDJbMC00XVswLTldfFswMV0/WzAtOV1bMC05XT98W2EtejAtOS1dKlthLXowLTldOig/OltcXHgwMS1cXHgwOFxceDBiXFx4MGNcXHgwZS1cXHgxZlxceDIxLVxceDVhXFx4NTMtXFx4N2ZdfFxcXFxbXFx4MDEtXFx4MDlcXHgwYlxceDBjXFx4MGUtXFx4N2ZdKSspXFxdKS8pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggISBlbWFpbFJlLnRlc3QodmFsdWUpICkgcmV0dXJuICdXUk9OR19FTUFJTCc7XG4gICAgICAgICAgICBpZiAoIC9cXEAuKlxcQC8udGVzdCh2YWx1ZSkgKSByZXR1cm4gJ1dST05HX0VNQUlMJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGVxdWFsX3RvX2ZpZWxkOiBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIHZhbHVlICE9IHBhcmFtc1tmaWVsZF0gKSByZXR1cm4gJ0ZJRUxEU19OT1RfRVFVQUwnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH1cbn07IiwibW9kdWxlLmV4cG9ydHMgPSAge1xuICAgIG9uZV9vZjogZnVuY3Rpb24oYWxsb3dlZFZhbHVlcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGFsbG93ZWRWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIHZhbHVlID09IGFsbG93ZWRWYWx1ZXNbaV0gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJ05PVF9BTExPV0VEX1ZBTFVFJztcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbWF4X2xlbmd0aDogZnVuY3Rpb24obWF4TGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoID4gbWF4TGVuZ3RoICkgcmV0dXJuICdUT09fTE9ORyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG1pbl9sZW5ndGg6IGZ1bmN0aW9uKG1pbkxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA8IG1pbkxlbmd0aCApIHJldHVybiAnVE9PX1NIT1JUJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBsZW5ndGhfZXF1YWw6IGZ1bmN0aW9uKGxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA8IGxlbmd0aCApIHJldHVybiAnVE9PX1NIT1JUJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoID4gbGVuZ3RoICkgcmV0dXJuICdUT09fTE9ORyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbGVuZ3RoX2JldHdlZW46IGZ1bmN0aW9uKG1pbkxlbmd0aCwgbWF4TGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoIDwgbWluTGVuZ3RoICkgcmV0dXJuICdUT09fU0hPUlQnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPiBtYXhMZW5ndGggKSByZXR1cm4gJ1RPT19MT05HJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sICAgICAgICAgICAgXG5cbiAgICBsaWtlOiBmdW5jdGlvbihyZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICF2YWx1ZS5tYXRjaChyZSkgKSByZXR1cm4gJ1dST05HX0ZPUk1BVCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59OyIsInZhciBERUZBVUxUX1JVTEVTID0ge307XG52YXIgSVNfREVGQVVMVF9BVVRPX1RSSU0gPSAwO1xuXG5WYWxpZGF0b3IgPSBmdW5jdGlvbihsaXZyUnVsZXMsIGlzQXV0b1RyaW0pIHtcbiAgICB0aGlzLmlzUHJlcGFyZWQgPSBmYWxzZTtcbiAgICB0aGlzLmxpdnJSdWxlcyAgID0gbGl2clJ1bGVzO1xuICAgIHRoaXMudmFsaWRhdG9ycyAgPSB7fTtcbiAgICB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzID0ge307XG4gICAgdGhpcy5lcnJvcnMgPSBudWxsO1xuXG4gICAgaWYgKCBpc0F1dG9UcmltICE9PSBudWxsICYmIGlzQXV0b1RyaW0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgdGhpcy5pc0F1dG9UcmltID0gaXNBdXRvVHJpbTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmlzQXV0b1RyaW0gPSBJU19ERUZBVUxUX0FVVE9fVFJJTTtcbiAgICB9XG5cbiAgICB0aGlzLnJlZ2lzdGVyUnVsZXMoREVGQVVMVF9SVUxFUyk7XG59XG5cblZhbGlkYXRvci5yZWdpc3RlckRlZmF1bHRSdWxlcyA9IGZ1bmN0aW9uKHJ1bGVzKSB7XG4gICAgZm9yICh2YXIgcnVsZU5hbWUgaW4gcnVsZXMpIHtcbiAgICAgICAgREVGQVVMVF9SVUxFU1tydWxlTmFtZV0gPSBydWxlc1tydWxlTmFtZV07XG4gICAgfVxufTtcblxuVmFsaWRhdG9yLmRlZmF1bHRBdXRvVHJpbSA9IGZ1bmN0aW9uKGlzQXV0b1RyaW0pIHtcbiAgICBJU19ERUZBVUxUX0FVVE9fVFJJTSA9ICEhaXNBdXRvVHJpbTtcbn07XG5cblZhbGlkYXRvci5wcm90b3R5cGUgPSB7XG4gICAgcHJlcGFyZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhbGxSdWxlcyA9IHRoaXMubGl2clJ1bGVzO1xuXG4gICAgICAgIGZvciAodmFyIGZpZWxkIGluIGFsbFJ1bGVzKSB7XG4gICAgICAgICAgICB2YXIgZmllbGRSdWxlcyA9IGFsbFJ1bGVzW2ZpZWxkXTtcblxuICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheShmaWVsZFJ1bGVzKSApIHtcbiAgICAgICAgICAgICAgICBmaWVsZFJ1bGVzID0gW2ZpZWxkUnVsZXNdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdmFsaWRhdG9ycyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8ZmllbGRSdWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSB0aGlzLl9wYXJzZVJ1bGUoZmllbGRSdWxlc1tpXSk7XG4gICAgICAgICAgICAgICAgdmFsaWRhdG9ycy5wdXNoKCB0aGlzLl9idWlsZFZhbGlkYXRvcihwYXJzZWQubmFtZSwgcGFyc2VkLmFyZ3MpICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yc1tmaWVsZF0gPSB2YWxpZGF0b3JzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pc1ByZXBhcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1ByZXBhcmVkKSB0aGlzLnByZXBhcmUoKTtcblxuICAgICAgICBpZiAoISBpc09iamVjdChkYXRhKSApIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gJ0ZPUk1BVF9FUlJPUic7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHRoaXMuaXNBdXRvVHJpbSApIHtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9hdXRvVHJpbShkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSB7fSwgcmVzdWx0ID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgZmllbGROYW1lIGluIHRoaXMudmFsaWRhdG9ycykge1xuICAgICAgICAgICAgdmFyIHZhbGlkYXRvcnMgPSB0aGlzLnZhbGlkYXRvcnNbZmllbGROYW1lXTtcbiAgICAgICAgICAgIGlmICghdmFsaWRhdG9ycyB8fCAhdmFsaWRhdG9ycy5sZW5ndGgpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2ZpZWxkTmFtZV1cblxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHZhbGlkYXRvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGRSZXN1bHRBcnIgPSBbXTtcblxuICAgICAgICAgICAgICAgIHZhciBlcnJDb2RlID0gdmFsaWRhdG9yc1tpXShcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lmhhc093blByb3BlcnR5KGZpZWxkTmFtZSkgPyByZXN1bHRbZmllbGROYW1lXSA6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgICAgICAgICBmaWVsZFJlc3VsdEFyclxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnNbZmllbGROYW1lXSA9IGVyckNvZGU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIGRhdGEuaGFzT3duUHJvcGVydHkoZmllbGROYW1lKSApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBmaWVsZFJlc3VsdEFyci5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZmllbGROYW1lXSA9IGZpZWxkUmVzdWx0QXJyWzBdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCAhIHJlc3VsdC5oYXNPd25Qcm9wZXJ0eShmaWVsZE5hbWUpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0VtcHR5KGVycm9ycykpIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IGVycm9ycztcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgfSxcblxuICAgIGdldEVycm9yczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVycm9ycztcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXJSdWxlczogZnVuY3Rpb24ocnVsZXMpIHtcbiAgICAgICAgZm9yICh2YXIgcnVsZU5hbWUgaW4gcnVsZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yQnVpbGRlcnNbcnVsZU5hbWVdID0gcnVsZXNbcnVsZU5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldFJ1bGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdG9yQnVpbGRlcnM7XG4gICAgfSxcblxuICAgIF9wYXJzZVJ1bGU6IGZ1bmN0aW9uKGxpdnJSdWxlKSB7XG4gICAgICAgIHZhciBuYW1lLCBhcmdzO1xuXG4gICAgICAgIGlmICggaXNPYmplY3QobGl2clJ1bGUpICkge1xuICAgICAgICAgICAgbmFtZSA9IE9iamVjdC5rZXlzKGxpdnJSdWxlKVswXTtcbiAgICAgICAgICAgIGFyZ3MgPSBsaXZyUnVsZVsgbmFtZSBdO1xuXG4gICAgICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheShhcmdzKSApIGFyZ3MgPSBbYXJnc107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuYW1lID0gbGl2clJ1bGU7XG4gICAgICAgICAgICBhcmdzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge25hbWU6IG5hbWUsIGFyZ3M6IGFyZ3N9O1xuICAgIH0sXG5cbiAgICBfYnVpbGRWYWxpZGF0b3I6IGZ1bmN0aW9uKG5hbWUsIGFyZ3MpICB7XG5cbiAgICAgICAgaWYgKCAhdGhpcy52YWxpZGF0b3JCdWlsZGVyc1tuYW1lXSApIHtcbiAgICAgICAgICAgIHRocm93IFwiUnVsZSBbXCIgKyBuYW1lICsgXCJdIG5vdCByZWdpc3RlcmVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWxsQXJncyA9IFtdO1xuXG4gICAgICAgIGFsbEFyZ3MucHVzaC5hcHBseShhbGxBcmdzLCBhcmdzKTtcbiAgICAgICAgYWxsQXJncy5wdXNoKCB0aGlzLmdldFJ1bGVzKCkgKTtcblxuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0b3JCdWlsZGVyc1tuYW1lXS5hcHBseShudWxsLCBhbGxBcmdzKTtcbiAgICB9LFxuXG4gICAgX2F1dG9UcmltOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBkYXRhVHlwZSA9IHR5cGVvZiBkYXRhO1xuXG4gICAgICAgIGlmICggZGF0YVR5cGUgIT09ICdvYmplY3QnICYmIGRhdGEgKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5yZXBsYWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvXlxccyovLCAnJykucmVwbGFjZSgvXFxzKiQvLCAnJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCBkYXRhVHlwZSA9PSAnb2JqZWN0JyAmJiBBcnJheS5pc0FycmF5KGRhdGEpICkge1xuICAgICAgICAgICAgdmFyIHRyaW1tZWREYXRhID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRyaW1tZWREYXRhW2ldID0gdGhpcy5fYXV0b1RyaW0oIGRhdGFbaV0gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWREYXRhO1xuICAgICAgICB9IGVsc2UgaWYgKCBkYXRhVHlwZSA9PSAnb2JqZWN0JyAmJiBpc09iamVjdChkYXRhKSApIHtcbiAgICAgICAgICAgIHZhciB0cmltbWVkRGF0YSA9IHt9O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmICggZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpICkge1xuICAgICAgICAgICAgICAgICAgICB0cmltbWVkRGF0YVtrZXldID0gdGhpcy5fYXV0b1RyaW0oIGRhdGFba2V5XSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWREYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gaXNPYmplY3Qob2JqKSB7XG4gICAgLy8gVE9ETyBtYWtlIGJldHRlciBjaGVja2luZ1xuICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xufVxuXG5mdW5jdGlvbiBpc0VtcHR5KG1hcCkge1xuICAgIGZvcih2YXIga2V5IGluIG1hcCkge1xuICAgICAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWYWxpZGF0b3I7XG4iLCJ3aW5kb3cuTElWUiA9IHJlcXVpcmUoXCIuLi9saWIvTElWUlwiKTsiXX0=
