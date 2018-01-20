(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var LIVR = {rules: {}};

LIVR.rules.common  = require('./LIVR/Rules/Common');
LIVR.rules.string  = require('./LIVR/Rules/String');
LIVR.rules.numeric = require('./LIVR/Rules/Numeric');
LIVR.rules.special = require('./LIVR/Rules/Special');
LIVR.rules.meta    = require('./LIVR/Rules/Meta');
LIVR.rules.modifiers = require('./LIVR/Rules/Modifiers');

LIVR.Validator = require('./LIVR/Validator');
LIVR.util = require('./LIVR/util');

LIVR.Validator.registerDefaultRules({
    required:         LIVR.rules.common.required,
    not_empty:        LIVR.rules.common.not_empty,
    not_empty_list:   LIVR.rules.common.not_empty_list,
    any_object:       LIVR.rules.common.any_object,

    string:           LIVR.rules.string.string,
    eq:               LIVR.rules.string.eq,
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
    url:              LIVR.rules.special.url,
    iso_date:         LIVR.rules.special.iso_date,

    nested_object:    LIVR.rules.meta.nested_object,
    variable_object:  LIVR.rules.meta.variable_object,
    list_of:          LIVR.rules.meta.list_of,
    list_of_objects:  LIVR.rules.meta.list_of_objects,
    or:               LIVR.rules.meta.or,
    list_of_different_objects: LIVR.rules.meta.list_of_different_objects,

    default:          LIVR.rules.modifiers.default,
    trim:             LIVR.rules.modifiers.trim,
    to_lc:            LIVR.rules.modifiers.to_lc,
    to_uc:            LIVR.rules.modifiers.to_uc,
    remove:           LIVR.rules.modifiers.remove,
    leave_only:       LIVR.rules.modifiers.leave_only
});

module.exports = LIVR;

},{"./LIVR/Rules/Common":2,"./LIVR/Rules/Meta":3,"./LIVR/Rules/Modifiers":4,"./LIVR/Rules/Numeric":5,"./LIVR/Rules/Special":6,"./LIVR/Rules/String":7,"./LIVR/Validator":8,"./LIVR/util":9}],2:[function(require,module,exports){
'use strict';
var util = require('../util');

module.exports = {
    required: function() {
        return function(value) {
            if ( util.isNoValue(value) ) {
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
            if (! Array.isArray(list) ) return 'FORMAT_ERROR';
            if (list.length < 1) return 'CANNOT_BE_EMPTY';
            return;
        };
    },

    any_object: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;

            if ( !util.isObject(value) ) {
                return 'FORMAT_ERROR';
            }
        }
    }
};

},{"../util":9}],3:[function(require,module,exports){
'use strict';

var Validator = require('../Validator');
var util = require('../util');

module.exports = {
    nested_object: function(livr, ruleBuilders) {
        var validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return function(nestedObject, params, outputArr) {
            if ( util.isNoValue(nestedObject) ) return;
            if ( !util.isObject(nestedObject) ) return 'FORMAT_ERROR';

            var result = validator.validate( nestedObject );

            if ( result ) {
                outputArr.push(result);
                return;
            } else {
                return validator.getErrors();
            }
        };
    },

    variable_object: function(selectorField, livrs, ruleBuilders) {
        var validators = {};

        for (var selectorValue in livrs) {
            var validator = new Validator(livrs[selectorValue]).registerRules(ruleBuilders).prepare();
            validators[selectorValue] = validator;
        }

        return function(object, params, outputArr) {
            if ( util.isNoValue(object) ) return;

            if ( !util.isObject(object) || !object[selectorField] || !validators[ object[selectorField] ] ) {
                return 'FORMAT_ERROR';
            }

            var validator = validators[ object[selectorField] ];
            var result = validator.validate( object );

            if ( result ) {
                outputArr.push(result);
                return;
            } else {
                return validator.getErrors();
            }
        };
    },

    list_of: function(rules, ruleBuilders) {
        if (! Array.isArray(rules) ) {
            rules = Array.prototype.slice.call(arguments);
            ruleBuilders = rules.pop();
        }

        var livr = { field: rules };
        var validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return function(values, params, outputArr) {
            if ( util.isNoValue(values) ) return;

            if ( ! Array.isArray(values) ) return 'FORMAT_ERROR';

            var results   = [];
            var errors    = [];
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
            if ( util.isNoValue(objects) ) return;
            if ( ! Array.isArray(objects) ) return 'FORMAT_ERROR';

            var results   = [];
            var errors    = [];
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
            if ( util.isNoValue(objects) ) return;
            if ( ! Array.isArray(objects) ) return 'FORMAT_ERROR';

            var results   = [];
            var errors    = [];
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
    },

    or: function() {
        var ruleSets = Array.prototype.slice.call(arguments);
        var ruleBuilders = ruleSets.pop();

        var validators = ruleSets.map(function(rules) {
            var livr = { field: rules };
            var validator = new Validator(livr).registerRules(ruleBuilders).prepare();

            return validator;
        });

        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;

            var lastError;

            for (var i = 0; i < validators.length; i++) {
                var validator = validators[i];
                var result = validator.validate({ field: value });

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

},{"../Validator":8,"../util":9}],4:[function(require,module,exports){
'use strict';

var util = require('../util');

module.exports = {
    default: function(defaultValue) {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) {
                outputArr.push( defaultValue );
            }    
        };
    },

    trim: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just do not trim numbers
            outputArr.push( value.replace(/^\s*/, '').replace(/\s*$/, '') );
        };
    },

    to_lc: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.toLowerCase() );
        };
    },

    to_uc: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.toUpperCase() );
        };
    },

    remove: function(chars) {
        chars = util.escapeRegExp(chars);
        var re = new RegExp( '[' + chars +  ']', 'g' );

        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.replace(re, '') );
        };
    },

    leave_only: function(chars) {
        chars = util.escapeRegExp(chars);
        var re = new RegExp( '[^' + chars +  ']', 'g' );

        return function(value, params, outputArr) {
            if ( util.isNoValue(value) || typeof value === 'object' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.replace(re, '') );
        };
    },
};

},{"../util":9}],5:[function(require,module,exports){
'use strict';

var util = require('../util');

module.exports = {
    integer: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_INTEGER';

            if ( !Number.isInteger(+value) ) return 'NOT_INTEGER';
            outputArr.push(+value);
        };
    },

    positive_integer: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_INTEGER';

            if ( !Number.isInteger(+value) || +value < 1 ) return 'NOT_POSITIVE_INTEGER';
            outputArr.push(+value);
        };
    },

    decimal: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_DECIMAL';

            value += '';
            if ( ! /^(?:\-?(?:(?:[0-9]+\.[0-9]+)|(?:[0-9]+)))$/.test(value) ) return 'NOT_DECIMAL';
            outputArr.push(+value);
        };
    },

    positive_decimal: function() {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_DECIMAL';

            value += '';
            if ( ! /^(?:(?:[0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value) ) return 'NOT_POSITIVE_DECIMAL';
            outputArr.push(+value);
        };
    },

    max_number: function(maxNumber) {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if ( +value > +maxNumber ) return 'TOO_HIGH';
            outputArr.push(+value);
        };
    },

    min_number: function(minNumber) {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if ( +value < +minNumber ) return 'TOO_LOW';
            outputArr.push(+value);

        };
    },

    number_between: function(minNumber, maxNumber) {
        return function(value, params, outputArr) {
            if ( util.isNoValue(value) ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
            if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';

            if ( +value < +minNumber ) return 'TOO_LOW';
            if ( +value > +maxNumber ) return 'TOO_HIGH';
            outputArr.push(+value);
        };
    },
};

},{"../util":9}],6:[function(require,module,exports){
'use strict';

var util = require('../util');

module.exports = {
    email: function() {
       var emailRe = /^([\w\-_+]+(?:\.[\w\-_+]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! emailRe.test(value) ) return 'WRONG_EMAIL';
            if ( /\@.*\@/.test(value) ) return 'WRONG_EMAIL';
            if ( /\@.*_/.test(value) ) return 'WRONG_EMAIL';
            return;
        };
    },

    equal_to_field: function(field) {
        return function(value, params) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            if ( value != params[field] ) return 'FIELDS_NOT_EQUAL';
            return;
        };
    },

    url: function() {
        var urlReStr = '^(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[0-1]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))\\.?|localhost)(?::\\d{2,5})?(?:[/?#]\\S*)?$';
        var urlRe = new RegExp(urlReStr, 'i');

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            if (value.length < 2083 && urlRe.test(value)) return;
            return 'WRONG_URL';
        };
    },

    iso_date: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            var matched = value.match(/^(\d{4})-([0-1][0-9])-([0-3][0-9])$/);

            if (matched) {
                var epoch = Date.parse(value);
                if (!epoch && epoch !== 0) return 'WRONG_DATE';

                var d = new Date(epoch);
                d.setTime( d.getTime() + d.getTimezoneOffset() * 60 * 1000 );

                if ( d.getFullYear() == matched[1] && d.getMonth()+1 == +matched[2] && d.getDate() == +matched[3] ) {
                    return;
                }
            }

            return 'WRONG_DATE';
        };
    }
};

},{"../util":9}],7:[function(require,module,exports){
'use strict';

var util = require('../util');

module.exports =  {
    string: function() {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            outputArr.push(value+'');
            return;
        };
    },

    eq: function(allowedValue) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            if ( value+'' === allowedValue+'' ) {
                outputArr.push(allowedValue);
                return;
            }

            return 'NOT_ALLOWED_VALUE';
        };
    },

    one_of: function(allowedValues) {
        if (!Array.isArray(allowedValues)) {
            allowedValues = Array.prototype.slice.call(arguments);
            allowedValues.pop(); // pop ruleBuilders
        }

        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            for (var i=0; i<allowedValues.length; i++) {
                if ( value+'' === allowedValues[i]+'' ) {
                    outputArr.push(allowedValues[i]);
                    return;
                }
            }

            return 'NOT_ALLOWED_VALUE';
        };
    },

    max_length: function(maxLength) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length > maxLength ) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    min_length: function(minLength) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            outputArr.push(value);
        };
    },

    length_equal: function(length) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length < length ) return 'TOO_SHORT';
            if ( value.length > length ) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    length_between: function(minLength, maxLength) {
        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            if ( value.length > maxLength ) return 'TOO_LONG';
            outputArr.push(value);
        };
    },

    like: function(reStr, flags) {
        var isIgnoreCase = arguments.length === 3 && flags.match('i');
        var re = new RegExp(reStr, isIgnoreCase ? 'i' : '' );

        return function(value, params, outputArr) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';

            value += '';
            if ( !value.match(re) ) return 'WRONG_FORMAT';
            outputArr.push(value);
        };
    }
};

},{"../util":9}],8:[function(require,module,exports){
'use strict';

var util = require('./util');

var DEFAULT_RULES = {};
var IS_DEFAULT_AUTO_TRIM = 0;

function Validator(livrRules, isAutoTrim) {
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

Validator.getDefaultRules = function() {
    return DEFAULT_RULES;
};

Validator.registerAliasedDefaultRule = function(alias) {
    if (!alias.name) throw 'Alias name required';

    DEFAULT_RULES[alias.name] = Validator._buildAliasedRule(alias);
};

Validator._buildAliasedRule = function(alias) {
    if (!alias.name) throw 'Alias name required';
    if (!alias.rules) throw 'Alias rules required';

    var livr = {value: alias.rules};

    return function(ruleBuilders) {
        var validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return function( value, params, outputArr ) {
            var result = validator.validate({value: value});

            if (result) {
                outputArr.push(result.value);
                return;
            } else {
                return alias.error || validator.getErrors().value;
            }
        };
    };
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

        if (! util.isObject(data) ) {
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

            var value = data[fieldName];

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
                } else if ( fieldResultArr.length ) {
                    result[fieldName] = fieldResultArr[0];
                } else if ( data.hasOwnProperty(fieldName) && !result.hasOwnProperty(fieldName) ) {
                    result[fieldName] = value;
                }
            }
        }

        if (util.isEmptyObject(errors)) {
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

    registerAliasedRule: function(alias) {
        if (!alias.name) throw 'Alias name required';
        this.validatorBuilders[alias.name] = Validator._buildAliasedRule(alias);

        return this;
    },

    getRules: function() {
        return this.validatorBuilders;
    },

    _parseRule: function(livrRule) {
        var name, args;

        if ( util.isObject(livrRule) ) {
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
            throw 'Rule [' + name + '] not registered';
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
        } else if ( dataType == 'object' && util.isObject(data) ) {
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

module.exports = Validator;

},{"./util":9}],9:[function(require,module,exports){
'use strict';

module.exports = {
    isPrimitiveValue: function (value) {
        if (typeof value == 'string') return true;
        if (typeof value == 'number' && isFinite(value)) return true;
        if (typeof value == 'boolean') return true;
        return false;
    },

    looksLikeNumber: function (value) {
        if (! isNaN(+value) ) return true;
        return false;
    },

    isObject: function (obj) {
        return Object(obj) === obj && Object.getPrototypeOf(obj) === Object.prototype;
    },

    isEmptyObject: function (map) {
        for(var key in map) {
            if (map.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    },

    escapeRegExp: function (str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },

    isNoValue: function(value) {
        return value === undefined || value === null || value === '';
    }
};

},{}],10:[function(require,module,exports){
window.LIVR = require("../lib/LIVR");
},{"../lib/LIVR":1}]},{},[10])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTElWUi5qcyIsImxpYi9MSVZSL1J1bGVzL0NvbW1vbi5qcyIsImxpYi9MSVZSL1J1bGVzL01ldGEuanMiLCJsaWIvTElWUi9SdWxlcy9Nb2RpZmllcnMuanMiLCJsaWIvTElWUi9SdWxlcy9OdW1lcmljLmpzIiwibGliL0xJVlIvUnVsZXMvU3BlY2lhbC5qcyIsImxpYi9MSVZSL1J1bGVzL1N0cmluZy5qcyIsImxpYi9MSVZSL1ZhbGlkYXRvci5qcyIsImxpYi9MSVZSL3V0aWwuanMiLCJzY3JpcHRzL2Jyb3dzZXJpZnlfZW50cnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTElWUiA9IHtydWxlczoge319O1xuXG5MSVZSLnJ1bGVzLmNvbW1vbiAgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvQ29tbW9uJyk7XG5MSVZSLnJ1bGVzLnN0cmluZyAgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvU3RyaW5nJyk7XG5MSVZSLnJ1bGVzLm51bWVyaWMgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvTnVtZXJpYycpO1xuTElWUi5ydWxlcy5zcGVjaWFsID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL1NwZWNpYWwnKTtcbkxJVlIucnVsZXMubWV0YSAgICA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9NZXRhJyk7XG5MSVZSLnJ1bGVzLm1vZGlmaWVycyA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9Nb2RpZmllcnMnKTtcblxuTElWUi5WYWxpZGF0b3IgPSByZXF1aXJlKCcuL0xJVlIvVmFsaWRhdG9yJyk7XG5MSVZSLnV0aWwgPSByZXF1aXJlKCcuL0xJVlIvdXRpbCcpO1xuXG5MSVZSLlZhbGlkYXRvci5yZWdpc3RlckRlZmF1bHRSdWxlcyh7XG4gICAgcmVxdWlyZWQ6ICAgICAgICAgTElWUi5ydWxlcy5jb21tb24ucmVxdWlyZWQsXG4gICAgbm90X2VtcHR5OiAgICAgICAgTElWUi5ydWxlcy5jb21tb24ubm90X2VtcHR5LFxuICAgIG5vdF9lbXB0eV9saXN0OiAgIExJVlIucnVsZXMuY29tbW9uLm5vdF9lbXB0eV9saXN0LFxuICAgIGFueV9vYmplY3Q6ICAgICAgIExJVlIucnVsZXMuY29tbW9uLmFueV9vYmplY3QsXG5cbiAgICBzdHJpbmc6ICAgICAgICAgICBMSVZSLnJ1bGVzLnN0cmluZy5zdHJpbmcsXG4gICAgZXE6ICAgICAgICAgICAgICAgTElWUi5ydWxlcy5zdHJpbmcuZXEsXG4gICAgb25lX29mOiAgICAgICAgICAgTElWUi5ydWxlcy5zdHJpbmcub25lX29mLFxuICAgIG1heF9sZW5ndGg6ICAgICAgIExJVlIucnVsZXMuc3RyaW5nLm1heF9sZW5ndGgsXG4gICAgbWluX2xlbmd0aDogICAgICAgTElWUi5ydWxlcy5zdHJpbmcubWluX2xlbmd0aCxcbiAgICBsZW5ndGhfZXF1YWw6ICAgICBMSVZSLnJ1bGVzLnN0cmluZy5sZW5ndGhfZXF1YWwsXG4gICAgbGVuZ3RoX2JldHdlZW46ICAgTElWUi5ydWxlcy5zdHJpbmcubGVuZ3RoX2JldHdlZW4sXG4gICAgbGlrZTogICAgICAgICAgICAgTElWUi5ydWxlcy5zdHJpbmcubGlrZSxcblxuICAgIGludGVnZXI6ICAgICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5pbnRlZ2VyLFxuICAgIHBvc2l0aXZlX2ludGVnZXI6IExJVlIucnVsZXMubnVtZXJpYy5wb3NpdGl2ZV9pbnRlZ2VyLFxuICAgIGRlY2ltYWw6ICAgICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5kZWNpbWFsLFxuICAgIHBvc2l0aXZlX2RlY2ltYWw6IExJVlIucnVsZXMubnVtZXJpYy5wb3NpdGl2ZV9kZWNpbWFsLFxuICAgIG1heF9udW1iZXI6ICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5tYXhfbnVtYmVyLFxuICAgIG1pbl9udW1iZXI6ICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5taW5fbnVtYmVyLFxuICAgIG51bWJlcl9iZXR3ZWVuOiAgIExJVlIucnVsZXMubnVtZXJpYy5udW1iZXJfYmV0d2VlbixcblxuICAgIGVtYWlsOiAgICAgICAgICAgIExJVlIucnVsZXMuc3BlY2lhbC5lbWFpbCxcbiAgICBlcXVhbF90b19maWVsZDogICBMSVZSLnJ1bGVzLnNwZWNpYWwuZXF1YWxfdG9fZmllbGQsXG4gICAgdXJsOiAgICAgICAgICAgICAgTElWUi5ydWxlcy5zcGVjaWFsLnVybCxcbiAgICBpc29fZGF0ZTogICAgICAgICBMSVZSLnJ1bGVzLnNwZWNpYWwuaXNvX2RhdGUsXG5cbiAgICBuZXN0ZWRfb2JqZWN0OiAgICBMSVZSLnJ1bGVzLm1ldGEubmVzdGVkX29iamVjdCxcbiAgICB2YXJpYWJsZV9vYmplY3Q6ICBMSVZSLnJ1bGVzLm1ldGEudmFyaWFibGVfb2JqZWN0LFxuICAgIGxpc3Rfb2Y6ICAgICAgICAgIExJVlIucnVsZXMubWV0YS5saXN0X29mLFxuICAgIGxpc3Rfb2Zfb2JqZWN0czogIExJVlIucnVsZXMubWV0YS5saXN0X29mX29iamVjdHMsXG4gICAgb3I6ICAgICAgICAgICAgICAgTElWUi5ydWxlcy5tZXRhLm9yLFxuICAgIGxpc3Rfb2ZfZGlmZmVyZW50X29iamVjdHM6IExJVlIucnVsZXMubWV0YS5saXN0X29mX2RpZmZlcmVudF9vYmplY3RzLFxuXG4gICAgZGVmYXVsdDogICAgICAgICAgTElWUi5ydWxlcy5tb2RpZmllcnMuZGVmYXVsdCxcbiAgICB0cmltOiAgICAgICAgICAgICBMSVZSLnJ1bGVzLm1vZGlmaWVycy50cmltLFxuICAgIHRvX2xjOiAgICAgICAgICAgIExJVlIucnVsZXMubW9kaWZpZXJzLnRvX2xjLFxuICAgIHRvX3VjOiAgICAgICAgICAgIExJVlIucnVsZXMubW9kaWZpZXJzLnRvX3VjLFxuICAgIHJlbW92ZTogICAgICAgICAgIExJVlIucnVsZXMubW9kaWZpZXJzLnJlbW92ZSxcbiAgICBsZWF2ZV9vbmx5OiAgICAgICBMSVZSLnJ1bGVzLm1vZGlmaWVycy5sZWF2ZV9vbmx5XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMSVZSO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlcXVpcmVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1JFUVVJUkVEJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBub3RfZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlID09PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiAnQ0FOTk9UX0JFX0VNUFRZJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBub3RfZW1wdHlfbGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihsaXN0KSB7XG4gICAgICAgICAgICBpZiAobGlzdCA9PT0gdW5kZWZpbmVkIHx8IGxpc3QgPT09ICcnKSByZXR1cm4gJ0NBTk5PVF9CRV9FTVBUWSc7XG4gICAgICAgICAgICBpZiAoISBBcnJheS5pc0FycmF5KGxpc3QpICkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuICAgICAgICAgICAgaWYgKGxpc3QubGVuZ3RoIDwgMSkgcmV0dXJuICdDQU5OT1RfQkVfRU1QVFknO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBhbnlfb2JqZWN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCAhdXRpbC5pc09iamVjdCh2YWx1ZSkgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFZhbGlkYXRvciA9IHJlcXVpcmUoJy4uL1ZhbGlkYXRvcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5lc3RlZF9vYmplY3Q6IGZ1bmN0aW9uKGxpdnIsIHJ1bGVCdWlsZGVycykge1xuICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihuZXN0ZWRPYmplY3QsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKG5lc3RlZE9iamVjdCkgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoICF1dGlsLmlzT2JqZWN0KG5lc3RlZE9iamVjdCkgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIG5lc3RlZE9iamVjdCApO1xuXG4gICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5nZXRFcnJvcnMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdmFyaWFibGVfb2JqZWN0OiBmdW5jdGlvbihzZWxlY3RvckZpZWxkLCBsaXZycywgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3JzID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgc2VsZWN0b3JWYWx1ZSBpbiBsaXZycykge1xuICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cnNbc2VsZWN0b3JWYWx1ZV0pLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG4gICAgICAgICAgICB2YWxpZGF0b3JzW3NlbGVjdG9yVmFsdWVdID0gdmFsaWRhdG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUob2JqZWN0KSApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCAhdXRpbC5pc09iamVjdChvYmplY3QpIHx8ICFvYmplY3Rbc2VsZWN0b3JGaWVsZF0gfHwgIXZhbGlkYXRvcnNbIG9iamVjdFtzZWxlY3RvckZpZWxkXSBdICkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnRk9STUFUX0VSUk9SJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IHZhbGlkYXRvcnNbIG9iamVjdFtzZWxlY3RvckZpZWxkXSBdO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggb2JqZWN0ICk7XG5cbiAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsaWRhdG9yLmdldEVycm9ycygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsaXN0X29mOiBmdW5jdGlvbihydWxlcywgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkocnVsZXMpICkge1xuICAgICAgICAgICAgcnVsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcnVsZUJ1aWxkZXJzID0gcnVsZXMucG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGl2ciA9IHsgZmllbGQ6IHJ1bGVzIH07XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcywgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWVzKSApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkodmFsdWVzKSApIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgICA9IFtdO1xuICAgICAgICAgICAgdmFyIGVycm9ycyAgICA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhc0Vycm9ycyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPHZhbHVlcy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsaWRhdG9yLnZhbGlkYXRlKCB7IGZpZWxkOiB2YWx1ZXNbaV0gfSApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQuZmllbGQpO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYXNFcnJvcnMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCggdmFsaWRhdG9yLmdldEVycm9ycygpLmZpZWxkICk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICggaGFzRXJyb3JzICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGlzdF9vZl9vYmplY3RzOiBmdW5jdGlvbihsaXZyLCBydWxlQnVpbGRlcnMpIHtcbiAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cikucmVnaXN0ZXJSdWxlcyhydWxlQnVpbGRlcnMpLnByZXBhcmUoKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0cywgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUob2JqZWN0cykgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheShvYmplY3RzKSApIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgICA9IFtdO1xuICAgICAgICAgICAgdmFyIGVycm9ycyAgICA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhc0Vycm9ycyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPG9iamVjdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggb2JqZWN0c1tpXSApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYXNFcnJvcnMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCggdmFsaWRhdG9yLmdldEVycm9ycygpICk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICggaGFzRXJyb3JzICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGlzdF9vZl9kaWZmZXJlbnRfb2JqZWN0czogZnVuY3Rpb24oc2VsZWN0b3JGaWVsZCwgbGl2cnMsIHJ1bGVCdWlsZGVycykge1xuICAgICAgICB2YXIgdmFsaWRhdG9ycyA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIHNlbGVjdG9yVmFsdWUgaW4gbGl2cnMpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnJzW3NlbGVjdG9yVmFsdWVdKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuICAgICAgICAgICAgdmFsaWRhdG9yc1tzZWxlY3RvclZhbHVlXSA9IHZhbGlkYXRvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3RzLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZShvYmplY3RzKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KG9iamVjdHMpICkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0cyAgID0gW107XG4gICAgICAgICAgICB2YXIgZXJyb3JzICAgID0gW107XG4gICAgICAgICAgICB2YXIgaGFzRXJyb3JzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqZWN0cy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICB2YXIgb2JqZWN0ID0gb2JqZWN0c1tpXTtcblxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9iamVjdCAhPSAnb2JqZWN0JyB8fCAhb2JqZWN0W3NlbGVjdG9yRmllbGRdIHx8ICF2YWxpZGF0b3JzWyBvYmplY3Rbc2VsZWN0b3JGaWVsZF0gXSApIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goJ0ZPUk1BVF9FUlJPUicpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRhdG9yID0gdmFsaWRhdG9yc1sgb2JqZWN0W3NlbGVjdG9yRmllbGRdIF07XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggb2JqZWN0ICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCB2YWxpZGF0b3IuZ2V0RXJyb3JzKCkgKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBoYXNFcnJvcnMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBydWxlU2V0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBydWxlQnVpbGRlcnMgPSBydWxlU2V0cy5wb3AoKTtcblxuICAgICAgICB2YXIgdmFsaWRhdG9ycyA9IHJ1bGVTZXRzLm1hcChmdW5jdGlvbihydWxlcykge1xuICAgICAgICAgICAgdmFyIGxpdnIgPSB7IGZpZWxkOiBydWxlcyB9O1xuICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cikucmVnaXN0ZXJSdWxlcyhydWxlQnVpbGRlcnMpLnByZXBhcmUoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHZhbGlkYXRvcjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBsYXN0RXJyb3I7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsaWRhdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB2YWxpZGF0b3IgPSB2YWxpZGF0b3JzW2ldO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoeyBmaWVsZDogdmFsdWUgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0LmZpZWxkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RFcnJvciA9IHZhbGlkYXRvci5nZXRFcnJvcnMoKS5maWVsZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFzdEVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZGVmYXVsdDogZnVuY3Rpb24oZGVmYXVsdFZhbHVlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCBkZWZhdWx0VmFsdWUgKTtcbiAgICAgICAgICAgIH0gICAgXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRyaW06IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IGRvIG5vdCB0cmltIG51bWJlcnNcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCB2YWx1ZS5yZXBsYWNlKC9eXFxzKi8sICcnKS5yZXBsYWNlKC9cXHMqJC8sICcnKSApO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0b19sYzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnOyAvLyBUT0RPIGp1c3Qgc2tpcCBudW1iZXJzXG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCggdmFsdWUudG9Mb3dlckNhc2UoKSApO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0b191YzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnOyAvLyBUT0RPIGp1c3Qgc2tpcCBudW1iZXJzXG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCggdmFsdWUudG9VcHBlckNhc2UoKSApO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uKGNoYXJzKSB7XG4gICAgICAgIGNoYXJzID0gdXRpbC5lc2NhcGVSZWdFeHAoY2hhcnMpO1xuICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKCAnWycgKyBjaGFycyArICAnXScsICdnJyApO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnOyAvLyBUT0RPIGp1c3Qgc2tpcCBudW1iZXJzXG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCggdmFsdWUucmVwbGFjZShyZSwgJycpICk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxlYXZlX29ubHk6IGZ1bmN0aW9uKGNoYXJzKSB7XG4gICAgICAgIGNoYXJzID0gdXRpbC5lc2NhcGVSZWdFeHAoY2hhcnMpO1xuICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKCAnW14nICsgY2hhcnMgKyAgJ10nLCAnZycgKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNraXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnJlcGxhY2UocmUsICcnKSApO1xuICAgICAgICB9O1xuICAgIH0sXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW50ZWdlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG4gICAgICAgICAgICBpZiAoIXV0aWwubG9va3NMaWtlTnVtYmVyKHZhbHVlKSkgcmV0dXJuICdOT1RfSU5URUdFUic7XG5cbiAgICAgICAgICAgIGlmICggIU51bWJlci5pc0ludGVnZXIoK3ZhbHVlKSApIHJldHVybiAnTk9UX0lOVEVHRVInO1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goK3ZhbHVlKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcG9zaXRpdmVfaW50ZWdlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG4gICAgICAgICAgICBpZiAoIXV0aWwubG9va3NMaWtlTnVtYmVyKHZhbHVlKSkgcmV0dXJuICdOT1RfUE9TSVRJVkVfSU5URUdFUic7XG5cbiAgICAgICAgICAgIGlmICggIU51bWJlci5pc0ludGVnZXIoK3ZhbHVlKSB8fCArdmFsdWUgPCAxICkgcmV0dXJuICdOT1RfUE9TSVRJVkVfSU5URUdFUic7XG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCgrdmFsdWUpO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWNpbWFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNQcmltaXRpdmVWYWx1ZSh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcbiAgICAgICAgICAgIGlmICghdXRpbC5sb29rc0xpa2VOdW1iZXIodmFsdWUpKSByZXR1cm4gJ05PVF9ERUNJTUFMJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgL14oPzpcXC0/KD86KD86WzAtOV0rXFwuWzAtOV0rKXwoPzpbMC05XSspKSkkLy50ZXN0KHZhbHVlKSApIHJldHVybiAnTk9UX0RFQ0lNQUwnO1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goK3ZhbHVlKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcG9zaXRpdmVfZGVjaW1hbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG4gICAgICAgICAgICBpZiAoIXV0aWwubG9va3NMaWtlTnVtYmVyKHZhbHVlKSkgcmV0dXJuICdOT1RfUE9TSVRJVkVfREVDSU1BTCc7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhIC9eKD86KD86WzAtOV0qXFwuWzAtOV0rKXwoPzpbMS05XVswLTldKikpJC8udGVzdCh2YWx1ZSkgKSByZXR1cm4gJ05PVF9QT1NJVElWRV9ERUNJTUFMJztcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCt2YWx1ZSk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG1heF9udW1iZXI6IGZ1bmN0aW9uKG1heE51bWJlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc1ByaW1pdGl2ZVZhbHVlKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmxvb2tzTGlrZU51bWJlcih2YWx1ZSkpIHJldHVybiAnTk9UX05VTUJFUic7XG5cbiAgICAgICAgICAgIGlmICggK3ZhbHVlID4gK21heE51bWJlciApIHJldHVybiAnVE9PX0hJR0gnO1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goK3ZhbHVlKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbWluX251bWJlcjogZnVuY3Rpb24obWluTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG4gICAgICAgICAgICBpZiAoIXV0aWwubG9va3NMaWtlTnVtYmVyKHZhbHVlKSkgcmV0dXJuICdOT1RfTlVNQkVSJztcblxuICAgICAgICAgICAgaWYgKCArdmFsdWUgPCArbWluTnVtYmVyICkgcmV0dXJuICdUT09fTE9XJztcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCt2YWx1ZSk7XG5cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbnVtYmVyX2JldHdlZW46IGZ1bmN0aW9uKG1pbk51bWJlciwgbWF4TnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG4gICAgICAgICAgICBpZiAoIXV0aWwubG9va3NMaWtlTnVtYmVyKHZhbHVlKSkgcmV0dXJuICdOT1RfTlVNQkVSJztcblxuICAgICAgICAgICAgaWYgKCArdmFsdWUgPCArbWluTnVtYmVyICkgcmV0dXJuICdUT09fTE9XJztcbiAgICAgICAgICAgIGlmICggK3ZhbHVlID4gK21heE51bWJlciApIHJldHVybiAnVE9PX0hJR0gnO1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goK3ZhbHVlKTtcbiAgICAgICAgfTtcbiAgICB9LFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGVtYWlsOiBmdW5jdGlvbigpIHtcbiAgICAgICB2YXIgZW1haWxSZSA9IC9eKFtcXHdcXC1fK10rKD86XFwuW1xcd1xcLV8rXSspKilAKCg/OltcXHdcXC1dK1xcLikqXFx3W1xcd1xcLV17MCw2Nn0pXFwuKFthLXpdezIsNn0oPzpcXC5bYS16XXsyfSk/KSQvaTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc1ByaW1pdGl2ZVZhbHVlKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggISBlbWFpbFJlLnRlc3QodmFsdWUpICkgcmV0dXJuICdXUk9OR19FTUFJTCc7XG4gICAgICAgICAgICBpZiAoIC9cXEAuKlxcQC8udGVzdCh2YWx1ZSkgKSByZXR1cm4gJ1dST05HX0VNQUlMJztcbiAgICAgICAgICAgIGlmICggL1xcQC4qXy8udGVzdCh2YWx1ZSkgKSByZXR1cm4gJ1dST05HX0VNQUlMJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZXF1YWxfdG9fZmllbGQ6IGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNQcmltaXRpdmVWYWx1ZSh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgaWYgKCB2YWx1ZSAhPSBwYXJhbXNbZmllbGRdICkgcmV0dXJuICdGSUVMRFNfTk9UX0VRVUFMJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdXJsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHVybFJlU3RyID0gJ14oPzooPzpodHRwfGh0dHBzKTovLykoPzpcXFxcUysoPzo6XFxcXFMqKT9AKT8oPzooPzooPzpbMS05XVxcXFxkP3wxXFxcXGRcXFxcZHwyWzAtMV1cXFxcZHwyMlswLTNdKSg/OlxcXFwuKD86MT9cXFxcZHsxLDJ9fDJbMC00XVxcXFxkfDI1WzAtNV0pKXsyfSg/OlxcXFwuKD86WzAtOV1cXFxcZD98MVxcXFxkXFxcXGR8MlswLTRdXFxcXGR8MjVbMC00XSkpfCg/Oig/OlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XS0qKSpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZjAtOV0rKSg/OlxcXFwuKD86W2EtelxcXFx1MDBhMS1cXFxcdWZmZmYwLTldLSopKlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XSspKig/OlxcXFwuKD86W2EtelxcXFx1MDBhMS1cXFxcdWZmZmZdezIsfSkpKVxcXFwuP3xsb2NhbGhvc3QpKD86OlxcXFxkezIsNX0pPyg/OlsvPyNdXFxcXFMqKT8kJztcbiAgICAgICAgdmFyIHVybFJlID0gbmV3IFJlZ0V4cCh1cmxSZVN0ciwgJ2knKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc1ByaW1pdGl2ZVZhbHVlKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoIDwgMjA4MyAmJiB1cmxSZS50ZXN0KHZhbHVlKSkgcmV0dXJuO1xuICAgICAgICAgICAgcmV0dXJuICdXUk9OR19VUkwnO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBpc29fZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhciBtYXRjaGVkID0gdmFsdWUubWF0Y2goL14oXFxkezR9KS0oWzAtMV1bMC05XSktKFswLTNdWzAtOV0pJC8pO1xuXG4gICAgICAgICAgICBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgICAgICAgIHZhciBlcG9jaCA9IERhdGUucGFyc2UodmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmICghZXBvY2ggJiYgZXBvY2ggIT09IDApIHJldHVybiAnV1JPTkdfREFURSc7XG5cbiAgICAgICAgICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKGVwb2NoKTtcbiAgICAgICAgICAgICAgICBkLnNldFRpbWUoIGQuZ2V0VGltZSgpICsgZC5nZXRUaW1lem9uZU9mZnNldCgpICogNjAgKiAxMDAwICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIGQuZ2V0RnVsbFllYXIoKSA9PSBtYXRjaGVkWzFdICYmIGQuZ2V0TW9udGgoKSsxID09ICttYXRjaGVkWzJdICYmIGQuZ2V0RGF0ZSgpID09ICttYXRjaGVkWzNdICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJ1dST05HX0RBVEUnO1xuICAgICAgICB9O1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9ICB7XG4gICAgc3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHZhbHVlKycnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZXE6IGZ1bmN0aW9uKGFsbG93ZWRWYWx1ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNQcmltaXRpdmVWYWx1ZSh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgaWYgKCB2YWx1ZSsnJyA9PT0gYWxsb3dlZFZhbHVlKycnICkge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKGFsbG93ZWRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJ05PVF9BTExPV0VEX1ZBTFVFJztcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgb25lX29mOiBmdW5jdGlvbihhbGxvd2VkVmFsdWVzKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhbGxvd2VkVmFsdWVzKSkge1xuICAgICAgICAgICAgYWxsb3dlZFZhbHVlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBhbGxvd2VkVmFsdWVzLnBvcCgpOyAvLyBwb3AgcnVsZUJ1aWxkZXJzXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNQcmltaXRpdmVWYWx1ZSh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGFsbG93ZWRWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIHZhbHVlKycnID09PSBhbGxvd2VkVmFsdWVzW2ldKycnICkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChhbGxvd2VkVmFsdWVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICdOT1RfQUxMT1dFRF9WQUxVRSc7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG1heF9sZW5ndGg6IGZ1bmN0aW9uKG1heExlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNQcmltaXRpdmVWYWx1ZSh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IG1heExlbmd0aCApIHJldHVybiAnVE9PX0xPTkcnO1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2godmFsdWUpO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBtaW5fbGVuZ3RoOiBmdW5jdGlvbihtaW5MZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPCBtaW5MZW5ndGggKSByZXR1cm4gJ1RPT19TSE9SVCc7XG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCh2YWx1ZSk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxlbmd0aF9lcXVhbDogZnVuY3Rpb24obGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc1ByaW1pdGl2ZVZhbHVlKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoIDwgbGVuZ3RoICkgcmV0dXJuICdUT09fU0hPUlQnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPiBsZW5ndGggKSByZXR1cm4gJ1RPT19MT05HJztcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHZhbHVlKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGVuZ3RoX2JldHdlZW46IGZ1bmN0aW9uKG1pbkxlbmd0aCwgbWF4TGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc1ByaW1pdGl2ZVZhbHVlKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoIDwgbWluTGVuZ3RoICkgcmV0dXJuICdUT09fU0hPUlQnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPiBtYXhMZW5ndGggKSByZXR1cm4gJ1RPT19MT05HJztcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHZhbHVlKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGlrZTogZnVuY3Rpb24ocmVTdHIsIGZsYWdzKSB7XG4gICAgICAgIHZhciBpc0lnbm9yZUNhc2UgPSBhcmd1bWVudHMubGVuZ3RoID09PSAzICYmIGZsYWdzLm1hdGNoKCdpJyk7XG4gICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAocmVTdHIsIGlzSWdub3JlQ2FzZSA/ICdpJyA6ICcnICk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhdmFsdWUubWF0Y2gocmUpICkgcmV0dXJuICdXUk9OR19GT1JNQVQnO1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2godmFsdWUpO1xuICAgICAgICB9O1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbnZhciBERUZBVUxUX1JVTEVTID0ge307XG52YXIgSVNfREVGQVVMVF9BVVRPX1RSSU0gPSAwO1xuXG5mdW5jdGlvbiBWYWxpZGF0b3IobGl2clJ1bGVzLCBpc0F1dG9UcmltKSB7XG4gICAgdGhpcy5pc1ByZXBhcmVkID0gZmFsc2U7XG4gICAgdGhpcy5saXZyUnVsZXMgICA9IGxpdnJSdWxlcztcbiAgICB0aGlzLnZhbGlkYXRvcnMgID0ge307XG4gICAgdGhpcy52YWxpZGF0b3JCdWlsZGVycyA9IHt9O1xuICAgIHRoaXMuZXJyb3JzID0gbnVsbDtcblxuICAgIGlmICggaXNBdXRvVHJpbSAhPT0gbnVsbCAmJiBpc0F1dG9UcmltICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIHRoaXMuaXNBdXRvVHJpbSA9IGlzQXV0b1RyaW07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pc0F1dG9UcmltID0gSVNfREVGQVVMVF9BVVRPX1RSSU07XG4gICAgfVxuXG4gICAgdGhpcy5yZWdpc3RlclJ1bGVzKERFRkFVTFRfUlVMRVMpO1xufVxuXG5WYWxpZGF0b3IucmVnaXN0ZXJEZWZhdWx0UnVsZXMgPSBmdW5jdGlvbihydWxlcykge1xuICAgIGZvciAodmFyIHJ1bGVOYW1lIGluIHJ1bGVzKSB7XG4gICAgICAgIERFRkFVTFRfUlVMRVNbcnVsZU5hbWVdID0gcnVsZXNbcnVsZU5hbWVdO1xuICAgIH1cbn07XG5cblZhbGlkYXRvci5nZXREZWZhdWx0UnVsZXMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gREVGQVVMVF9SVUxFUztcbn07XG5cblZhbGlkYXRvci5yZWdpc3RlckFsaWFzZWREZWZhdWx0UnVsZSA9IGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgaWYgKCFhbGlhcy5uYW1lKSB0aHJvdyAnQWxpYXMgbmFtZSByZXF1aXJlZCc7XG5cbiAgICBERUZBVUxUX1JVTEVTW2FsaWFzLm5hbWVdID0gVmFsaWRhdG9yLl9idWlsZEFsaWFzZWRSdWxlKGFsaWFzKTtcbn07XG5cblZhbGlkYXRvci5fYnVpbGRBbGlhc2VkUnVsZSA9IGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgaWYgKCFhbGlhcy5uYW1lKSB0aHJvdyAnQWxpYXMgbmFtZSByZXF1aXJlZCc7XG4gICAgaWYgKCFhbGlhcy5ydWxlcykgdGhyb3cgJ0FsaWFzIHJ1bGVzIHJlcXVpcmVkJztcblxuICAgIHZhciBsaXZyID0ge3ZhbHVlOiBhbGlhcy5ydWxlc307XG5cbiAgICByZXR1cm4gZnVuY3Rpb24ocnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCB2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIgKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsaWRhdG9yLnZhbGlkYXRlKHt2YWx1ZTogdmFsdWV9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxpYXMuZXJyb3IgfHwgdmFsaWRhdG9yLmdldEVycm9ycygpLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG59O1xuXG5cblZhbGlkYXRvci5kZWZhdWx0QXV0b1RyaW0gPSBmdW5jdGlvbihpc0F1dG9UcmltKSB7XG4gICAgSVNfREVGQVVMVF9BVVRPX1RSSU0gPSAhIWlzQXV0b1RyaW07XG59O1xuXG5WYWxpZGF0b3IucHJvdG90eXBlID0ge1xuICAgIHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYWxsUnVsZXMgPSB0aGlzLmxpdnJSdWxlcztcblxuICAgICAgICBmb3IgKHZhciBmaWVsZCBpbiBhbGxSdWxlcykge1xuICAgICAgICAgICAgdmFyIGZpZWxkUnVsZXMgPSBhbGxSdWxlc1tmaWVsZF07XG5cbiAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoZmllbGRSdWxlcykgKSB7XG4gICAgICAgICAgICAgICAgZmllbGRSdWxlcyA9IFtmaWVsZFJ1bGVzXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHZhbGlkYXRvcnMgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGZpZWxkUnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkID0gdGhpcy5fcGFyc2VSdWxlKGZpZWxkUnVsZXNbaV0pO1xuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnMucHVzaCggdGhpcy5fYnVpbGRWYWxpZGF0b3IocGFyc2VkLm5hbWUsIHBhcnNlZC5hcmdzKSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvcnNbZmllbGRdID0gdmFsaWRhdG9ycztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaXNQcmVwYXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNQcmVwYXJlZCkgdGhpcy5wcmVwYXJlKCk7XG5cbiAgICAgICAgaWYgKCEgdXRpbC5pc09iamVjdChkYXRhKSApIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gJ0ZPUk1BVF9FUlJPUic7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHRoaXMuaXNBdXRvVHJpbSApIHtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9hdXRvVHJpbShkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSB7fSwgcmVzdWx0ID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgZmllbGROYW1lIGluIHRoaXMudmFsaWRhdG9ycykge1xuICAgICAgICAgICAgdmFyIHZhbGlkYXRvcnMgPSB0aGlzLnZhbGlkYXRvcnNbZmllbGROYW1lXTtcbiAgICAgICAgICAgIGlmICghdmFsaWRhdG9ycyB8fCAhdmFsaWRhdG9ycy5sZW5ndGgpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2ZpZWxkTmFtZV07XG5cbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTx2YWxpZGF0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkUmVzdWx0QXJyID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgZXJyQ29kZSA9IHZhbGlkYXRvcnNbaV0oXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5oYXNPd25Qcm9wZXJ0eShmaWVsZE5hbWUpID8gcmVzdWx0W2ZpZWxkTmFtZV0gOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZmllbGRSZXN1bHRBcnJcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVyckNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzW2ZpZWxkTmFtZV0gPSBlcnJDb2RlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBmaWVsZFJlc3VsdEFyci5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtmaWVsZE5hbWVdID0gZmllbGRSZXN1bHRBcnJbMF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggZGF0YS5oYXNPd25Qcm9wZXJ0eShmaWVsZE5hbWUpICYmICFyZXN1bHQuaGFzT3duUHJvcGVydHkoZmllbGROYW1lKSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbC5pc0VtcHR5T2JqZWN0KGVycm9ycykpIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IGVycm9ycztcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgfSxcblxuICAgIGdldEVycm9yczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVycm9ycztcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXJSdWxlczogZnVuY3Rpb24ocnVsZXMpIHtcbiAgICAgICAgZm9yICh2YXIgcnVsZU5hbWUgaW4gcnVsZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yQnVpbGRlcnNbcnVsZU5hbWVdID0gcnVsZXNbcnVsZU5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyQWxpYXNlZFJ1bGU6IGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgICAgIGlmICghYWxpYXMubmFtZSkgdGhyb3cgJ0FsaWFzIG5hbWUgcmVxdWlyZWQnO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzW2FsaWFzLm5hbWVdID0gVmFsaWRhdG9yLl9idWlsZEFsaWFzZWRSdWxlKGFsaWFzKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgZ2V0UnVsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0b3JCdWlsZGVycztcbiAgICB9LFxuXG4gICAgX3BhcnNlUnVsZTogZnVuY3Rpb24obGl2clJ1bGUpIHtcbiAgICAgICAgdmFyIG5hbWUsIGFyZ3M7XG5cbiAgICAgICAgaWYgKCB1dGlsLmlzT2JqZWN0KGxpdnJSdWxlKSApIHtcbiAgICAgICAgICAgIG5hbWUgPSBPYmplY3Qua2V5cyhsaXZyUnVsZSlbMF07XG4gICAgICAgICAgICBhcmdzID0gbGl2clJ1bGVbIG5hbWUgXTtcblxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkoYXJncykgKSBhcmdzID0gW2FyZ3NdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmFtZSA9IGxpdnJSdWxlO1xuICAgICAgICAgICAgYXJncyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtuYW1lOiBuYW1lLCBhcmdzOiBhcmdzfTtcbiAgICB9LFxuXG4gICAgX2J1aWxkVmFsaWRhdG9yOiBmdW5jdGlvbihuYW1lLCBhcmdzKSAge1xuXG4gICAgICAgIGlmICggIXRoaXMudmFsaWRhdG9yQnVpbGRlcnNbbmFtZV0gKSB7XG4gICAgICAgICAgICB0aHJvdyAnUnVsZSBbJyArIG5hbWUgKyAnXSBub3QgcmVnaXN0ZXJlZCc7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWxsQXJncyA9IFtdO1xuXG4gICAgICAgIGFsbEFyZ3MucHVzaC5hcHBseShhbGxBcmdzLCBhcmdzKTtcbiAgICAgICAgYWxsQXJncy5wdXNoKCB0aGlzLmdldFJ1bGVzKCkgKTtcblxuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0b3JCdWlsZGVyc1tuYW1lXS5hcHBseShudWxsLCBhbGxBcmdzKTtcbiAgICB9LFxuXG4gICAgX2F1dG9UcmltOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBkYXRhVHlwZSA9IHR5cGVvZiBkYXRhO1xuXG4gICAgICAgIGlmICggZGF0YVR5cGUgIT09ICdvYmplY3QnICYmIGRhdGEgKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5yZXBsYWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvXlxccyovLCAnJykucmVwbGFjZSgvXFxzKiQvLCAnJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCBkYXRhVHlwZSA9PSAnb2JqZWN0JyAmJiBBcnJheS5pc0FycmF5KGRhdGEpICkge1xuICAgICAgICAgICAgdmFyIHRyaW1tZWREYXRhID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRyaW1tZWREYXRhW2ldID0gdGhpcy5fYXV0b1RyaW0oIGRhdGFbaV0gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWREYXRhO1xuICAgICAgICB9IGVsc2UgaWYgKCBkYXRhVHlwZSA9PSAnb2JqZWN0JyAmJiB1dGlsLmlzT2JqZWN0KGRhdGEpICkge1xuICAgICAgICAgICAgdmFyIHRyaW1tZWREYXRhID0ge307XG5cbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmhhc093blByb3BlcnR5KGtleSkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyaW1tZWREYXRhW2tleV0gPSB0aGlzLl9hdXRvVHJpbSggZGF0YVtrZXldICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJpbW1lZERhdGE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNQcmltaXRpdmVWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbHVlKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICBsb29rc0xpa2VOdW1iZXI6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAoISBpc05hTigrdmFsdWUpICkgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgaXNPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdChvYmopID09PSBvYmogJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikgPT09IE9iamVjdC5wcm90b3R5cGU7XG4gICAgfSxcblxuICAgIGlzRW1wdHlPYmplY3Q6IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gbWFwKSB7XG4gICAgICAgICAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGVzY2FwZVJlZ0V4cDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1tcXC1cXFtcXF1cXC9cXHtcXH1cXChcXClcXCpcXCtcXD9cXC5cXFxcXFxeXFwkXFx8XS9nLCBcIlxcXFwkJlwiKTtcbiAgICB9LFxuXG4gICAgaXNOb1ZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJyc7XG4gICAgfVxufTtcbiIsIndpbmRvdy5MSVZSID0gcmVxdWlyZShcIi4uL2xpYi9MSVZSXCIpOyJdfQ==
