(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

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
    url:              LIVR.rules.special.url,
    iso_date:         LIVR.rules.special.iso_date,

    nested_object:    LIVR.rules.helper.nested_object,
    list_of:          LIVR.rules.helper.list_of,
    list_of_objects:  LIVR.rules.helper.list_of_objects,
    list_of_different_objects: LIVR.rules.helper.list_of_different_objects,

    trim:             LIVR.rules.filters.trim,
    to_lc:            LIVR.rules.filters.to_lc,
    to_uc:            LIVR.rules.filters.to_uc,
    remove:           LIVR.rules.filters.remove,
    leave_only:       LIVR.rules.filters.leave_only
});

module.exports = LIVR;

},{"./LIVR/Rules/Common":2,"./LIVR/Rules/Filters":3,"./LIVR/Rules/Helper":4,"./LIVR/Rules/Numeric":5,"./LIVR/Rules/Special":6,"./LIVR/Rules/String":7,"./LIVR/Validator":8}],2:[function(require,module,exports){
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
            if (! Array.isArray(list) ) return 'WRONG_FORMAT';
            if (list.length < 1) return 'CANNOT_BE_EMPTY';
            return;
        };
    },
};

},{"../util":9}],3:[function(require,module,exports){
'use strict';

var util = require('../util');

module.exports = {
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
},{"../util":9}],4:[function(require,module,exports){
'use strict';

var Validator = require('../Validator');
var util = require('../util');

module.exports = {
    nested_object: function(livr, ruleBuilders) {
        var validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return function(nestedObject, params, outputArr) {
            if ( util.isNoValue(nestedObject) ) return;
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
        if (! Array.isArray(rules) ) {
            rules = Array.prototype.slice.call(arguments);
            ruleBuilders = rules.pop();
        }

        var livr = { field: rules };
        var validator = new Validator(livr).registerRules(ruleBuilders).prepare();

        return function(values, params, outputArr) {
            if ( util.isNoValue(values) ) return;

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
            if ( util.isNoValue(objects) ) return;
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
            if ( util.isNoValue(objects) ) return;
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
},{"../Validator":8,"../util":9}],5:[function(require,module,exports){
'use strict';

var util = require('../util');

module.exports = {
    integer: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( !value.match(/^\-?[0-9]+$/) ) return 'NOT_INTEGER';
            return;
        };
    },

    positive_integer: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! /^[1-9][0-9]*$/.test(value) ) return 'NOT_POSITIVE_INTEGER';
            return;
        };
    },

    decimal: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! /^(?:\-?(?:[0-9]+\.[0-9]+)|(?:[0-9]+))$/.test(value) ) return 'NOT_DECIMAL';
            return;
        };
    },

    positive_decimal: function() {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! /^(?:(?:[0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value) ) return 'NOT_POSITIVE_DECIMAL';
            return;
        };
    },

    max_number: function(maxNumber) {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if ( +value > +maxNumber ) return 'TOO_HIGH';
            return;
        };
    },

    min_number: function(minNumber) {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if ( +value < +minNumber ) return 'TOO_LOW';
            return;

        };
    },

    number_between: function(minNumber, maxNumber) {
        return function(value) {
            if ( util.isNoValue(value) ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if ( +value < +minNumber ) return 'TOO_LOW';
            if ( +value > +maxNumber ) return 'TOO_HIGH';
            return;
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
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

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
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if ( value != params[field] ) return 'FIELDS_NOT_EQUAL';
            return;
        };
    },

    url: function() {
        var urlReStr = '^(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
        var urlRe = new RegExp(urlReStr, 'i');

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if (value.length < 2083 && urlRe.test(value)) return;
            return 'WRONG_URL';
        };
    },

    iso_date: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

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
    one_of: function(allowedValues) {
        if (!Array.isArray(allowedValues)) {
            allowedValues = Array.prototype.slice.call(arguments);
            allowedValues.pop(); // pop ruleBuilders
        }

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

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
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length > maxLength ) return 'TOO_LONG';
            return;
        };
    },

    min_length: function(minLength) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            return;
        };
    },

    length_equal: function(length) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length < length ) return 'TOO_SHORT';
            if ( value.length > length ) return 'TOO_LONG';
            return;
        };
    },

    length_between: function(minLength, maxLength) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( value.length < minLength ) return 'TOO_SHORT';
            if ( value.length > maxLength ) return 'TOO_LONG';
            return;
        };
    },

    like: function(reStr, flags) {
        var isIgnoreCase = arguments.length === 3 && flags.match('i');
        var re = new RegExp(reStr, isIgnoreCase ? 'i' : '' );

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( !value.match(re) ) return 'WRONG_FORMAT';
            return;
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
                } else if ( data.hasOwnProperty(fieldName) ) {
                    if ( fieldResultArr.length ) {
                        result[fieldName] = fieldResultArr[0];
                    } else if ( ! result.hasOwnProperty(fieldName) ) {
                        result[fieldName] = value;
                    }
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
    isNumberOrString: function (value) {
        if (typeof value == 'string') return true;
        if (typeof value == 'number' && isFinite(value)) return true;
        return false;
    },

    isObject: function (obj) {
        // TODO make better checking
        return obj === Object(obj);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTElWUi5qcyIsImxpYi9MSVZSL1J1bGVzL0NvbW1vbi5qcyIsImxpYi9MSVZSL1J1bGVzL0ZpbHRlcnMuanMiLCJsaWIvTElWUi9SdWxlcy9IZWxwZXIuanMiLCJsaWIvTElWUi9SdWxlcy9OdW1lcmljLmpzIiwibGliL0xJVlIvUnVsZXMvU3BlY2lhbC5qcyIsImxpYi9MSVZSL1J1bGVzL1N0cmluZy5qcyIsImxpYi9MSVZSL1ZhbGlkYXRvci5qcyIsImxpYi9MSVZSL3V0aWwuanMiLCJzY3JpcHRzL2Jyb3dzZXJpZnlfZW50cnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTElWUiA9IHtydWxlczoge319O1xuXG5MSVZSLnJ1bGVzLmNvbW1vbiAgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvQ29tbW9uJyk7XG5MSVZSLnJ1bGVzLnN0cmluZyAgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvU3RyaW5nJyk7XG5MSVZSLnJ1bGVzLm51bWVyaWMgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvTnVtZXJpYycpO1xuTElWUi5ydWxlcy5zcGVjaWFsID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL1NwZWNpYWwnKTtcbkxJVlIucnVsZXMuaGVscGVyICA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9IZWxwZXInKTtcbkxJVlIucnVsZXMuZmlsdGVycyA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9GaWx0ZXJzJyk7XG5cbkxJVlIuVmFsaWRhdG9yID0gcmVxdWlyZSgnLi9MSVZSL1ZhbGlkYXRvcicpO1xuXG5MSVZSLlZhbGlkYXRvci5yZWdpc3RlckRlZmF1bHRSdWxlcyh7XG4gICAgcmVxdWlyZWQ6ICAgICAgICAgTElWUi5ydWxlcy5jb21tb24ucmVxdWlyZWQsXG4gICAgbm90X2VtcHR5OiAgICAgICAgTElWUi5ydWxlcy5jb21tb24ubm90X2VtcHR5LFxuICAgIG5vdF9lbXB0eV9saXN0OiAgIExJVlIucnVsZXMuY29tbW9uLm5vdF9lbXB0eV9saXN0LFxuXG4gICAgb25lX29mOiAgICAgICAgICAgTElWUi5ydWxlcy5zdHJpbmcub25lX29mLFxuICAgIG1heF9sZW5ndGg6ICAgICAgIExJVlIucnVsZXMuc3RyaW5nLm1heF9sZW5ndGgsXG4gICAgbWluX2xlbmd0aDogICAgICAgTElWUi5ydWxlcy5zdHJpbmcubWluX2xlbmd0aCxcbiAgICBsZW5ndGhfZXF1YWw6ICAgICBMSVZSLnJ1bGVzLnN0cmluZy5sZW5ndGhfZXF1YWwsXG4gICAgbGVuZ3RoX2JldHdlZW46ICAgTElWUi5ydWxlcy5zdHJpbmcubGVuZ3RoX2JldHdlZW4sXG4gICAgbGlrZTogICAgICAgICAgICAgTElWUi5ydWxlcy5zdHJpbmcubGlrZSxcblxuICAgIGludGVnZXI6ICAgICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5pbnRlZ2VyLFxuICAgIHBvc2l0aXZlX2ludGVnZXI6IExJVlIucnVsZXMubnVtZXJpYy5wb3NpdGl2ZV9pbnRlZ2VyLFxuICAgIGRlY2ltYWw6ICAgICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5kZWNpbWFsLFxuICAgIHBvc2l0aXZlX2RlY2ltYWw6IExJVlIucnVsZXMubnVtZXJpYy5wb3NpdGl2ZV9kZWNpbWFsLFxuICAgIG1heF9udW1iZXI6ICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5tYXhfbnVtYmVyLFxuICAgIG1pbl9udW1iZXI6ICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5taW5fbnVtYmVyLFxuICAgIG51bWJlcl9iZXR3ZWVuOiAgIExJVlIucnVsZXMubnVtZXJpYy5udW1iZXJfYmV0d2VlbixcblxuICAgIGVtYWlsOiAgICAgICAgICAgIExJVlIucnVsZXMuc3BlY2lhbC5lbWFpbCxcbiAgICBlcXVhbF90b19maWVsZDogICBMSVZSLnJ1bGVzLnNwZWNpYWwuZXF1YWxfdG9fZmllbGQsXG4gICAgdXJsOiAgICAgICAgICAgICAgTElWUi5ydWxlcy5zcGVjaWFsLnVybCxcbiAgICBpc29fZGF0ZTogICAgICAgICBMSVZSLnJ1bGVzLnNwZWNpYWwuaXNvX2RhdGUsXG5cbiAgICBuZXN0ZWRfb2JqZWN0OiAgICBMSVZSLnJ1bGVzLmhlbHBlci5uZXN0ZWRfb2JqZWN0LFxuICAgIGxpc3Rfb2Y6ICAgICAgICAgIExJVlIucnVsZXMuaGVscGVyLmxpc3Rfb2YsXG4gICAgbGlzdF9vZl9vYmplY3RzOiAgTElWUi5ydWxlcy5oZWxwZXIubGlzdF9vZl9vYmplY3RzLFxuICAgIGxpc3Rfb2ZfZGlmZmVyZW50X29iamVjdHM6IExJVlIucnVsZXMuaGVscGVyLmxpc3Rfb2ZfZGlmZmVyZW50X29iamVjdHMsXG5cbiAgICB0cmltOiAgICAgICAgICAgICBMSVZSLnJ1bGVzLmZpbHRlcnMudHJpbSxcbiAgICB0b19sYzogICAgICAgICAgICBMSVZSLnJ1bGVzLmZpbHRlcnMudG9fbGMsXG4gICAgdG9fdWM6ICAgICAgICAgICAgTElWUi5ydWxlcy5maWx0ZXJzLnRvX3VjLFxuICAgIHJlbW92ZTogICAgICAgICAgIExJVlIucnVsZXMuZmlsdGVycy5yZW1vdmUsXG4gICAgbGVhdmVfb25seTogICAgICAgTElWUi5ydWxlcy5maWx0ZXJzLmxlYXZlX29ubHlcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExJVlI7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVxdWlyZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnUkVRVUlSRUQnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG5vdF9lbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdDQU5OT1RfQkVfRU1QVFknO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG5vdF9lbXB0eV9saXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGxpc3QpIHtcbiAgICAgICAgICAgIGlmIChsaXN0ID09PSB1bmRlZmluZWQgfHwgbGlzdCA9PT0gJycpIHJldHVybiAnQ0FOTk9UX0JFX0VNUFRZJztcbiAgICAgICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkobGlzdCkgKSByZXR1cm4gJ1dST05HX0ZPUk1BVCc7XG4gICAgICAgICAgICBpZiAobGlzdC5sZW5ndGggPCAxKSByZXR1cm4gJ0NBTk5PVF9CRV9FTVBUWSc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB0cmltOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7IC8vIFRPRE8ganVzdCBkbyBub3QgdHJpbSBudW1iZXJzXG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCggdmFsdWUucmVwbGFjZSgvXlxccyovLCAnJykucmVwbGFjZSgvXFxzKiQvLCAnJykgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdG9fbGM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNraXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnRvTG93ZXJDYXNlKCkgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdG9fdWM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNraXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnRvVXBwZXJDYXNlKCkgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihjaGFycykge1xuICAgICAgICBjaGFycyA9IHV0aWwuZXNjYXBlUmVnRXhwKGNoYXJzKTtcbiAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cCggJ1snICsgY2hhcnMgKyAgJ10nLCAnZycgKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNraXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnJlcGxhY2UocmUsICcnKSApO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsZWF2ZV9vbmx5OiBmdW5jdGlvbihjaGFycykge1xuICAgICAgICBjaGFycyA9IHV0aWwuZXNjYXBlUmVnRXhwKGNoYXJzKTtcbiAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cCggJ1teJyArIGNoYXJzICsgICddJywgJ2cnICk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7IC8vIFRPRE8ganVzdCBza2lwIG51bWJlcnNcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCB2YWx1ZS5yZXBsYWNlKHJlLCAnJykgKTtcbiAgICAgICAgfTtcbiAgICB9LFxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBWYWxpZGF0b3IgPSByZXF1aXJlKCcuLi9WYWxpZGF0b3InKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBuZXN0ZWRfb2JqZWN0OiBmdW5jdGlvbihsaXZyLCBydWxlQnVpbGRlcnMpIHtcbiAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cikucmVnaXN0ZXJSdWxlcyhydWxlQnVpbGRlcnMpLnByZXBhcmUoKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obmVzdGVkT2JqZWN0LCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZShuZXN0ZWRPYmplY3QpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCB0eXBlb2YgbmVzdGVkT2JqZWN0ICE9PSAnb2JqZWN0JyApIHJldHVybiAnRk9STUFUX0VSUk9SJzsgLy9UT0RPIGNoZWNrIGlmIGhhc2hcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggbmVzdGVkT2JqZWN0ICk7XG5cbiAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsaWRhdG9yLmdldEVycm9ycygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsaXN0X29mOiBmdW5jdGlvbihydWxlcywgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkocnVsZXMpICkge1xuICAgICAgICAgICAgcnVsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcnVsZUJ1aWxkZXJzID0gcnVsZXMucG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGl2ciA9IHsgZmllbGQ6IHJ1bGVzIH07XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcywgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWVzKSApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkodmFsdWVzKSApIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBoYXNFcnJvcnMgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggeyBmaWVsZDogdmFsdWVzW2ldIH0gKTtcblxuICAgICAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0LmZpZWxkKTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3JzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goIHZhbGlkYXRvci5nZXRFcnJvcnMoKS5maWVsZCApO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIGhhc0Vycm9ycyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxpc3Rfb2Zfb2JqZWN0czogZnVuY3Rpb24obGl2ciwgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdHMsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKG9iamVjdHMpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkob2JqZWN0cykgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICAgICAgICB2YXIgaGFzRXJyb3JzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqZWN0cy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsaWRhdG9yLnZhbGlkYXRlKCBvYmplY3RzW2ldICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCB2YWxpZGF0b3IuZ2V0RXJyb3JzKCkgKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBoYXNFcnJvcnMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsaXN0X29mX2RpZmZlcmVudF9vYmplY3RzOiBmdW5jdGlvbihzZWxlY3RvckZpZWxkLCBsaXZycywgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3JzID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgc2VsZWN0b3JWYWx1ZSBpbiBsaXZycykge1xuICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cnNbc2VsZWN0b3JWYWx1ZV0pLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG4gICAgICAgICAgICB2YWxpZGF0b3JzW3NlbGVjdG9yVmFsdWVdID0gdmFsaWRhdG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdHMsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKG9iamVjdHMpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkob2JqZWN0cykgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICAgICAgICB2YXIgaGFzRXJyb3JzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqZWN0cy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICB2YXIgb2JqZWN0ID0gb2JqZWN0c1tpXTtcblxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9iamVjdCAhPSAnb2JqZWN0JyB8fCAhb2JqZWN0W3NlbGVjdG9yRmllbGRdIHx8ICF2YWxpZGF0b3JzWyBvYmplY3Rbc2VsZWN0b3JGaWVsZF0gXSApIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goJ0ZPUk1BVF9FUlJPUicpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRhdG9yID0gdmFsaWRhdG9yc1sgb2JqZWN0W3NlbGVjdG9yRmllbGRdIF07XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggb2JqZWN0ICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCB2YWxpZGF0b3IuZ2V0RXJyb3JzKCkgKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBoYXNFcnJvcnMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW50ZWdlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICF2YWx1ZS5tYXRjaCgvXlxcLT9bMC05XSskLykgKSByZXR1cm4gJ05PVF9JTlRFR0VSJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcG9zaXRpdmVfaW50ZWdlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgL15bMS05XVswLTldKiQvLnRlc3QodmFsdWUpICkgcmV0dXJuICdOT1RfUE9TSVRJVkVfSU5URUdFUic7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGRlY2ltYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhIC9eKD86XFwtPyg/OlswLTldK1xcLlswLTldKyl8KD86WzAtOV0rKSkkLy50ZXN0KHZhbHVlKSApIHJldHVybiAnTk9UX0RFQ0lNQUwnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBwb3NpdGl2ZV9kZWNpbWFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggISAvXig/Oig/OlswLTldKlxcLlswLTldKyl8KD86WzEtOV1bMC05XSopKSQvLnRlc3QodmFsdWUpICkgcmV0dXJuICdOT1RfUE9TSVRJVkVfREVDSU1BTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG1heF9udW1iZXI6IGZ1bmN0aW9uKG1heE51bWJlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGlmICggK3ZhbHVlID4gK21heE51bWJlciApIHJldHVybiAnVE9PX0hJR0gnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBtaW5fbnVtYmVyOiBmdW5jdGlvbihtaW5OdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBpZiAoICt2YWx1ZSA8ICttaW5OdW1iZXIgKSByZXR1cm4gJ1RPT19MT1cnO1xuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG51bWJlcl9iZXR3ZWVuOiBmdW5jdGlvbihtaW5OdW1iZXIsIG1heE51bWJlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGlmICggK3ZhbHVlIDwgK21pbk51bWJlciApIHJldHVybiAnVE9PX0xPVyc7XG4gICAgICAgICAgICBpZiAoICt2YWx1ZSA+ICttYXhOdW1iZXIgKSByZXR1cm4gJ1RPT19ISUdIJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBlbWFpbDogZnVuY3Rpb24oKSB7XG4gICAgICAgdmFyIGVtYWlsUmUgPSAvXihbXFx3XFwtXytdKyg/OlxcLltcXHdcXC1fK10rKSopQCgoPzpbXFx3XFwtXStcXC4pKlxcd1tcXHdcXC1dezAsNjZ9KVxcLihbYS16XXsyLDZ9KD86XFwuW2Etel17Mn0pPykkL2k7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgZW1haWxSZS50ZXN0KHZhbHVlKSApIHJldHVybiAnV1JPTkdfRU1BSUwnO1xuICAgICAgICAgICAgaWYgKCAvXFxALipcXEAvLnRlc3QodmFsdWUpICkgcmV0dXJuICdXUk9OR19FTUFJTCc7XG4gICAgICAgICAgICBpZiAoIC9cXEAuKl8vLnRlc3QodmFsdWUpICkgcmV0dXJuICdXUk9OR19FTUFJTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGVxdWFsX3RvX2ZpZWxkOiBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGlmICggdmFsdWUgIT0gcGFyYW1zW2ZpZWxkXSApIHJldHVybiAnRklFTERTX05PVF9FUVVBTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHVybDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB1cmxSZVN0ciA9ICdeKD86KD86aHR0cHxodHRwcyk6Ly8pKD86XFxcXFMrKD86OlxcXFxTKik/QCk/KD86KD86KD86WzEtOV1cXFxcZD98MVxcXFxkXFxcXGR8MlswMV1cXFxcZHwyMlswLTNdKSg/OlxcXFwuKD86MT9cXFxcZHsxLDJ9fDJbMC00XVxcXFxkfDI1WzAtNV0pKXsyfSg/OlxcXFwuKD86WzAtOV1cXFxcZD98MVxcXFxkXFxcXGR8MlswLTRdXFxcXGR8MjVbMC00XSkpfCg/Oig/OlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XSstPykqW2EtelxcXFx1MDBhMS1cXFxcdWZmZmYwLTldKykoPzpcXFxcLig/OlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XSstPykqW2EtelxcXFx1MDBhMS1cXFxcdWZmZmYwLTldKykqKD86XFxcXC4oPzpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZl17Mix9KSkpfGxvY2FsaG9zdCkoPzo6XFxcXGR7Miw1fSk/KD86KC98XFxcXD98IylbXlxcXFxzXSopPyQnO1xuICAgICAgICB2YXIgdXJsUmUgPSBuZXcgUmVnRXhwKHVybFJlU3RyLCAnaScpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPCAyMDgzICYmIHVybFJlLnRlc3QodmFsdWUpKSByZXR1cm47XG4gICAgICAgICAgICByZXR1cm4gJ1dST05HX1VSTCc7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGlzb19kYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFyIG1hdGNoZWQgPSB2YWx1ZS5tYXRjaCgvXihcXGR7NH0pLShbMC0xXVswLTldKS0oWzAtM11bMC05XSkkLyk7XG5cbiAgICAgICAgICAgIGlmIChtYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVwb2NoID0gRGF0ZS5wYXJzZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFlcG9jaCAmJiBlcG9jaCAhPT0gMCkgcmV0dXJuICdXUk9OR19EQVRFJztcblxuICAgICAgICAgICAgICAgIHZhciBkID0gbmV3IERhdGUoZXBvY2gpO1xuICAgICAgICAgICAgICAgIGQuc2V0VGltZSggZC5nZXRUaW1lKCkgKyBkLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MCAqIDEwMDAgKTtcblxuICAgICAgICAgICAgICAgIGlmICggZC5nZXRGdWxsWWVhcigpID09IG1hdGNoZWRbMV0gJiYgZC5nZXRNb250aCgpKzEgPT0gK21hdGNoZWRbMl0gJiYgZC5nZXREYXRlKCkgPT0gK21hdGNoZWRbM10gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnV1JPTkdfREFURSc7XG4gICAgICAgIH07XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gIHtcbiAgICBvbmVfb2Y6IGZ1bmN0aW9uKGFsbG93ZWRWYWx1ZXMpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFsbG93ZWRWYWx1ZXMpKSB7XG4gICAgICAgICAgICBhbGxvd2VkVmFsdWVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGFsbG93ZWRWYWx1ZXMucG9wKCk7IC8vIHBvcCBydWxlQnVpbGRlcnNcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxhbGxvd2VkVmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB2YWx1ZSA9PSBhbGxvd2VkVmFsdWVzW2ldICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJ05PVF9BTExPV0VEX1ZBTFVFJztcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbWF4X2xlbmd0aDogZnVuY3Rpb24obWF4TGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPiBtYXhMZW5ndGggKSByZXR1cm4gJ1RPT19MT05HJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbWluX2xlbmd0aDogZnVuY3Rpb24obWluTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPCBtaW5MZW5ndGggKSByZXR1cm4gJ1RPT19TSE9SVCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxlbmd0aF9lcXVhbDogZnVuY3Rpb24obGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPCBsZW5ndGggKSByZXR1cm4gJ1RPT19TSE9SVCc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IGxlbmd0aCApIHJldHVybiAnVE9PX0xPTkcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsZW5ndGhfYmV0d2VlbjogZnVuY3Rpb24obWluTGVuZ3RoLCBtYXhMZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA8IG1pbkxlbmd0aCApIHJldHVybiAnVE9PX1NIT1JUJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoID4gbWF4TGVuZ3RoICkgcmV0dXJuICdUT09fTE9ORyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxpa2U6IGZ1bmN0aW9uKHJlU3RyLCBmbGFncykge1xuICAgICAgICB2YXIgaXNJZ25vcmVDYXNlID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiBmbGFncy5tYXRjaCgnaScpO1xuICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKHJlU3RyLCBpc0lnbm9yZUNhc2UgPyAnaScgOiAnJyApO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhdmFsdWUubWF0Y2gocmUpICkgcmV0dXJuICdXUk9OR19GT1JNQVQnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH1cbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgREVGQVVMVF9SVUxFUyA9IHt9O1xudmFyIElTX0RFRkFVTFRfQVVUT19UUklNID0gMDtcblxuZnVuY3Rpb24gVmFsaWRhdG9yKGxpdnJSdWxlcywgaXNBdXRvVHJpbSkge1xuICAgIHRoaXMuaXNQcmVwYXJlZCA9IGZhbHNlO1xuICAgIHRoaXMubGl2clJ1bGVzICAgPSBsaXZyUnVsZXM7XG4gICAgdGhpcy52YWxpZGF0b3JzICA9IHt9O1xuICAgIHRoaXMudmFsaWRhdG9yQnVpbGRlcnMgPSB7fTtcbiAgICB0aGlzLmVycm9ycyA9IG51bGw7XG5cbiAgICBpZiAoIGlzQXV0b1RyaW0gIT09IG51bGwgJiYgaXNBdXRvVHJpbSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICB0aGlzLmlzQXV0b1RyaW0gPSBpc0F1dG9UcmltO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaXNBdXRvVHJpbSA9IElTX0RFRkFVTFRfQVVUT19UUklNO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJSdWxlcyhERUZBVUxUX1JVTEVTKTtcbn1cblxuVmFsaWRhdG9yLnJlZ2lzdGVyRGVmYXVsdFJ1bGVzID0gZnVuY3Rpb24ocnVsZXMpIHtcbiAgICBmb3IgKHZhciBydWxlTmFtZSBpbiBydWxlcykge1xuICAgICAgICBERUZBVUxUX1JVTEVTW3J1bGVOYW1lXSA9IHJ1bGVzW3J1bGVOYW1lXTtcbiAgICB9XG59O1xuXG5WYWxpZGF0b3IuZ2V0RGVmYXVsdFJ1bGVzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIERFRkFVTFRfUlVMRVM7XG59O1xuXG5WYWxpZGF0b3IucmVnaXN0ZXJBbGlhc2VkRGVmYXVsdFJ1bGUgPSBmdW5jdGlvbihhbGlhcykge1xuICAgIGlmICghYWxpYXMubmFtZSkgdGhyb3cgJ0FsaWFzIG5hbWUgcmVxdWlyZWQnO1xuXG4gICAgREVGQVVMVF9SVUxFU1thbGlhcy5uYW1lXSA9IFZhbGlkYXRvci5fYnVpbGRBbGlhc2VkUnVsZShhbGlhcyk7XG59O1xuXG5WYWxpZGF0b3IuX2J1aWxkQWxpYXNlZFJ1bGUgPSBmdW5jdGlvbihhbGlhcykge1xuICAgIGlmICghYWxpYXMubmFtZSkgdGhyb3cgJ0FsaWFzIG5hbWUgcmVxdWlyZWQnO1xuICAgIGlmICghYWxpYXMucnVsZXMpIHRocm93ICdBbGlhcyBydWxlcyByZXF1aXJlZCc7XG5cbiAgICB2YXIgbGl2ciA9IHt2YWx1ZTogYWxpYXMucnVsZXN9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJ1bGVCdWlsZGVycykge1xuICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiggdmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyICkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSh7dmFsdWU6IHZhbHVlfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsaWFzLmVycm9yIHx8IHZhbGlkYXRvci5nZXRFcnJvcnMoKS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xufTtcblxuXG5WYWxpZGF0b3IuZGVmYXVsdEF1dG9UcmltID0gZnVuY3Rpb24oaXNBdXRvVHJpbSkge1xuICAgIElTX0RFRkFVTFRfQVVUT19UUklNID0gISFpc0F1dG9UcmltO1xufTtcblxuVmFsaWRhdG9yLnByb3RvdHlwZSA9IHtcbiAgICBwcmVwYXJlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFsbFJ1bGVzID0gdGhpcy5saXZyUnVsZXM7XG5cbiAgICAgICAgZm9yICh2YXIgZmllbGQgaW4gYWxsUnVsZXMpIHtcbiAgICAgICAgICAgIHZhciBmaWVsZFJ1bGVzID0gYWxsUnVsZXNbZmllbGRdO1xuXG4gICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KGZpZWxkUnVsZXMpICkge1xuICAgICAgICAgICAgICAgIGZpZWxkUnVsZXMgPSBbZmllbGRSdWxlc107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB2YWxpZGF0b3JzID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxmaWVsZFJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlZCA9IHRoaXMuX3BhcnNlUnVsZShmaWVsZFJ1bGVzW2ldKTtcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzLnB1c2goIHRoaXMuX2J1aWxkVmFsaWRhdG9yKHBhcnNlZC5uYW1lLCBwYXJzZWQuYXJncykgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy52YWxpZGF0b3JzW2ZpZWxkXSA9IHZhbGlkYXRvcnM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzUHJlcGFyZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgdmFsaWRhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUHJlcGFyZWQpIHRoaXMucHJlcGFyZSgpO1xuXG4gICAgICAgIGlmICghIHV0aWwuaXNPYmplY3QoZGF0YSkgKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9ICdGT1JNQVRfRVJST1InO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCB0aGlzLmlzQXV0b1RyaW0gKSB7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5fYXV0b1RyaW0oZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXJyb3JzID0ge30sIHJlc3VsdCA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGZpZWxkTmFtZSBpbiB0aGlzLnZhbGlkYXRvcnMpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZGF0b3JzID0gdGhpcy52YWxpZGF0b3JzW2ZpZWxkTmFtZV07XG4gICAgICAgICAgICBpZiAoIXZhbGlkYXRvcnMgfHwgIXZhbGlkYXRvcnMubGVuZ3RoKSBjb250aW51ZTtcblxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtmaWVsZE5hbWVdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8dmFsaWRhdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBmaWVsZFJlc3VsdEFyciA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVyckNvZGUgPSB2YWxpZGF0b3JzW2ldKFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuaGFzT3duUHJvcGVydHkoZmllbGROYW1lKSA/IHJlc3VsdFtmaWVsZE5hbWVdIDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkUmVzdWx0QXJyXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGlmIChlcnJDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yc1tmaWVsZE5hbWVdID0gZXJyQ29kZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggZGF0YS5oYXNPd25Qcm9wZXJ0eShmaWVsZE5hbWUpICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGZpZWxkUmVzdWx0QXJyLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtmaWVsZE5hbWVdID0gZmllbGRSZXN1bHRBcnJbMF07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoICEgcmVzdWx0Lmhhc093blByb3BlcnR5KGZpZWxkTmFtZSkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZmllbGROYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWwuaXNFbXB0eU9iamVjdChlcnJvcnMpKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSBlcnJvcnM7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgIH0sXG5cbiAgICBnZXRFcnJvcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lcnJvcnM7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyUnVsZXM6IGZ1bmN0aW9uKHJ1bGVzKSB7XG4gICAgICAgIGZvciAodmFyIHJ1bGVOYW1lIGluIHJ1bGVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzW3J1bGVOYW1lXSA9IHJ1bGVzW3J1bGVOYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICByZWdpc3RlckFsaWFzZWRSdWxlOiBmdW5jdGlvbihhbGlhcykge1xuICAgICAgICBpZiAoIWFsaWFzLm5hbWUpIHRocm93ICdBbGlhcyBuYW1lIHJlcXVpcmVkJztcbiAgICAgICAgdGhpcy52YWxpZGF0b3JCdWlsZGVyc1thbGlhcy5uYW1lXSA9IFZhbGlkYXRvci5fYnVpbGRBbGlhc2VkUnVsZShhbGlhcyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldFJ1bGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdG9yQnVpbGRlcnM7XG4gICAgfSxcblxuICAgIF9wYXJzZVJ1bGU6IGZ1bmN0aW9uKGxpdnJSdWxlKSB7XG4gICAgICAgIHZhciBuYW1lLCBhcmdzO1xuXG4gICAgICAgIGlmICggdXRpbC5pc09iamVjdChsaXZyUnVsZSkgKSB7XG4gICAgICAgICAgICBuYW1lID0gT2JqZWN0LmtleXMobGl2clJ1bGUpWzBdO1xuICAgICAgICAgICAgYXJncyA9IGxpdnJSdWxlWyBuYW1lIF07XG5cbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KGFyZ3MpICkgYXJncyA9IFthcmdzXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5hbWUgPSBsaXZyUnVsZTtcbiAgICAgICAgICAgIGFyZ3MgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7bmFtZTogbmFtZSwgYXJnczogYXJnc307XG4gICAgfSxcblxuICAgIF9idWlsZFZhbGlkYXRvcjogZnVuY3Rpb24obmFtZSwgYXJncykgIHtcblxuICAgICAgICBpZiAoICF0aGlzLnZhbGlkYXRvckJ1aWxkZXJzW25hbWVdICkge1xuICAgICAgICAgICAgdGhyb3cgJ1J1bGUgWycgKyBuYW1lICsgJ10gbm90IHJlZ2lzdGVyZWQnO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFsbEFyZ3MgPSBbXTtcblxuICAgICAgICBhbGxBcmdzLnB1c2guYXBwbHkoYWxsQXJncywgYXJncyk7XG4gICAgICAgIGFsbEFyZ3MucHVzaCggdGhpcy5nZXRSdWxlcygpICk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdG9yQnVpbGRlcnNbbmFtZV0uYXBwbHkobnVsbCwgYWxsQXJncyk7XG4gICAgfSxcblxuICAgIF9hdXRvVHJpbTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgZGF0YVR5cGUgPSB0eXBlb2YgZGF0YTtcblxuICAgICAgICBpZiAoIGRhdGFUeXBlICE9PSAnb2JqZWN0JyAmJiBkYXRhICkge1xuICAgICAgICAgICAgaWYgKGRhdGEucmVwbGFjZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLnJlcGxhY2UoL15cXHMqLywgJycpLnJlcGxhY2UoL1xccyokLywgJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICggZGF0YVR5cGUgPT0gJ29iamVjdCcgJiYgQXJyYXkuaXNBcnJheShkYXRhKSApIHtcbiAgICAgICAgICAgIHZhciB0cmltbWVkRGF0YSA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0cmltbWVkRGF0YVtpXSA9IHRoaXMuX2F1dG9UcmltKCBkYXRhW2ldICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cmltbWVkRGF0YTtcbiAgICAgICAgfSBlbHNlIGlmICggZGF0YVR5cGUgPT0gJ29iamVjdCcgJiYgdXRpbC5pc09iamVjdChkYXRhKSApIHtcbiAgICAgICAgICAgIHZhciB0cmltbWVkRGF0YSA9IHt9O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmICggZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpICkge1xuICAgICAgICAgICAgICAgICAgICB0cmltbWVkRGF0YVtrZXldID0gdGhpcy5fYXV0b1RyaW0oIGRhdGFba2V5XSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWREYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWYWxpZGF0b3I7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGlzTnVtYmVyT3JTdHJpbmc6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZSh2YWx1ZSkpIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIGlzT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIC8vIFRPRE8gbWFrZSBiZXR0ZXIgY2hlY2tpbmdcbiAgICAgICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gICAgfSxcblxuICAgIGlzRW1wdHlPYmplY3Q6IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gbWFwKSB7XG4gICAgICAgICAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGVzY2FwZVJlZ0V4cDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1tcXC1cXFtcXF1cXC9cXHtcXH1cXChcXClcXCpcXCtcXD9cXC5cXFxcXFxeXFwkXFx8XS9nLCBcIlxcXFwkJlwiKTtcbiAgICB9LFxuXG4gICAgaXNOb1ZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJyc7XG4gICAgfVxufTtcbiIsIndpbmRvdy5MSVZSID0gcmVxdWlyZShcIi4uL2xpYi9MSVZSXCIpOyJdfQ==
