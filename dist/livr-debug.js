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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL0NvbW1vbi5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL0ZpbHRlcnMuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi9SdWxlcy9IZWxwZXIuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi9SdWxlcy9OdW1lcmljLmpzIiwiL1VzZXJzL2tvb3JjaGlrL3dvcmsva29vcmNoaWsvanMtdmFsaWRhdG9yLWxpdnIvbGliL0xJVlIvUnVsZXMvU3BlY2lhbC5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL1N0cmluZy5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1ZhbGlkYXRvci5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL3V0aWwuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9zY3JpcHRzL2Jyb3dzZXJpZnlfZW50cnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIExJVlIgPSB7cnVsZXM6IHt9fTtcblxuTElWUi5ydWxlcy5jb21tb24gID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL0NvbW1vbicpO1xuTElWUi5ydWxlcy5zdHJpbmcgID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL1N0cmluZycpO1xuTElWUi5ydWxlcy5udW1lcmljID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL051bWVyaWMnKTtcbkxJVlIucnVsZXMuc3BlY2lhbCA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9TcGVjaWFsJyk7XG5MSVZSLnJ1bGVzLmhlbHBlciAgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvSGVscGVyJyk7XG5MSVZSLnJ1bGVzLmZpbHRlcnMgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvRmlsdGVycycpO1xuXG5MSVZSLlZhbGlkYXRvciA9IHJlcXVpcmUoJy4vTElWUi9WYWxpZGF0b3InKTtcblxuTElWUi5WYWxpZGF0b3IucmVnaXN0ZXJEZWZhdWx0UnVsZXMoe1xuICAgIHJlcXVpcmVkOiAgICAgICAgIExJVlIucnVsZXMuY29tbW9uLnJlcXVpcmVkLFxuICAgIG5vdF9lbXB0eTogICAgICAgIExJVlIucnVsZXMuY29tbW9uLm5vdF9lbXB0eSxcbiAgICBub3RfZW1wdHlfbGlzdDogICBMSVZSLnJ1bGVzLmNvbW1vbi5ub3RfZW1wdHlfbGlzdCxcblxuICAgIG9uZV9vZjogICAgICAgICAgIExJVlIucnVsZXMuc3RyaW5nLm9uZV9vZixcbiAgICBtYXhfbGVuZ3RoOiAgICAgICBMSVZSLnJ1bGVzLnN0cmluZy5tYXhfbGVuZ3RoLFxuICAgIG1pbl9sZW5ndGg6ICAgICAgIExJVlIucnVsZXMuc3RyaW5nLm1pbl9sZW5ndGgsXG4gICAgbGVuZ3RoX2VxdWFsOiAgICAgTElWUi5ydWxlcy5zdHJpbmcubGVuZ3RoX2VxdWFsLFxuICAgIGxlbmd0aF9iZXR3ZWVuOiAgIExJVlIucnVsZXMuc3RyaW5nLmxlbmd0aF9iZXR3ZWVuLFxuICAgIGxpa2U6ICAgICAgICAgICAgIExJVlIucnVsZXMuc3RyaW5nLmxpa2UsXG5cbiAgICBpbnRlZ2VyOiAgICAgICAgICBMSVZSLnJ1bGVzLm51bWVyaWMuaW50ZWdlcixcbiAgICBwb3NpdGl2ZV9pbnRlZ2VyOiBMSVZSLnJ1bGVzLm51bWVyaWMucG9zaXRpdmVfaW50ZWdlcixcbiAgICBkZWNpbWFsOiAgICAgICAgICBMSVZSLnJ1bGVzLm51bWVyaWMuZGVjaW1hbCxcbiAgICBwb3NpdGl2ZV9kZWNpbWFsOiBMSVZSLnJ1bGVzLm51bWVyaWMucG9zaXRpdmVfZGVjaW1hbCxcbiAgICBtYXhfbnVtYmVyOiAgICAgICBMSVZSLnJ1bGVzLm51bWVyaWMubWF4X251bWJlcixcbiAgICBtaW5fbnVtYmVyOiAgICAgICBMSVZSLnJ1bGVzLm51bWVyaWMubWluX251bWJlcixcbiAgICBudW1iZXJfYmV0d2VlbjogICBMSVZSLnJ1bGVzLm51bWVyaWMubnVtYmVyX2JldHdlZW4sXG5cbiAgICBlbWFpbDogICAgICAgICAgICBMSVZSLnJ1bGVzLnNwZWNpYWwuZW1haWwsXG4gICAgZXF1YWxfdG9fZmllbGQ6ICAgTElWUi5ydWxlcy5zcGVjaWFsLmVxdWFsX3RvX2ZpZWxkLFxuICAgIHVybDogICAgICAgICAgICAgIExJVlIucnVsZXMuc3BlY2lhbC51cmwsXG4gICAgaXNvX2RhdGU6ICAgICAgICAgTElWUi5ydWxlcy5zcGVjaWFsLmlzb19kYXRlLFxuXG4gICAgbmVzdGVkX29iamVjdDogICAgTElWUi5ydWxlcy5oZWxwZXIubmVzdGVkX29iamVjdCxcbiAgICBsaXN0X29mOiAgICAgICAgICBMSVZSLnJ1bGVzLmhlbHBlci5saXN0X29mLFxuICAgIGxpc3Rfb2Zfb2JqZWN0czogIExJVlIucnVsZXMuaGVscGVyLmxpc3Rfb2Zfb2JqZWN0cyxcbiAgICBsaXN0X29mX2RpZmZlcmVudF9vYmplY3RzOiBMSVZSLnJ1bGVzLmhlbHBlci5saXN0X29mX2RpZmZlcmVudF9vYmplY3RzLFxuXG4gICAgdHJpbTogICAgICAgICAgICAgTElWUi5ydWxlcy5maWx0ZXJzLnRyaW0sXG4gICAgdG9fbGM6ICAgICAgICAgICAgTElWUi5ydWxlcy5maWx0ZXJzLnRvX2xjLFxuICAgIHRvX3VjOiAgICAgICAgICAgIExJVlIucnVsZXMuZmlsdGVycy50b191YyxcbiAgICByZW1vdmU6ICAgICAgICAgICBMSVZSLnJ1bGVzLmZpbHRlcnMucmVtb3ZlLFxuICAgIGxlYXZlX29ubHk6ICAgICAgIExJVlIucnVsZXMuZmlsdGVycy5sZWF2ZV9vbmx5XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMSVZSO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlcXVpcmVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1JFUVVJUkVEJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBub3RfZW1wdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlID09PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiAnQ0FOTk9UX0JFX0VNUFRZJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBub3RfZW1wdHlfbGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihsaXN0KSB7XG4gICAgICAgICAgICBpZiAobGlzdCA9PT0gdW5kZWZpbmVkIHx8IGxpc3QgPT09ICcnKSByZXR1cm4gJ0NBTk5PVF9CRV9FTVBUWSc7XG4gICAgICAgICAgICBpZiAoISBBcnJheS5pc0FycmF5KGxpc3QpICkgcmV0dXJuICdXUk9OR19GT1JNQVQnO1xuICAgICAgICAgICAgaWYgKGxpc3QubGVuZ3RoIDwgMSkgcmV0dXJuICdDQU5OT1RfQkVfRU1QVFknO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdHJpbTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnOyAvLyBUT0RPIGp1c3QgZG8gbm90IHRyaW0gbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnJlcGxhY2UoL15cXHMqLywgJycpLnJlcGxhY2UoL1xccyokLywgJycpICk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRvX2xjOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7IC8vIFRPRE8ganVzdCBza2lwIG51bWJlcnNcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCB2YWx1ZS50b0xvd2VyQ2FzZSgpICk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRvX3VjOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7IC8vIFRPRE8ganVzdCBza2lwIG51bWJlcnNcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCB2YWx1ZS50b1VwcGVyQ2FzZSgpICk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24oY2hhcnMpIHtcbiAgICAgICAgY2hhcnMgPSB1dGlsLmVzY2FwZVJlZ0V4cChjaGFycyk7XG4gICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoICdbJyArIGNoYXJzICsgICddJywgJ2cnICk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7IC8vIFRPRE8ganVzdCBza2lwIG51bWJlcnNcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCB2YWx1ZS5yZXBsYWNlKHJlLCAnJykgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGVhdmVfb25seTogZnVuY3Rpb24oY2hhcnMpIHtcbiAgICAgICAgY2hhcnMgPSB1dGlsLmVzY2FwZVJlZ0V4cChjaGFycyk7XG4gICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoICdbXicgKyBjaGFycyArICAnXScsICdnJyApO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnOyAvLyBUT0RPIGp1c3Qgc2tpcCBudW1iZXJzXG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCggdmFsdWUucmVwbGFjZShyZSwgJycpICk7XG4gICAgICAgIH07XG4gICAgfSxcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVmFsaWRhdG9yID0gcmVxdWlyZSgnLi4vVmFsaWRhdG9yJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbmVzdGVkX29iamVjdDogZnVuY3Rpb24obGl2ciwgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5lc3RlZE9iamVjdCwgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUobmVzdGVkT2JqZWN0KSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICggdHlwZW9mIG5lc3RlZE9iamVjdCAhPT0gJ29iamVjdCcgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7IC8vVE9ETyBjaGVjayBpZiBoYXNoXG5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIG5lc3RlZE9iamVjdCApO1xuXG4gICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5nZXRFcnJvcnMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGlzdF9vZjogZnVuY3Rpb24ocnVsZXMsIHJ1bGVCdWlsZGVycykge1xuICAgICAgICBpZiAoISBBcnJheS5pc0FycmF5KHJ1bGVzKSApIHtcbiAgICAgICAgICAgIHJ1bGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHJ1bGVCdWlsZGVycyA9IHJ1bGVzLnBvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxpdnIgPSB7IGZpZWxkOiBydWxlcyB9O1xuICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZXMsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlcykgKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KHZhbHVlcykgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICAgICAgICB2YXIgaGFzRXJyb3JzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpPTA7IGk8dmFsdWVzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIHsgZmllbGQ6IHZhbHVlc1tpXSB9ICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdC5maWVsZCk7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCB2YWxpZGF0b3IuZ2V0RXJyb3JzKCkuZmllbGQgKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBoYXNFcnJvcnMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsaXN0X29mX29iamVjdHM6IGZ1bmN0aW9uKGxpdnIsIHJ1bGVCdWlsZGVycykge1xuICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3RzLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZShvYmplY3RzKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KG9iamVjdHMpICkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhc0Vycm9ycyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPG9iamVjdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggb2JqZWN0c1tpXSApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYXNFcnJvcnMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCggdmFsaWRhdG9yLmdldEVycm9ycygpICk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICggaGFzRXJyb3JzICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGlzdF9vZl9kaWZmZXJlbnRfb2JqZWN0czogZnVuY3Rpb24oc2VsZWN0b3JGaWVsZCwgbGl2cnMsIHJ1bGVCdWlsZGVycykge1xuICAgICAgICB2YXIgdmFsaWRhdG9ycyA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIHNlbGVjdG9yVmFsdWUgaW4gbGl2cnMpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnJzW3NlbGVjdG9yVmFsdWVdKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuICAgICAgICAgICAgdmFsaWRhdG9yc1tzZWxlY3RvclZhbHVlXSA9IHZhbGlkYXRvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3RzLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZShvYmplY3RzKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KG9iamVjdHMpICkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhc0Vycm9ycyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPG9iamVjdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9iamVjdCA9IG9iamVjdHNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBvYmplY3QgIT0gJ29iamVjdCcgfHwgIW9iamVjdFtzZWxlY3RvckZpZWxkXSB8fCAhdmFsaWRhdG9yc1sgb2JqZWN0W3NlbGVjdG9yRmllbGRdIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCdGT1JNQVRfRVJST1InKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IHZhbGlkYXRvcnNbIG9iamVjdFtzZWxlY3RvckZpZWxkXSBdO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIG9iamVjdCApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYXNFcnJvcnMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCggdmFsaWRhdG9yLmdldEVycm9ycygpICk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICggaGFzRXJyb3JzICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGludGVnZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhdmFsdWUubWF0Y2goL15cXC0/WzAtOV0rJC8pICkgcmV0dXJuICdOT1RfSU5URUdFUic7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHBvc2l0aXZlX2ludGVnZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhIC9eWzEtOV1bMC05XSokLy50ZXN0KHZhbHVlKSApIHJldHVybiAnTk9UX1BPU0lUSVZFX0lOVEVHRVInO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBkZWNpbWFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggISAvXig/OlxcLT8oPzpbMC05XStcXC5bMC05XSspfCg/OlswLTldKykpJC8udGVzdCh2YWx1ZSkgKSByZXR1cm4gJ05PVF9ERUNJTUFMJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcG9zaXRpdmVfZGVjaW1hbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgL14oPzooPzpbMC05XSpcXC5bMC05XSspfCg/OlsxLTldWzAtOV0qKSkkLy50ZXN0KHZhbHVlKSApIHJldHVybiAnTk9UX1BPU0lUSVZFX0RFQ0lNQUwnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBtYXhfbnVtYmVyOiBmdW5jdGlvbihtYXhOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBpZiAoICt2YWx1ZSA+ICttYXhOdW1iZXIgKSByZXR1cm4gJ1RPT19ISUdIJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbWluX251bWJlcjogZnVuY3Rpb24obWluTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgaWYgKCArdmFsdWUgPCArbWluTnVtYmVyICkgcmV0dXJuICdUT09fTE9XJztcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBudW1iZXJfYmV0d2VlbjogZnVuY3Rpb24obWluTnVtYmVyLCBtYXhOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBpZiAoICt2YWx1ZSA8ICttaW5OdW1iZXIgKSByZXR1cm4gJ1RPT19MT1cnO1xuICAgICAgICAgICAgaWYgKCArdmFsdWUgPiArbWF4TnVtYmVyICkgcmV0dXJuICdUT09fSElHSCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZW1haWw6IGZ1bmN0aW9uKCkge1xuICAgICAgIHZhciBlbWFpbFJlID0gL14oW1xcd1xcLV8rXSsoPzpcXC5bXFx3XFwtXytdKykqKUAoKD86W1xcd1xcLV0rXFwuKSpcXHdbXFx3XFwtXXswLDY2fSlcXC4oW2Etel17Miw2fSg/OlxcLlthLXpdezJ9KT8pJC9pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhIGVtYWlsUmUudGVzdCh2YWx1ZSkgKSByZXR1cm4gJ1dST05HX0VNQUlMJztcbiAgICAgICAgICAgIGlmICggL1xcQC4qXFxALy50ZXN0KHZhbHVlKSApIHJldHVybiAnV1JPTkdfRU1BSUwnO1xuICAgICAgICAgICAgaWYgKCAvXFxALipfLy50ZXN0KHZhbHVlKSApIHJldHVybiAnV1JPTkdfRU1BSUwnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBlcXVhbF90b19maWVsZDogZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBpZiAoIHZhbHVlICE9IHBhcmFtc1tmaWVsZF0gKSByZXR1cm4gJ0ZJRUxEU19OT1RfRVFVQUwnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB1cmw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdXJsUmVTdHIgPSAnXig/Oig/Omh0dHB8aHR0cHMpOi8vKSg/OlxcXFxTKyg/OjpcXFxcUyopP0ApPyg/Oig/Oig/OlsxLTldXFxcXGQ/fDFcXFxcZFxcXFxkfDJbMDFdXFxcXGR8MjJbMC0zXSkoPzpcXFxcLig/OjE/XFxcXGR7MSwyfXwyWzAtNF1cXFxcZHwyNVswLTVdKSl7Mn0oPzpcXFxcLig/OlswLTldXFxcXGQ/fDFcXFxcZFxcXFxkfDJbMC00XVxcXFxkfDI1WzAtNF0pKXwoPzooPzpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZjAtOV0rLT8pKlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XSspKD86XFxcXC4oPzpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZjAtOV0rLT8pKlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XSspKig/OlxcXFwuKD86W2EtelxcXFx1MDBhMS1cXFxcdWZmZmZdezIsfSkpKXxsb2NhbGhvc3QpKD86OlxcXFxkezIsNX0pPyg/OigvfFxcXFw/fCMpW15cXFxcc10qKT8kJztcbiAgICAgICAgdmFyIHVybFJlID0gbmV3IFJlZ0V4cCh1cmxSZVN0ciwgJ2knKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoIDwgMjA4MyAmJiB1cmxSZS50ZXN0KHZhbHVlKSkgcmV0dXJuO1xuICAgICAgICAgICAgcmV0dXJuICdXUk9OR19VUkwnO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBpc29fZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhciBtYXRjaGVkID0gdmFsdWUubWF0Y2goL14oXFxkezR9KS0oWzAtMV1bMC05XSktKFswLTNdWzAtOV0pJC8pO1xuXG4gICAgICAgICAgICBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgICAgICAgIHZhciBlcG9jaCA9IERhdGUucGFyc2UodmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmICghZXBvY2ggJiYgZXBvY2ggIT09IDApIHJldHVybiAnV1JPTkdfREFURSc7XG5cbiAgICAgICAgICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKGVwb2NoKTtcbiAgICAgICAgICAgICAgICBkLnNldFRpbWUoIGQuZ2V0VGltZSgpICsgZC5nZXRUaW1lem9uZU9mZnNldCgpICogNjAgKiAxMDAwICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIGQuZ2V0RnVsbFllYXIoKSA9PSBtYXRjaGVkWzFdICYmIGQuZ2V0TW9udGgoKSsxID09ICttYXRjaGVkWzJdICYmIGQuZ2V0RGF0ZSgpID09ICttYXRjaGVkWzNdICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJ1dST05HX0RBVEUnO1xuICAgICAgICB9O1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9ICB7XG4gICAgb25lX29mOiBmdW5jdGlvbihhbGxvd2VkVmFsdWVzKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhbGxvd2VkVmFsdWVzKSkge1xuICAgICAgICAgICAgYWxsb3dlZFZhbHVlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBhbGxvd2VkVmFsdWVzLnBvcCgpOyAvLyBwb3AgcnVsZUJ1aWxkZXJzXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8YWxsb3dlZFZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICggdmFsdWUgPT0gYWxsb3dlZFZhbHVlc1tpXSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICdOT1RfQUxMT1dFRF9WQUxVRSc7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG1heF9sZW5ndGg6IGZ1bmN0aW9uKG1heExlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoID4gbWF4TGVuZ3RoICkgcmV0dXJuICdUT09fTE9ORyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG1pbl9sZW5ndGg6IGZ1bmN0aW9uKG1pbkxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoIDwgbWluTGVuZ3RoICkgcmV0dXJuICdUT09fU0hPUlQnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsZW5ndGhfZXF1YWw6IGZ1bmN0aW9uKGxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoIDwgbGVuZ3RoICkgcmV0dXJuICdUT09fU0hPUlQnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPiBsZW5ndGggKSByZXR1cm4gJ1RPT19MT05HJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGVuZ3RoX2JldHdlZW46IGZ1bmN0aW9uKG1pbkxlbmd0aCwgbWF4TGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPCBtaW5MZW5ndGggKSByZXR1cm4gJ1RPT19TSE9SVCc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IG1heExlbmd0aCApIHJldHVybiAnVE9PX0xPTkcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsaWtlOiBmdW5jdGlvbihyZVN0ciwgZmxhZ3MpIHtcbiAgICAgICAgdmFyIGlzSWdub3JlQ2FzZSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgZmxhZ3MubWF0Y2goJ2knKTtcbiAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChyZVN0ciwgaXNJZ25vcmVDYXNlID8gJ2knIDogJycgKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggIXZhbHVlLm1hdGNoKHJlKSApIHJldHVybiAnV1JPTkdfRk9STUFUJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9XG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIERFRkFVTFRfUlVMRVMgPSB7fTtcbnZhciBJU19ERUZBVUxUX0FVVE9fVFJJTSA9IDA7XG5cbmZ1bmN0aW9uIFZhbGlkYXRvcihsaXZyUnVsZXMsIGlzQXV0b1RyaW0pIHtcbiAgICB0aGlzLmlzUHJlcGFyZWQgPSBmYWxzZTtcbiAgICB0aGlzLmxpdnJSdWxlcyAgID0gbGl2clJ1bGVzO1xuICAgIHRoaXMudmFsaWRhdG9ycyAgPSB7fTtcbiAgICB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzID0ge307XG4gICAgdGhpcy5lcnJvcnMgPSBudWxsO1xuXG4gICAgaWYgKCBpc0F1dG9UcmltICE9PSBudWxsICYmIGlzQXV0b1RyaW0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgdGhpcy5pc0F1dG9UcmltID0gaXNBdXRvVHJpbTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmlzQXV0b1RyaW0gPSBJU19ERUZBVUxUX0FVVE9fVFJJTTtcbiAgICB9XG5cbiAgICB0aGlzLnJlZ2lzdGVyUnVsZXMoREVGQVVMVF9SVUxFUyk7XG59XG5cblZhbGlkYXRvci5yZWdpc3RlckRlZmF1bHRSdWxlcyA9IGZ1bmN0aW9uKHJ1bGVzKSB7XG4gICAgZm9yICh2YXIgcnVsZU5hbWUgaW4gcnVsZXMpIHtcbiAgICAgICAgREVGQVVMVF9SVUxFU1tydWxlTmFtZV0gPSBydWxlc1tydWxlTmFtZV07XG4gICAgfVxufTtcblxuVmFsaWRhdG9yLnJlZ2lzdGVyQWxpYXNlZERlZmF1bHRSdWxlID0gZnVuY3Rpb24oYWxpYXMpIHtcbiAgICBpZiAoIWFsaWFzLm5hbWUpIHRocm93ICdBbGlhcyBuYW1lIHJlcXVpcmVkJztcblxuICAgIERFRkFVTFRfUlVMRVNbYWxpYXMubmFtZV0gPSBWYWxpZGF0b3IuX2J1aWxkQWxpYXNlZFJ1bGUoYWxpYXMpO1xufTtcblxuVmFsaWRhdG9yLl9idWlsZEFsaWFzZWRSdWxlID0gZnVuY3Rpb24oYWxpYXMpIHtcbiAgICBpZiAoIWFsaWFzLm5hbWUpIHRocm93ICdBbGlhcyBuYW1lIHJlcXVpcmVkJztcbiAgICBpZiAoIWFsaWFzLnJ1bGVzKSB0aHJvdyAnQWxpYXMgcnVsZXMgcmVxdWlyZWQnO1xuXG4gICAgdmFyIGxpdnIgPSB7dmFsdWU6IGFsaWFzLnJ1bGVzfTtcblxuICAgIHJldHVybiBmdW5jdGlvbihydWxlQnVpbGRlcnMpIHtcbiAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cikucmVnaXN0ZXJSdWxlcyhydWxlQnVpbGRlcnMpLnByZXBhcmUoKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oIHZhbHVlLCBwYXJhbXMsIG91dHB1dEFyciApIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoe3ZhbHVlOiB2YWx1ZX0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGlhcy5lcnJvciB8fCB2YWxpZGF0b3IuZ2V0RXJyb3JzKCkudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbn07XG5cblxuVmFsaWRhdG9yLmRlZmF1bHRBdXRvVHJpbSA9IGZ1bmN0aW9uKGlzQXV0b1RyaW0pIHtcbiAgICBJU19ERUZBVUxUX0FVVE9fVFJJTSA9ICEhaXNBdXRvVHJpbTtcbn07XG5cblZhbGlkYXRvci5wcm90b3R5cGUgPSB7XG4gICAgcHJlcGFyZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhbGxSdWxlcyA9IHRoaXMubGl2clJ1bGVzO1xuXG4gICAgICAgIGZvciAodmFyIGZpZWxkIGluIGFsbFJ1bGVzKSB7XG4gICAgICAgICAgICB2YXIgZmllbGRSdWxlcyA9IGFsbFJ1bGVzW2ZpZWxkXTtcblxuICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheShmaWVsZFJ1bGVzKSApIHtcbiAgICAgICAgICAgICAgICBmaWVsZFJ1bGVzID0gW2ZpZWxkUnVsZXNdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdmFsaWRhdG9ycyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8ZmllbGRSdWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSB0aGlzLl9wYXJzZVJ1bGUoZmllbGRSdWxlc1tpXSk7XG4gICAgICAgICAgICAgICAgdmFsaWRhdG9ycy5wdXNoKCB0aGlzLl9idWlsZFZhbGlkYXRvcihwYXJzZWQubmFtZSwgcGFyc2VkLmFyZ3MpICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yc1tmaWVsZF0gPSB2YWxpZGF0b3JzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pc1ByZXBhcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1ByZXBhcmVkKSB0aGlzLnByZXBhcmUoKTtcblxuICAgICAgICBpZiAoISB1dGlsLmlzT2JqZWN0KGRhdGEpICkge1xuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSAnRk9STUFUX0VSUk9SJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggdGhpcy5pc0F1dG9UcmltICkge1xuICAgICAgICAgICAgZGF0YSA9IHRoaXMuX2F1dG9UcmltKGRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVycm9ycyA9IHt9LCByZXN1bHQgPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBmaWVsZE5hbWUgaW4gdGhpcy52YWxpZGF0b3JzKSB7XG4gICAgICAgICAgICB2YXIgdmFsaWRhdG9ycyA9IHRoaXMudmFsaWRhdG9yc1tmaWVsZE5hbWVdO1xuICAgICAgICAgICAgaWYgKCF2YWxpZGF0b3JzIHx8ICF2YWxpZGF0b3JzLmxlbmd0aCkgY29udGludWU7XG5cbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbZmllbGROYW1lXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHZhbGlkYXRvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGRSZXN1bHRBcnIgPSBbXTtcblxuICAgICAgICAgICAgICAgIHZhciBlcnJDb2RlID0gdmFsaWRhdG9yc1tpXShcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lmhhc093blByb3BlcnR5KGZpZWxkTmFtZSkgPyByZXN1bHRbZmllbGROYW1lXSA6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgICAgICAgICBmaWVsZFJlc3VsdEFyclxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnNbZmllbGROYW1lXSA9IGVyckNvZGU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIGRhdGEuaGFzT3duUHJvcGVydHkoZmllbGROYW1lKSApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBmaWVsZFJlc3VsdEFyci5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZmllbGROYW1lXSA9IGZpZWxkUmVzdWx0QXJyWzBdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCAhIHJlc3VsdC5oYXNPd25Qcm9wZXJ0eShmaWVsZE5hbWUpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlsLmlzRW1wdHlPYmplY3QoZXJyb3JzKSkge1xuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gZXJyb3JzO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICB9LFxuXG4gICAgZ2V0RXJyb3JzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzO1xuICAgIH0sXG5cbiAgICByZWdpc3RlclJ1bGVzOiBmdW5jdGlvbihydWxlcykge1xuICAgICAgICBmb3IgKHZhciBydWxlTmFtZSBpbiBydWxlcykge1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0b3JCdWlsZGVyc1tydWxlTmFtZV0gPSBydWxlc1tydWxlTmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXJBbGlhc2VkUnVsZTogZnVuY3Rpb24oYWxpYXMpIHtcbiAgICAgICAgaWYgKCFhbGlhcy5uYW1lKSB0aHJvdyAnQWxpYXMgbmFtZSByZXF1aXJlZCc7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yQnVpbGRlcnNbYWxpYXMubmFtZV0gPSBWYWxpZGF0b3IuX2J1aWxkQWxpYXNlZFJ1bGUoYWxpYXMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBnZXRSdWxlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzO1xuICAgIH0sXG5cbiAgICBfcGFyc2VSdWxlOiBmdW5jdGlvbihsaXZyUnVsZSkge1xuICAgICAgICB2YXIgbmFtZSwgYXJncztcblxuICAgICAgICBpZiAoIHV0aWwuaXNPYmplY3QobGl2clJ1bGUpICkge1xuICAgICAgICAgICAgbmFtZSA9IE9iamVjdC5rZXlzKGxpdnJSdWxlKVswXTtcbiAgICAgICAgICAgIGFyZ3MgPSBsaXZyUnVsZVsgbmFtZSBdO1xuXG4gICAgICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheShhcmdzKSApIGFyZ3MgPSBbYXJnc107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuYW1lID0gbGl2clJ1bGU7XG4gICAgICAgICAgICBhcmdzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge25hbWU6IG5hbWUsIGFyZ3M6IGFyZ3N9O1xuICAgIH0sXG5cbiAgICBfYnVpbGRWYWxpZGF0b3I6IGZ1bmN0aW9uKG5hbWUsIGFyZ3MpICB7XG5cbiAgICAgICAgaWYgKCAhdGhpcy52YWxpZGF0b3JCdWlsZGVyc1tuYW1lXSApIHtcbiAgICAgICAgICAgIHRocm93ICdSdWxlIFsnICsgbmFtZSArICddIG5vdCByZWdpc3RlcmVkJztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhbGxBcmdzID0gW107XG5cbiAgICAgICAgYWxsQXJncy5wdXNoLmFwcGx5KGFsbEFyZ3MsIGFyZ3MpO1xuICAgICAgICBhbGxBcmdzLnB1c2goIHRoaXMuZ2V0UnVsZXMoKSApO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzW25hbWVdLmFwcGx5KG51bGwsIGFsbEFyZ3MpO1xuICAgIH0sXG5cbiAgICBfYXV0b1RyaW06IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGRhdGFUeXBlID0gdHlwZW9mIGRhdGE7XG5cbiAgICAgICAgaWYgKCBkYXRhVHlwZSAhPT0gJ29iamVjdCcgJiYgZGF0YSApIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnJlcGxhY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5yZXBsYWNlKC9eXFxzKi8sICcnKS5yZXBsYWNlKC9cXHMqJC8sICcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIGRhdGFUeXBlID09ICdvYmplY3QnICYmIEFycmF5LmlzQXJyYXkoZGF0YSkgKSB7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZERhdGEgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdHJpbW1lZERhdGFbaV0gPSB0aGlzLl9hdXRvVHJpbSggZGF0YVtpXSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJpbW1lZERhdGE7XG4gICAgICAgIH0gZWxzZSBpZiAoIGRhdGFUeXBlID09ICdvYmplY3QnICYmIHV0aWwuaXNPYmplY3QoZGF0YSkgKSB7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZERhdGEgPSB7fTtcblxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuaGFzT3duUHJvcGVydHkoa2V5KSApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJpbW1lZERhdGFba2V5XSA9IHRoaXMuX2F1dG9UcmltKCBkYXRhW2tleV0gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cmltbWVkRGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmFsaWRhdG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpc051bWJlck9yU3RyaW5nOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykgcmV0dXJuIHRydWU7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicgJiYgaXNGaW5pdGUodmFsdWUpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICBpc09iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAvLyBUT0RPIG1ha2UgYmV0dGVyIGNoZWNraW5nXG4gICAgICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xuICAgIH0sXG5cbiAgICBpc0VtcHR5T2JqZWN0OiBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgIGZvcih2YXIga2V5IGluIG1hcCkge1xuICAgICAgICAgICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBlc2NhcGVSZWdFeHA6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXFwtXFxbXFxdXFwvXFx7XFx9XFwoXFwpXFwqXFwrXFw/XFwuXFxcXFxcXlxcJFxcfF0vZywgXCJcXFxcJCZcIik7XG4gICAgfSxcblxuICAgIGlzTm9WYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnO1xuICAgIH1cbn07XG4iLCJ3aW5kb3cuTElWUiA9IHJlcXVpcmUoXCIuLi9saWIvTElWUlwiKTsiXX0=
