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
'use strict';

var util = require('../util');

module.exports = {
    trim: function() {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just do not trim numbers
            outputArr.push( value.replace(/^\s*/, '').replace(/\s*$/, '') );
        };
    },

    to_lc: function() {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.toLowerCase() );
        };
    },

    to_uc: function() {
        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.toUpperCase() );
        };
    },

    remove: function(chars) {
        chars = util.escapeRegExp(chars);
        var re = new RegExp( '[' + chars +  ']', 'g' );

        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.replace(re, '') );
        };
    },

    leave_only: function(chars) {
        chars = util.escapeRegExp(chars);
        var re = new RegExp( '[^' + chars +  ']', 'g' );

        return function(value, undefined, outputArr) {
            if (value === undefined || value === null || typeof value === 'object' || value === '' ) return;

            value += ''; // TODO just skip numbers
            outputArr.push( value.replace(re, '') );
        };
    },
};
},{"../util":9}],4:[function(require,module,exports){
'use strict';

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
        if (! Array.isArray(rules) ) {
            rules = Array.prototype.slice.call(arguments);
            ruleBuilders = rules.pop();
        }

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
'use strict';

var util = require('../util');

module.exports = {
    integer: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( !value.match(/^\-?[0-9]+$/) ) return 'NOT_INTEGER';
            return;
        };
    },

    positive_integer: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! /^[1-9][0-9]*$/.test(value) ) return 'NOT_POSITIVE_INTEGER';
            return;
        };
    },

    decimal: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! /^(?:\-?(?:[0-9]+\.[0-9]+)|(?:[0-9]+))$/.test(value) ) return 'NOT_DECIMAL';
            return;
        };
    },

    positive_decimal: function() {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! /^(?:(?:[1-9][0-9]*\.[0-9]+)|(?:[1-9][0-9]*))$/.test(value) ) return 'NOT_POSITIVE_DECIMAL';
            return;
        };
    },

    max_number: function(maxNumber) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if ( +value > +maxNumber ) return 'TOO_HIGH';
            return;
        };
    },

    min_number: function(minNumber) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            if ( +value < +minNumber ) return 'TOO_LOW';
            return;

        };
    },

    number_between: function(minNumber, maxNumber) {
        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
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
        var emailRe = new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/);

        return function(value) {
            if (value === undefined || value === null || value === '' ) return;
            if (!util.isNumberOrString(value)) return 'FORMAT_ERROR';

            value += '';
            if ( ! emailRe.test(value) ) return 'WRONG_EMAIL';
            if ( /\@.*\@/.test(value) ) return 'WRONG_EMAIL';
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
                if (!epoch) return 'WRONG_DATE';

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

        if (util.isEmpty(errors)) {
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

    isEmpty: function (map) {
        for(var key in map) {
            if (map.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    },

    escapeRegExp: function (str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
};

},{}],10:[function(require,module,exports){
window.LIVR = require("../lib/LIVR");
},{"../lib/LIVR":1}]},{},[10])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL0NvbW1vbi5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL0ZpbHRlcnMuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi9SdWxlcy9IZWxwZXIuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9saWIvTElWUi9SdWxlcy9OdW1lcmljLmpzIiwiL1VzZXJzL2tvb3JjaGlrL3dvcmsva29vcmNoaWsvanMtdmFsaWRhdG9yLWxpdnIvbGliL0xJVlIvUnVsZXMvU3BlY2lhbC5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1J1bGVzL1N0cmluZy5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL1ZhbGlkYXRvci5qcyIsIi9Vc2Vycy9rb29yY2hpay93b3JrL2tvb3JjaGlrL2pzLXZhbGlkYXRvci1saXZyL2xpYi9MSVZSL3V0aWwuanMiLCIvVXNlcnMva29vcmNoaWsvd29yay9rb29yY2hpay9qcy12YWxpZGF0b3ItbGl2ci9zY3JpcHRzL2Jyb3dzZXJpZnlfZW50cnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBMSVZSID0ge3J1bGVzOiB7fX07XG5cbkxJVlIucnVsZXMuY29tbW9uICA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9Db21tb24nKTtcbkxJVlIucnVsZXMuc3RyaW5nICA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9TdHJpbmcnKTtcbkxJVlIucnVsZXMubnVtZXJpYyA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9OdW1lcmljJyk7XG5MSVZSLnJ1bGVzLnNwZWNpYWwgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvU3BlY2lhbCcpO1xuTElWUi5ydWxlcy5oZWxwZXIgID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL0hlbHBlcicpO1xuTElWUi5ydWxlcy5maWx0ZXJzID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL0ZpbHRlcnMnKTtcblxuTElWUi5WYWxpZGF0b3IgPSByZXF1aXJlKCcuL0xJVlIvVmFsaWRhdG9yJyk7XG5cbkxJVlIuVmFsaWRhdG9yLnJlZ2lzdGVyRGVmYXVsdFJ1bGVzKHtcbiAgICByZXF1aXJlZDogICAgICAgICBMSVZSLnJ1bGVzLmNvbW1vbi5yZXF1aXJlZCxcbiAgICBub3RfZW1wdHk6ICAgICAgICBMSVZSLnJ1bGVzLmNvbW1vbi5ub3RfZW1wdHksXG4gICAgbm90X2VtcHR5X2xpc3Q6ICAgTElWUi5ydWxlcy5jb21tb24ubm90X2VtcHR5X2xpc3QsXG5cbiAgICBvbmVfb2Y6ICAgICAgICAgICBMSVZSLnJ1bGVzLnN0cmluZy5vbmVfb2YsXG4gICAgbWF4X2xlbmd0aDogICAgICAgTElWUi5ydWxlcy5zdHJpbmcubWF4X2xlbmd0aCxcbiAgICBtaW5fbGVuZ3RoOiAgICAgICBMSVZSLnJ1bGVzLnN0cmluZy5taW5fbGVuZ3RoLFxuICAgIGxlbmd0aF9lcXVhbDogICAgIExJVlIucnVsZXMuc3RyaW5nLmxlbmd0aF9lcXVhbCxcbiAgICBsZW5ndGhfYmV0d2VlbjogICBMSVZSLnJ1bGVzLnN0cmluZy5sZW5ndGhfYmV0d2VlbixcbiAgICBsaWtlOiAgICAgICAgICAgICBMSVZSLnJ1bGVzLnN0cmluZy5saWtlLFxuXG4gICAgaW50ZWdlcjogICAgICAgICAgTElWUi5ydWxlcy5udW1lcmljLmludGVnZXIsXG4gICAgcG9zaXRpdmVfaW50ZWdlcjogTElWUi5ydWxlcy5udW1lcmljLnBvc2l0aXZlX2ludGVnZXIsXG4gICAgZGVjaW1hbDogICAgICAgICAgTElWUi5ydWxlcy5udW1lcmljLmRlY2ltYWwsXG4gICAgcG9zaXRpdmVfZGVjaW1hbDogTElWUi5ydWxlcy5udW1lcmljLnBvc2l0aXZlX2RlY2ltYWwsXG4gICAgbWF4X251bWJlcjogICAgICAgTElWUi5ydWxlcy5udW1lcmljLm1heF9udW1iZXIsXG4gICAgbWluX251bWJlcjogICAgICAgTElWUi5ydWxlcy5udW1lcmljLm1pbl9udW1iZXIsXG4gICAgbnVtYmVyX2JldHdlZW46ICAgTElWUi5ydWxlcy5udW1lcmljLm51bWJlcl9iZXR3ZWVuLFxuXG4gICAgZW1haWw6ICAgICAgICAgICAgTElWUi5ydWxlcy5zcGVjaWFsLmVtYWlsLFxuICAgIGVxdWFsX3RvX2ZpZWxkOiAgIExJVlIucnVsZXMuc3BlY2lhbC5lcXVhbF90b19maWVsZCxcbiAgICB1cmw6ICAgICAgICAgICAgICBMSVZSLnJ1bGVzLnNwZWNpYWwudXJsLFxuICAgIGlzb19kYXRlOiAgICAgICAgIExJVlIucnVsZXMuc3BlY2lhbC5pc29fZGF0ZSxcblxuICAgIG5lc3RlZF9vYmplY3Q6ICAgIExJVlIucnVsZXMuaGVscGVyLm5lc3RlZF9vYmplY3QsXG4gICAgbGlzdF9vZjogICAgICAgICAgTElWUi5ydWxlcy5oZWxwZXIubGlzdF9vZixcbiAgICBsaXN0X29mX29iamVjdHM6ICBMSVZSLnJ1bGVzLmhlbHBlci5saXN0X29mX29iamVjdHMsXG4gICAgbGlzdF9vZl9kaWZmZXJlbnRfb2JqZWN0czogTElWUi5ydWxlcy5oZWxwZXIubGlzdF9vZl9kaWZmZXJlbnRfb2JqZWN0cyxcblxuICAgIHRyaW06ICAgICAgICAgICAgIExJVlIucnVsZXMuZmlsdGVycy50cmltLFxuICAgIHRvX2xjOiAgICAgICAgICAgIExJVlIucnVsZXMuZmlsdGVycy50b19sYyxcbiAgICB0b191YzogICAgICAgICAgICBMSVZSLnJ1bGVzLmZpbHRlcnMudG9fdWMsXG4gICAgcmVtb3ZlOiAgICAgICAgICAgTElWUi5ydWxlcy5maWx0ZXJzLnJlbW92ZSxcbiAgICBsZWF2ZV9vbmx5OiAgICAgICBMSVZSLnJ1bGVzLmZpbHRlcnMubGVhdmVfb25seVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTElWUjtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVxdWlyZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiAnUkVRVUlSRUQnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG5vdF9lbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdDQU5OT1RfQkVfRU1QVFknO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG5vdF9lbXB0eV9saXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGxpc3QpIHtcbiAgICAgICAgICAgIGlmIChsaXN0ID09PSB1bmRlZmluZWQgfHwgbGlzdCA9PT0gJycpIHJldHVybiAnQ0FOTk9UX0JFX0VNUFRZJztcbiAgICAgICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkobGlzdCkgKSByZXR1cm4gJ1dST05HX0ZPUk1BVCc7XG4gICAgICAgICAgICBpZiAobGlzdC5sZW5ndGggPCAxKSByZXR1cm4gJ0NBTk5PVF9CRV9FTVBUWSc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB0cmltOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCB1bmRlZmluZWQsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnOyAvLyBUT0RPIGp1c3QgZG8gbm90IHRyaW0gbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnJlcGxhY2UoL15cXHMqLywgJycpLnJlcGxhY2UoL1xccyokLywgJycpICk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRvX2xjOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCB1bmRlZmluZWQsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnOyAvLyBUT0RPIGp1c3Qgc2tpcCBudW1iZXJzXG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCggdmFsdWUudG9Mb3dlckNhc2UoKSApO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0b191YzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgdW5kZWZpbmVkLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNraXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnRvVXBwZXJDYXNlKCkgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihjaGFycykge1xuICAgICAgICBjaGFycyA9IHV0aWwuZXNjYXBlUmVnRXhwKGNoYXJzKTtcbiAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cCggJ1snICsgY2hhcnMgKyAgJ10nLCAnZycgKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHVuZGVmaW5lZCwgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7IC8vIFRPRE8ganVzdCBza2lwIG51bWJlcnNcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCB2YWx1ZS5yZXBsYWNlKHJlLCAnJykgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGVhdmVfb25seTogZnVuY3Rpb24oY2hhcnMpIHtcbiAgICAgICAgY2hhcnMgPSB1dGlsLmVzY2FwZVJlZ0V4cChjaGFycyk7XG4gICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoICdbXicgKyBjaGFycyArICAnXScsICdnJyApO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSwgdW5kZWZpbmVkLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNraXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnJlcGxhY2UocmUsICcnKSApO1xuICAgICAgICB9O1xuICAgIH0sXG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFZhbGlkYXRvciA9IHJlcXVpcmUoJy4uL1ZhbGlkYXRvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBuZXN0ZWRfb2JqZWN0OiBmdW5jdGlvbihsaXZyLCBydWxlQnVpbGRlcnMpIHtcbiAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cikucmVnaXN0ZXJSdWxlcyhydWxlQnVpbGRlcnMpLnByZXBhcmUoKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obmVzdGVkT2JqZWN0LCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCBuZXN0ZWRPYmplY3QgPT09IHVuZGVmaW5lZCB8fCBuZXN0ZWRPYmplY3QgPT09IG51bGwgfHwgbmVzdGVkT2JqZWN0ID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgbmVzdGVkT2JqZWN0ICE9PSAnb2JqZWN0JyApIHJldHVybiAnRk9STUFUX0VSUk9SJzsgLy9UT0RPIGNoZWNrIGlmIGhhc2hcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggbmVzdGVkT2JqZWN0ICk7XG5cbiAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsaWRhdG9yLmdldEVycm9ycygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsaXN0X29mOiBmdW5jdGlvbihydWxlcywgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkocnVsZXMpICkge1xuICAgICAgICAgICAgcnVsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcnVsZUJ1aWxkZXJzID0gcnVsZXMucG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGl2ciA9IHsgZmllbGQ6IHJ1bGVzIH07XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcywgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZXMgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZXMgPT09IG51bGwgfHwgdmFsdWVzID09PSAnJyApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkodmFsdWVzKSApIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBoYXNFcnJvcnMgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggeyBmaWVsZDogdmFsdWVzW2ldIH0gKTtcblxuICAgICAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0LmZpZWxkKTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3JzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goIHZhbGlkYXRvci5nZXRFcnJvcnMoKS5maWVsZCApO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIGhhc0Vycm9ycyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxpc3Rfb2Zfb2JqZWN0czogZnVuY3Rpb24obGl2ciwgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdHMsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIG9iamVjdHMgPT09IHVuZGVmaW5lZCB8fCBvYmplY3RzID09PSBudWxsIHx8IG9iamVjdHMgPT09ICcnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheShvYmplY3RzKSApIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBoYXNFcnJvcnMgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGk9MDsgaTxvYmplY3RzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIG9iamVjdHNbaV0gKTtcblxuICAgICAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3JzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goIHZhbGlkYXRvci5nZXRFcnJvcnMoKSApO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIGhhc0Vycm9ycyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxpc3Rfb2ZfZGlmZmVyZW50X29iamVjdHM6IGZ1bmN0aW9uKHNlbGVjdG9yRmllbGQsIGxpdnJzLCBydWxlQnVpbGRlcnMpIHtcbiAgICAgICAgdmFyIHZhbGlkYXRvcnMgPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBzZWxlY3RvclZhbHVlIGluIGxpdnJzKSB7XG4gICAgICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyc1tzZWxlY3RvclZhbHVlXSkucmVnaXN0ZXJSdWxlcyhydWxlQnVpbGRlcnMpLnByZXBhcmUoKTtcbiAgICAgICAgICAgIHZhbGlkYXRvcnNbc2VsZWN0b3JWYWx1ZV0gPSB2YWxpZGF0b3I7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0cywgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggb2JqZWN0cyA9PT0gdW5kZWZpbmVkIHx8IG9iamVjdHMgPT09IG51bGwgfHwgb2JqZWN0cyA9PT0gJycgKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KG9iamVjdHMpICkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIGhhc0Vycm9ycyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaT0wOyBpPG9iamVjdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9iamVjdCA9IG9iamVjdHNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBvYmplY3QgIT0gJ29iamVjdCcgfHwgIW9iamVjdFtzZWxlY3RvckZpZWxkXSB8fCAhdmFsaWRhdG9yc1sgb2JqZWN0W3NlbGVjdG9yRmllbGRdIF0gKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCdGT1JNQVRfRVJST1InKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IHZhbGlkYXRvcnNbIG9iamVjdFtzZWxlY3RvckZpZWxkXSBdO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWxpZGF0b3IudmFsaWRhdGUoIG9iamVjdCApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYXNFcnJvcnMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCggdmFsaWRhdG9yLmdldEVycm9ycygpICk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICggaGFzRXJyb3JzICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGludGVnZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggIXZhbHVlLm1hdGNoKC9eXFwtP1swLTldKyQvKSApIHJldHVybiAnTk9UX0lOVEVHRVInO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBwb3NpdGl2ZV9pbnRlZ2VyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgL15bMS05XVswLTldKiQvLnRlc3QodmFsdWUpICkgcmV0dXJuICdOT1RfUE9TSVRJVkVfSU5URUdFUic7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGRlY2ltYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggISAvXig/OlxcLT8oPzpbMC05XStcXC5bMC05XSspfCg/OlswLTldKykpJC8udGVzdCh2YWx1ZSkgKSByZXR1cm4gJ05PVF9ERUNJTUFMJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcG9zaXRpdmVfZGVjaW1hbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhIC9eKD86KD86WzEtOV1bMC05XSpcXC5bMC05XSspfCg/OlsxLTldWzAtOV0qKSkkLy50ZXN0KHZhbHVlKSApIHJldHVybiAnTk9UX1BPU0lUSVZFX0RFQ0lNQUwnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBtYXhfbnVtYmVyOiBmdW5jdGlvbihtYXhOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgaWYgKCArdmFsdWUgPiArbWF4TnVtYmVyICkgcmV0dXJuICdUT09fSElHSCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG1pbl9udW1iZXI6IGZ1bmN0aW9uKG1pbk51bWJlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBpZiAoICt2YWx1ZSA8ICttaW5OdW1iZXIgKSByZXR1cm4gJ1RPT19MT1cnO1xuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG51bWJlcl9iZXR3ZWVuOiBmdW5jdGlvbihtaW5OdW1iZXIsIG1heE51bWJlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBpZiAoICt2YWx1ZSA8ICttaW5OdW1iZXIgKSByZXR1cm4gJ1RPT19MT1cnO1xuICAgICAgICAgICAgaWYgKCArdmFsdWUgPiArbWF4TnVtYmVyICkgcmV0dXJuICdUT09fSElHSCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZW1haWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW1haWxSZSA9IG5ldyBSZWdFeHAoLyg/OlthLXowLTkhIyQlJicqKy89P15fYHt8fX4tXSsoPzpcXC5bYS16MC05ISMkJSYnKisvPT9eX2B7fH1+LV0rKSp8XCIoPzpbXFx4MDEtXFx4MDhcXHgwYlxceDBjXFx4MGUtXFx4MWZcXHgyMVxceDIzLVxceDViXFx4NWQtXFx4N2ZdfFxcXFxbXFx4MDEtXFx4MDlcXHgwYlxceDBjXFx4MGUtXFx4N2ZdKSpcIilAKD86KD86W2EtejAtOV0oPzpbYS16MC05LV0qW2EtejAtOV0pP1xcLikrW2EtejAtOV0oPzpbYS16MC05LV0qW2EtejAtOV0pP3xcXFsoPzooPzoyNVswLTVdfDJbMC00XVswLTldfFswMV0/WzAtOV1bMC05XT8pXFwuKXszfSg/OjI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldP3xbYS16MC05LV0qW2EtejAtOV06KD86W1xceDAxLVxceDA4XFx4MGJcXHgwY1xceDBlLVxceDFmXFx4MjEtXFx4NWFcXHg1My1cXHg3Zl18XFxcXFtcXHgwMS1cXHgwOVxceDBiXFx4MGNcXHgwZS1cXHg3Zl0pKylcXF0pLyk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgZW1haWxSZS50ZXN0KHZhbHVlKSApIHJldHVybiAnV1JPTkdfRU1BSUwnO1xuICAgICAgICAgICAgaWYgKCAvXFxALipcXEAvLnRlc3QodmFsdWUpICkgcmV0dXJuICdXUk9OR19FTUFJTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGVxdWFsX3RvX2ZpZWxkOiBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGlmICggdmFsdWUgIT0gcGFyYW1zW2ZpZWxkXSApIHJldHVybiAnRklFTERTX05PVF9FUVVBTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHVybDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB1cmxSZVN0ciA9ICdeKD86KD86aHR0cHxodHRwcyk6Ly8pKD86XFxcXFMrKD86OlxcXFxTKik/QCk/KD86KD86KD86WzEtOV1cXFxcZD98MVxcXFxkXFxcXGR8MlswMV1cXFxcZHwyMlswLTNdKSg/OlxcXFwuKD86MT9cXFxcZHsxLDJ9fDJbMC00XVxcXFxkfDI1WzAtNV0pKXsyfSg/OlxcXFwuKD86WzAtOV1cXFxcZD98MVxcXFxkXFxcXGR8MlswLTRdXFxcXGR8MjVbMC00XSkpfCg/Oig/OlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XSstPykqW2EtelxcXFx1MDBhMS1cXFxcdWZmZmYwLTldKykoPzpcXFxcLig/OlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XSstPykqW2EtelxcXFx1MDBhMS1cXFxcdWZmZmYwLTldKykqKD86XFxcXC4oPzpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZl17Mix9KSkpfGxvY2FsaG9zdCkoPzo6XFxcXGR7Miw1fSk/KD86KC98XFxcXD98IylbXlxcXFxzXSopPyQnO1xuICAgICAgICB2YXIgdXJsUmUgPSBuZXcgUmVnRXhwKHVybFJlU3RyLCAnaScpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPCAyMDgzICYmIHVybFJlLnRlc3QodmFsdWUpKSByZXR1cm47XG4gICAgICAgICAgICByZXR1cm4gJ1dST05HX1VSTCc7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGlzb19kYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFyIG1hdGNoZWQgPSB2YWx1ZS5tYXRjaCgvXihcXGR7NH0pLShbMC0xXVswLTldKS0oWzAtM11bMC05XSkkLyk7XG5cbiAgICAgICAgICAgIGlmIChtYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVwb2NoID0gRGF0ZS5wYXJzZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFlcG9jaCkgcmV0dXJuICdXUk9OR19EQVRFJztcblxuICAgICAgICAgICAgICAgIHZhciBkID0gbmV3IERhdGUoZXBvY2gpO1xuICAgICAgICAgICAgICAgIGQuc2V0VGltZSggZC5nZXRUaW1lKCkgKyBkLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MCAqIDEwMDAgKTtcblxuICAgICAgICAgICAgICAgIGlmICggZC5nZXRGdWxsWWVhcigpID09IG1hdGNoZWRbMV0gJiYgZC5nZXRNb250aCgpKzEgPT0gK21hdGNoZWRbMl0gJiYgZC5nZXREYXRlKCkgPT0gK21hdGNoZWRbM10gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnV1JPTkdfREFURSc7XG4gICAgICAgIH07XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gIHtcbiAgICBvbmVfb2Y6IGZ1bmN0aW9uKGFsbG93ZWRWYWx1ZXMpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFsbG93ZWRWYWx1ZXMpKSB7XG4gICAgICAgICAgICBhbGxvd2VkVmFsdWVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGFsbG93ZWRWYWx1ZXMucG9wKCk7IC8vIHBvcCBydWxlQnVpbGRlcnNcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxhbGxvd2VkVmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB2YWx1ZSA9PSBhbGxvd2VkVmFsdWVzW2ldICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJ05PVF9BTExPV0VEX1ZBTFVFJztcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbWF4X2xlbmd0aDogZnVuY3Rpb24obWF4TGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPiBtYXhMZW5ndGggKSByZXR1cm4gJ1RPT19MT05HJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbWluX2xlbmd0aDogZnVuY3Rpb24obWluTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPCBtaW5MZW5ndGggKSByZXR1cm4gJ1RPT19TSE9SVCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxlbmd0aF9lcXVhbDogZnVuY3Rpb24obGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPCBsZW5ndGggKSByZXR1cm4gJ1RPT19TSE9SVCc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IGxlbmd0aCApIHJldHVybiAnVE9PX0xPTkcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsZW5ndGhfYmV0d2VlbjogZnVuY3Rpb24obWluTGVuZ3RoLCBtYXhMZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA8IG1pbkxlbmd0aCApIHJldHVybiAnVE9PX1NIT1JUJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoID4gbWF4TGVuZ3RoICkgcmV0dXJuICdUT09fTE9ORyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxpa2U6IGZ1bmN0aW9uKHJlU3RyLCBmbGFncykge1xuICAgICAgICB2YXIgaXNJZ25vcmVDYXNlID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiBmbGFncy5tYXRjaCgnaScpO1xuICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKHJlU3RyLCBpc0lnbm9yZUNhc2UgPyAnaScgOiAnJyApO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhdmFsdWUubWF0Y2gocmUpICkgcmV0dXJuICdXUk9OR19GT1JNQVQnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH1cbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgREVGQVVMVF9SVUxFUyA9IHt9O1xudmFyIElTX0RFRkFVTFRfQVVUT19UUklNID0gMDtcblxuZnVuY3Rpb24gVmFsaWRhdG9yKGxpdnJSdWxlcywgaXNBdXRvVHJpbSkge1xuICAgIHRoaXMuaXNQcmVwYXJlZCA9IGZhbHNlO1xuICAgIHRoaXMubGl2clJ1bGVzICAgPSBsaXZyUnVsZXM7XG4gICAgdGhpcy52YWxpZGF0b3JzICA9IHt9O1xuICAgIHRoaXMudmFsaWRhdG9yQnVpbGRlcnMgPSB7fTtcbiAgICB0aGlzLmVycm9ycyA9IG51bGw7XG5cbiAgICBpZiAoIGlzQXV0b1RyaW0gIT09IG51bGwgJiYgaXNBdXRvVHJpbSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICB0aGlzLmlzQXV0b1RyaW0gPSBpc0F1dG9UcmltO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaXNBdXRvVHJpbSA9IElTX0RFRkFVTFRfQVVUT19UUklNO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJSdWxlcyhERUZBVUxUX1JVTEVTKTtcbn1cblxuVmFsaWRhdG9yLnJlZ2lzdGVyRGVmYXVsdFJ1bGVzID0gZnVuY3Rpb24ocnVsZXMpIHtcbiAgICBmb3IgKHZhciBydWxlTmFtZSBpbiBydWxlcykge1xuICAgICAgICBERUZBVUxUX1JVTEVTW3J1bGVOYW1lXSA9IHJ1bGVzW3J1bGVOYW1lXTtcbiAgICB9XG59O1xuXG5WYWxpZGF0b3IucmVnaXN0ZXJBbGlhc2VkRGVmYXVsdFJ1bGUgPSBmdW5jdGlvbihhbGlhcykge1xuICAgIGlmICghYWxpYXMubmFtZSkgdGhyb3cgJ0FsaWFzIG5hbWUgcmVxdWlyZWQnO1xuXG4gICAgREVGQVVMVF9SVUxFU1thbGlhcy5uYW1lXSA9IFZhbGlkYXRvci5fYnVpbGRBbGlhc2VkUnVsZShhbGlhcyk7XG59O1xuXG5WYWxpZGF0b3IuX2J1aWxkQWxpYXNlZFJ1bGUgPSBmdW5jdGlvbihhbGlhcykge1xuICAgIGlmICghYWxpYXMubmFtZSkgdGhyb3cgJ0FsaWFzIG5hbWUgcmVxdWlyZWQnO1xuICAgIGlmICghYWxpYXMucnVsZXMpIHRocm93ICdBbGlhcyBydWxlcyByZXF1aXJlZCc7XG5cbiAgICB2YXIgbGl2ciA9IHt2YWx1ZTogYWxpYXMucnVsZXN9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJ1bGVCdWlsZGVycykge1xuICAgICAgICB2YXIgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcihsaXZyKS5yZWdpc3RlclJ1bGVzKHJ1bGVCdWlsZGVycykucHJlcGFyZSgpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiggdmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyICkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSh7dmFsdWU6IHZhbHVlfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsaWFzLmVycm9yIHx8IHZhbGlkYXRvci5nZXRFcnJvcnMoKS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xufTtcblxuXG5WYWxpZGF0b3IuZGVmYXVsdEF1dG9UcmltID0gZnVuY3Rpb24oaXNBdXRvVHJpbSkge1xuICAgIElTX0RFRkFVTFRfQVVUT19UUklNID0gISFpc0F1dG9UcmltO1xufTtcblxuVmFsaWRhdG9yLnByb3RvdHlwZSA9IHtcbiAgICBwcmVwYXJlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFsbFJ1bGVzID0gdGhpcy5saXZyUnVsZXM7XG5cbiAgICAgICAgZm9yICh2YXIgZmllbGQgaW4gYWxsUnVsZXMpIHtcbiAgICAgICAgICAgIHZhciBmaWVsZFJ1bGVzID0gYWxsUnVsZXNbZmllbGRdO1xuXG4gICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KGZpZWxkUnVsZXMpICkge1xuICAgICAgICAgICAgICAgIGZpZWxkUnVsZXMgPSBbZmllbGRSdWxlc107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB2YWxpZGF0b3JzID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxmaWVsZFJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlZCA9IHRoaXMuX3BhcnNlUnVsZShmaWVsZFJ1bGVzW2ldKTtcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzLnB1c2goIHRoaXMuX2J1aWxkVmFsaWRhdG9yKHBhcnNlZC5uYW1lLCBwYXJzZWQuYXJncykgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy52YWxpZGF0b3JzW2ZpZWxkXSA9IHZhbGlkYXRvcnM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzUHJlcGFyZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgdmFsaWRhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUHJlcGFyZWQpIHRoaXMucHJlcGFyZSgpO1xuXG4gICAgICAgIGlmICghIHV0aWwuaXNPYmplY3QoZGF0YSkgKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9ICdGT1JNQVRfRVJST1InO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCB0aGlzLmlzQXV0b1RyaW0gKSB7XG4gICAgICAgICAgICBkYXRhID0gdGhpcy5fYXV0b1RyaW0oZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXJyb3JzID0ge30sIHJlc3VsdCA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGZpZWxkTmFtZSBpbiB0aGlzLnZhbGlkYXRvcnMpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZGF0b3JzID0gdGhpcy52YWxpZGF0b3JzW2ZpZWxkTmFtZV07XG4gICAgICAgICAgICBpZiAoIXZhbGlkYXRvcnMgfHwgIXZhbGlkYXRvcnMubGVuZ3RoKSBjb250aW51ZTtcblxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtmaWVsZE5hbWVdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8dmFsaWRhdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBmaWVsZFJlc3VsdEFyciA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVyckNvZGUgPSB2YWxpZGF0b3JzW2ldKFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuaGFzT3duUHJvcGVydHkoZmllbGROYW1lKSA/IHJlc3VsdFtmaWVsZE5hbWVdIDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkUmVzdWx0QXJyXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGlmIChlcnJDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yc1tmaWVsZE5hbWVdID0gZXJyQ29kZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggZGF0YS5oYXNPd25Qcm9wZXJ0eShmaWVsZE5hbWUpICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGZpZWxkUmVzdWx0QXJyLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtmaWVsZE5hbWVdID0gZmllbGRSZXN1bHRBcnJbMF07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoICEgcmVzdWx0Lmhhc093blByb3BlcnR5KGZpZWxkTmFtZSkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbZmllbGROYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWwuaXNFbXB0eShlcnJvcnMpKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSBlcnJvcnM7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgIH0sXG5cbiAgICBnZXRFcnJvcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lcnJvcnM7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyUnVsZXM6IGZ1bmN0aW9uKHJ1bGVzKSB7XG4gICAgICAgIGZvciAodmFyIHJ1bGVOYW1lIGluIHJ1bGVzKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzW3J1bGVOYW1lXSA9IHJ1bGVzW3J1bGVOYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICByZWdpc3RlckFsaWFzZWRSdWxlOiBmdW5jdGlvbihhbGlhcykge1xuICAgICAgICBpZiAoIWFsaWFzLm5hbWUpIHRocm93ICdBbGlhcyBuYW1lIHJlcXVpcmVkJztcbiAgICAgICAgdGhpcy52YWxpZGF0b3JCdWlsZGVyc1thbGlhcy5uYW1lXSA9IFZhbGlkYXRvci5fYnVpbGRBbGlhc2VkUnVsZShhbGlhcyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldFJ1bGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdG9yQnVpbGRlcnM7XG4gICAgfSxcblxuICAgIF9wYXJzZVJ1bGU6IGZ1bmN0aW9uKGxpdnJSdWxlKSB7XG4gICAgICAgIHZhciBuYW1lLCBhcmdzO1xuXG4gICAgICAgIGlmICggdXRpbC5pc09iamVjdChsaXZyUnVsZSkgKSB7XG4gICAgICAgICAgICBuYW1lID0gT2JqZWN0LmtleXMobGl2clJ1bGUpWzBdO1xuICAgICAgICAgICAgYXJncyA9IGxpdnJSdWxlWyBuYW1lIF07XG5cbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KGFyZ3MpICkgYXJncyA9IFthcmdzXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5hbWUgPSBsaXZyUnVsZTtcbiAgICAgICAgICAgIGFyZ3MgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7bmFtZTogbmFtZSwgYXJnczogYXJnc307XG4gICAgfSxcblxuICAgIF9idWlsZFZhbGlkYXRvcjogZnVuY3Rpb24obmFtZSwgYXJncykgIHtcblxuICAgICAgICBpZiAoICF0aGlzLnZhbGlkYXRvckJ1aWxkZXJzW25hbWVdICkge1xuICAgICAgICAgICAgdGhyb3cgJ1J1bGUgWycgKyBuYW1lICsgJ10gbm90IHJlZ2lzdGVyZWQnO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFsbEFyZ3MgPSBbXTtcblxuICAgICAgICBhbGxBcmdzLnB1c2guYXBwbHkoYWxsQXJncywgYXJncyk7XG4gICAgICAgIGFsbEFyZ3MucHVzaCggdGhpcy5nZXRSdWxlcygpICk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdG9yQnVpbGRlcnNbbmFtZV0uYXBwbHkobnVsbCwgYWxsQXJncyk7XG4gICAgfSxcblxuICAgIF9hdXRvVHJpbTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgZGF0YVR5cGUgPSB0eXBlb2YgZGF0YTtcblxuICAgICAgICBpZiAoIGRhdGFUeXBlICE9PSAnb2JqZWN0JyAmJiBkYXRhICkge1xuICAgICAgICAgICAgaWYgKGRhdGEucmVwbGFjZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLnJlcGxhY2UoL15cXHMqLywgJycpLnJlcGxhY2UoL1xccyokLywgJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICggZGF0YVR5cGUgPT0gJ29iamVjdCcgJiYgQXJyYXkuaXNBcnJheShkYXRhKSApIHtcbiAgICAgICAgICAgIHZhciB0cmltbWVkRGF0YSA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0cmltbWVkRGF0YVtpXSA9IHRoaXMuX2F1dG9UcmltKCBkYXRhW2ldICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cmltbWVkRGF0YTtcbiAgICAgICAgfSBlbHNlIGlmICggZGF0YVR5cGUgPT0gJ29iamVjdCcgJiYgdXRpbC5pc09iamVjdChkYXRhKSApIHtcbiAgICAgICAgICAgIHZhciB0cmltbWVkRGF0YSA9IHt9O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmICggZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpICkge1xuICAgICAgICAgICAgICAgICAgICB0cmltbWVkRGF0YVtrZXldID0gdGhpcy5fYXV0b1RyaW0oIGRhdGFba2V5XSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWREYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWYWxpZGF0b3I7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGlzTnVtYmVyT3JTdHJpbmc6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZSh2YWx1ZSkpIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIGlzT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIC8vIFRPRE8gbWFrZSBiZXR0ZXIgY2hlY2tpbmdcbiAgICAgICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gICAgfSxcblxuICAgIGlzRW1wdHk6IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gbWFwKSB7XG4gICAgICAgICAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGVzY2FwZVJlZ0V4cDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1tcXC1cXFtcXF1cXC9cXHtcXH1cXChcXClcXCpcXCtcXD9cXC5cXFxcXFxeXFwkXFx8XS9nLCBcIlxcXFwkJlwiKTtcbiAgICB9XG59O1xuIiwid2luZG93LkxJVlIgPSByZXF1aXJlKFwiLi4vbGliL0xJVlJcIik7Il19
