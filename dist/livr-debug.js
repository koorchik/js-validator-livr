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
        var urlReStr = '^(?:(?:http|https)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[0-1]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))\\.?|localhost)(?::\\d{2,5})?(?:[/?#]\\S*)?$';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTElWUi5qcyIsImxpYi9MSVZSL1J1bGVzL0NvbW1vbi5qcyIsImxpYi9MSVZSL1J1bGVzL0ZpbHRlcnMuanMiLCJsaWIvTElWUi9SdWxlcy9IZWxwZXIuanMiLCJsaWIvTElWUi9SdWxlcy9OdW1lcmljLmpzIiwibGliL0xJVlIvUnVsZXMvU3BlY2lhbC5qcyIsImxpYi9MSVZSL1J1bGVzL1N0cmluZy5qcyIsImxpYi9MSVZSL1ZhbGlkYXRvci5qcyIsImxpYi9MSVZSL3V0aWwuanMiLCJzY3JpcHRzL2Jyb3dzZXJpZnlfZW50cnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTElWUiA9IHtydWxlczoge319O1xuXG5MSVZSLnJ1bGVzLmNvbW1vbiAgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvQ29tbW9uJyk7XG5MSVZSLnJ1bGVzLnN0cmluZyAgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvU3RyaW5nJyk7XG5MSVZSLnJ1bGVzLm51bWVyaWMgPSByZXF1aXJlKCcuL0xJVlIvUnVsZXMvTnVtZXJpYycpO1xuTElWUi5ydWxlcy5zcGVjaWFsID0gcmVxdWlyZSgnLi9MSVZSL1J1bGVzL1NwZWNpYWwnKTtcbkxJVlIucnVsZXMuaGVscGVyICA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9IZWxwZXInKTtcbkxJVlIucnVsZXMuZmlsdGVycyA9IHJlcXVpcmUoJy4vTElWUi9SdWxlcy9GaWx0ZXJzJyk7XG5cbkxJVlIuVmFsaWRhdG9yID0gcmVxdWlyZSgnLi9MSVZSL1ZhbGlkYXRvcicpO1xuXG5MSVZSLlZhbGlkYXRvci5yZWdpc3RlckRlZmF1bHRSdWxlcyh7XG4gICAgcmVxdWlyZWQ6ICAgICAgICAgTElWUi5ydWxlcy5jb21tb24ucmVxdWlyZWQsXG4gICAgbm90X2VtcHR5OiAgICAgICAgTElWUi5ydWxlcy5jb21tb24ubm90X2VtcHR5LFxuICAgIG5vdF9lbXB0eV9saXN0OiAgIExJVlIucnVsZXMuY29tbW9uLm5vdF9lbXB0eV9saXN0LFxuXG4gICAgb25lX29mOiAgICAgICAgICAgTElWUi5ydWxlcy5zdHJpbmcub25lX29mLFxuICAgIG1heF9sZW5ndGg6ICAgICAgIExJVlIucnVsZXMuc3RyaW5nLm1heF9sZW5ndGgsXG4gICAgbWluX2xlbmd0aDogICAgICAgTElWUi5ydWxlcy5zdHJpbmcubWluX2xlbmd0aCxcbiAgICBsZW5ndGhfZXF1YWw6ICAgICBMSVZSLnJ1bGVzLnN0cmluZy5sZW5ndGhfZXF1YWwsXG4gICAgbGVuZ3RoX2JldHdlZW46ICAgTElWUi5ydWxlcy5zdHJpbmcubGVuZ3RoX2JldHdlZW4sXG4gICAgbGlrZTogICAgICAgICAgICAgTElWUi5ydWxlcy5zdHJpbmcubGlrZSxcblxuICAgIGludGVnZXI6ICAgICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5pbnRlZ2VyLFxuICAgIHBvc2l0aXZlX2ludGVnZXI6IExJVlIucnVsZXMubnVtZXJpYy5wb3NpdGl2ZV9pbnRlZ2VyLFxuICAgIGRlY2ltYWw6ICAgICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5kZWNpbWFsLFxuICAgIHBvc2l0aXZlX2RlY2ltYWw6IExJVlIucnVsZXMubnVtZXJpYy5wb3NpdGl2ZV9kZWNpbWFsLFxuICAgIG1heF9udW1iZXI6ICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5tYXhfbnVtYmVyLFxuICAgIG1pbl9udW1iZXI6ICAgICAgIExJVlIucnVsZXMubnVtZXJpYy5taW5fbnVtYmVyLFxuICAgIG51bWJlcl9iZXR3ZWVuOiAgIExJVlIucnVsZXMubnVtZXJpYy5udW1iZXJfYmV0d2VlbixcblxuICAgIGVtYWlsOiAgICAgICAgICAgIExJVlIucnVsZXMuc3BlY2lhbC5lbWFpbCxcbiAgICBlcXVhbF90b19maWVsZDogICBMSVZSLnJ1bGVzLnNwZWNpYWwuZXF1YWxfdG9fZmllbGQsXG4gICAgdXJsOiAgICAgICAgICAgICAgTElWUi5ydWxlcy5zcGVjaWFsLnVybCxcbiAgICBpc29fZGF0ZTogICAgICAgICBMSVZSLnJ1bGVzLnNwZWNpYWwuaXNvX2RhdGUsXG5cbiAgICBuZXN0ZWRfb2JqZWN0OiAgICBMSVZSLnJ1bGVzLmhlbHBlci5uZXN0ZWRfb2JqZWN0LFxuICAgIGxpc3Rfb2Y6ICAgICAgICAgIExJVlIucnVsZXMuaGVscGVyLmxpc3Rfb2YsXG4gICAgbGlzdF9vZl9vYmplY3RzOiAgTElWUi5ydWxlcy5oZWxwZXIubGlzdF9vZl9vYmplY3RzLFxuICAgIGxpc3Rfb2ZfZGlmZmVyZW50X29iamVjdHM6IExJVlIucnVsZXMuaGVscGVyLmxpc3Rfb2ZfZGlmZmVyZW50X29iamVjdHMsXG5cbiAgICB0cmltOiAgICAgICAgICAgICBMSVZSLnJ1bGVzLmZpbHRlcnMudHJpbSxcbiAgICB0b19sYzogICAgICAgICAgICBMSVZSLnJ1bGVzLmZpbHRlcnMudG9fbGMsXG4gICAgdG9fdWM6ICAgICAgICAgICAgTElWUi5ydWxlcy5maWx0ZXJzLnRvX3VjLFxuICAgIHJlbW92ZTogICAgICAgICAgIExJVlIucnVsZXMuZmlsdGVycy5yZW1vdmUsXG4gICAgbGVhdmVfb25seTogICAgICAgTElWUi5ydWxlcy5maWx0ZXJzLmxlYXZlX29ubHlcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExJVlI7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVxdWlyZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnUkVRVUlSRUQnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG5vdF9lbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdDQU5OT1RfQkVfRU1QVFknO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG5vdF9lbXB0eV9saXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGxpc3QpIHtcbiAgICAgICAgICAgIGlmIChsaXN0ID09PSB1bmRlZmluZWQgfHwgbGlzdCA9PT0gJycpIHJldHVybiAnQ0FOTk9UX0JFX0VNUFRZJztcbiAgICAgICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkobGlzdCkgKSByZXR1cm4gJ1dST05HX0ZPUk1BVCc7XG4gICAgICAgICAgICBpZiAobGlzdC5sZW5ndGggPCAxKSByZXR1cm4gJ0NBTk5PVF9CRV9FTVBUWSc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB0cmltOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7IC8vIFRPRE8ganVzdCBkbyBub3QgdHJpbSBudW1iZXJzXG4gICAgICAgICAgICBvdXRwdXRBcnIucHVzaCggdmFsdWUucmVwbGFjZSgvXlxccyovLCAnJykucmVwbGFjZSgvXFxzKiQvLCAnJykgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdG9fbGM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNraXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnRvTG93ZXJDYXNlKCkgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdG9fdWM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNraXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnRvVXBwZXJDYXNlKCkgKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihjaGFycykge1xuICAgICAgICBjaGFycyA9IHV0aWwuZXNjYXBlUmVnRXhwKGNoYXJzKTtcbiAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cCggJ1snICsgY2hhcnMgKyAgJ10nLCAnZycgKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJzsgLy8gVE9ETyBqdXN0IHNraXAgbnVtYmVyc1xuICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2goIHZhbHVlLnJlcGxhY2UocmUsICcnKSApO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsZWF2ZV9vbmx5OiBmdW5jdGlvbihjaGFycykge1xuICAgICAgICBjaGFycyA9IHV0aWwuZXNjYXBlUmVnRXhwKGNoYXJzKTtcbiAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cCggJ1teJyArIGNoYXJzICsgICddJywgJ2cnICk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyApIHJldHVybjtcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7IC8vIFRPRE8ganVzdCBza2lwIG51bWJlcnNcbiAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKCB2YWx1ZS5yZXBsYWNlKHJlLCAnJykgKTtcbiAgICAgICAgfTtcbiAgICB9LFxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBWYWxpZGF0b3IgPSByZXF1aXJlKCcuLi9WYWxpZGF0b3InKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBuZXN0ZWRfb2JqZWN0OiBmdW5jdGlvbihsaXZyLCBydWxlQnVpbGRlcnMpIHtcbiAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cikucmVnaXN0ZXJSdWxlcyhydWxlQnVpbGRlcnMpLnByZXBhcmUoKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obmVzdGVkT2JqZWN0LCBwYXJhbXMsIG91dHB1dEFycikge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZShuZXN0ZWRPYmplY3QpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCB0eXBlb2YgbmVzdGVkT2JqZWN0ICE9PSAnb2JqZWN0JyApIHJldHVybiAnRk9STUFUX0VSUk9SJzsgLy9UT0RPIGNoZWNrIGlmIGhhc2hcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggbmVzdGVkT2JqZWN0ICk7XG5cbiAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsaWRhdG9yLmdldEVycm9ycygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsaXN0X29mOiBmdW5jdGlvbihydWxlcywgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkocnVsZXMpICkge1xuICAgICAgICAgICAgcnVsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcnVsZUJ1aWxkZXJzID0gcnVsZXMucG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGl2ciA9IHsgZmllbGQ6IHJ1bGVzIH07XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcywgcGFyYW1zLCBvdXRwdXRBcnIpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWVzKSApIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkodmFsdWVzKSApIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBoYXNFcnJvcnMgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yICggdmFyIGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggeyBmaWVsZDogdmFsdWVzW2ldIH0gKTtcblxuICAgICAgICAgICAgICAgIGlmICggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0LmZpZWxkKTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3JzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goIHZhbGlkYXRvci5nZXRFcnJvcnMoKS5maWVsZCApO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIGhhc0Vycm9ycyApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRBcnIucHVzaChyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxpc3Rfb2Zfb2JqZWN0czogZnVuY3Rpb24obGl2ciwgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdHMsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKG9iamVjdHMpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkob2JqZWN0cykgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICAgICAgICB2YXIgaGFzRXJyb3JzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqZWN0cy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsaWRhdG9yLnZhbGlkYXRlKCBvYmplY3RzW2ldICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCB2YWxpZGF0b3IuZ2V0RXJyb3JzKCkgKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBoYXNFcnJvcnMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBsaXN0X29mX2RpZmZlcmVudF9vYmplY3RzOiBmdW5jdGlvbihzZWxlY3RvckZpZWxkLCBsaXZycywgcnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3JzID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgc2VsZWN0b3JWYWx1ZSBpbiBsaXZycykge1xuICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IobGl2cnNbc2VsZWN0b3JWYWx1ZV0pLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG4gICAgICAgICAgICB2YWxpZGF0b3JzW3NlbGVjdG9yVmFsdWVdID0gdmFsaWRhdG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdHMsIHBhcmFtcywgb3V0cHV0QXJyKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKG9iamVjdHMpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkob2JqZWN0cykgKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICAgICAgICB2YXIgaGFzRXJyb3JzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpPTA7IGk8b2JqZWN0cy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICB2YXIgb2JqZWN0ID0gb2JqZWN0c1tpXTtcblxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9iamVjdCAhPSAnb2JqZWN0JyB8fCAhb2JqZWN0W3NlbGVjdG9yRmllbGRdIHx8ICF2YWxpZGF0b3JzWyBvYmplY3Rbc2VsZWN0b3JGaWVsZF0gXSApIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goJ0ZPUk1BVF9FUlJPUicpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRhdG9yID0gdmFsaWRhdG9yc1sgb2JqZWN0W3NlbGVjdG9yRmllbGRdIF07XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSggb2JqZWN0ICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKCB2YWxpZGF0b3IuZ2V0RXJyb3JzKCkgKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBoYXNFcnJvcnMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QXJyLnB1c2gocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW50ZWdlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICF2YWx1ZS5tYXRjaCgvXlxcLT9bMC05XSskLykgKSByZXR1cm4gJ05PVF9JTlRFR0VSJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgcG9zaXRpdmVfaW50ZWdlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCB1dGlsLmlzTm9WYWx1ZSh2YWx1ZSkgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgL15bMS05XVswLTldKiQvLnRlc3QodmFsdWUpICkgcmV0dXJuICdOT1RfUE9TSVRJVkVfSU5URUdFUic7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGRlY2ltYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIHZhbHVlICs9ICcnO1xuICAgICAgICAgICAgaWYgKCAhIC9eKD86XFwtPyg/OlswLTldK1xcLlswLTldKyl8KD86WzAtOV0rKSkkLy50ZXN0KHZhbHVlKSApIHJldHVybiAnTk9UX0RFQ0lNQUwnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBwb3NpdGl2ZV9kZWNpbWFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggISAvXig/Oig/OlswLTldKlxcLlswLTldKyl8KD86WzEtOV1bMC05XSopKSQvLnRlc3QodmFsdWUpICkgcmV0dXJuICdOT1RfUE9TSVRJVkVfREVDSU1BTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG1heF9udW1iZXI6IGZ1bmN0aW9uKG1heE51bWJlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGlmICggK3ZhbHVlID4gK21heE51bWJlciApIHJldHVybiAnVE9PX0hJR0gnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBtaW5fbnVtYmVyOiBmdW5jdGlvbihtaW5OdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIHV0aWwuaXNOb1ZhbHVlKHZhbHVlKSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICBpZiAoICt2YWx1ZSA8ICttaW5OdW1iZXIgKSByZXR1cm4gJ1RPT19MT1cnO1xuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG51bWJlcl9iZXR3ZWVuOiBmdW5jdGlvbihtaW5OdW1iZXIsIG1heE51bWJlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICggdXRpbC5pc05vVmFsdWUodmFsdWUpICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGlmICggK3ZhbHVlIDwgK21pbk51bWJlciApIHJldHVybiAnVE9PX0xPVyc7XG4gICAgICAgICAgICBpZiAoICt2YWx1ZSA+ICttYXhOdW1iZXIgKSByZXR1cm4gJ1RPT19ISUdIJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBlbWFpbDogZnVuY3Rpb24oKSB7XG4gICAgICAgdmFyIGVtYWlsUmUgPSAvXihbXFx3XFwtXytdKyg/OlxcLltcXHdcXC1fK10rKSopQCgoPzpbXFx3XFwtXStcXC4pKlxcd1tcXHdcXC1dezAsNjZ9KVxcLihbYS16XXsyLDZ9KD86XFwuW2Etel17Mn0pPykkL2k7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICEgZW1haWxSZS50ZXN0KHZhbHVlKSApIHJldHVybiAnV1JPTkdfRU1BSUwnO1xuICAgICAgICAgICAgaWYgKCAvXFxALipcXEAvLnRlc3QodmFsdWUpICkgcmV0dXJuICdXUk9OR19FTUFJTCc7XG4gICAgICAgICAgICBpZiAoIC9cXEAuKl8vLnRlc3QodmFsdWUpICkgcmV0dXJuICdXUk9OR19FTUFJTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGVxdWFsX3RvX2ZpZWxkOiBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnICkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF1dGlsLmlzTnVtYmVyT3JTdHJpbmcodmFsdWUpKSByZXR1cm4gJ0ZPUk1BVF9FUlJPUic7XG5cbiAgICAgICAgICAgIGlmICggdmFsdWUgIT0gcGFyYW1zW2ZpZWxkXSApIHJldHVybiAnRklFTERTX05PVF9FUVVBTCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHVybDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB1cmxSZVN0ciA9ICdeKD86KD86aHR0cHxodHRwcyk6Ly8pKD86XFxcXFMrKD86OlxcXFxTKik/QCk/KD86KD86KD86WzEtOV1cXFxcZD98MVxcXFxkXFxcXGR8MlswLTFdXFxcXGR8MjJbMC0zXSkoPzpcXFxcLig/OjE/XFxcXGR7MSwyfXwyWzAtNF1cXFxcZHwyNVswLTVdKSl7Mn0oPzpcXFxcLig/OlswLTldXFxcXGQ/fDFcXFxcZFxcXFxkfDJbMC00XVxcXFxkfDI1WzAtNF0pKXwoPzooPzpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZjAtOV0tKikqW2EtelxcXFx1MDBhMS1cXFxcdWZmZmYwLTldKykoPzpcXFxcLig/OlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XS0qKSpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZjAtOV0rKSooPzpcXFxcLig/OlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmXXsyLH0pKSlcXFxcLj98bG9jYWxob3N0KSg/OjpcXFxcZHsyLDV9KT8oPzpbLz8jXVxcXFxTKik/JCc7XG4gICAgICAgIHZhciB1cmxSZSA9IG5ldyBSZWdFeHAodXJsUmVTdHIsICdpJyk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA8IDIwODMgJiYgdXJsUmUudGVzdCh2YWx1ZSkpIHJldHVybjtcbiAgICAgICAgICAgIHJldHVybiAnV1JPTkdfVVJMJztcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgaXNvX2RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YXIgbWF0Y2hlZCA9IHZhbHVlLm1hdGNoKC9eKFxcZHs0fSktKFswLTFdWzAtOV0pLShbMC0zXVswLTldKSQvKTtcblxuICAgICAgICAgICAgaWYgKG1hdGNoZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXBvY2ggPSBEYXRlLnBhcnNlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoIWVwb2NoICYmIGVwb2NoICE9PSAwKSByZXR1cm4gJ1dST05HX0RBVEUnO1xuXG4gICAgICAgICAgICAgICAgdmFyIGQgPSBuZXcgRGF0ZShlcG9jaCk7XG4gICAgICAgICAgICAgICAgZC5zZXRUaW1lKCBkLmdldFRpbWUoKSArIGQuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwICogMTAwMCApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCBkLmdldEZ1bGxZZWFyKCkgPT0gbWF0Y2hlZFsxXSAmJiBkLmdldE1vbnRoKCkrMSA9PSArbWF0Y2hlZFsyXSAmJiBkLmdldERhdGUoKSA9PSArbWF0Y2hlZFszXSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICdXUk9OR19EQVRFJztcbiAgICAgICAgfTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSAge1xuICAgIG9uZV9vZjogZnVuY3Rpb24oYWxsb3dlZFZhbHVlcykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYWxsb3dlZFZhbHVlcykpIHtcbiAgICAgICAgICAgIGFsbG93ZWRWYWx1ZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgYWxsb3dlZFZhbHVlcy5wb3AoKTsgLy8gcG9wIHJ1bGVCdWlsZGVyc1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGFsbG93ZWRWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIHZhbHVlID09IGFsbG93ZWRWYWx1ZXNbaV0gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAnTk9UX0FMTE9XRURfVkFMVUUnO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBtYXhfbGVuZ3RoOiBmdW5jdGlvbihtYXhMZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IG1heExlbmd0aCApIHJldHVybiAnVE9PX0xPTkcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBtaW5fbGVuZ3RoOiBmdW5jdGlvbihtaW5MZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA8IG1pbkxlbmd0aCApIHJldHVybiAnVE9PX1NIT1JUJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGVuZ3RoX2VxdWFsOiBmdW5jdGlvbihsZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA8IGxlbmd0aCApIHJldHVybiAnVE9PX1NIT1JUJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoID4gbGVuZ3RoICkgcmV0dXJuICdUT09fTE9ORyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGxlbmd0aF9iZXR3ZWVuOiBmdW5jdGlvbihtaW5MZW5ndGgsIG1heExlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJyApIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdXRpbC5pc051bWJlck9yU3RyaW5nKHZhbHVlKSkgcmV0dXJuICdGT1JNQVRfRVJST1InO1xuXG4gICAgICAgICAgICB2YWx1ZSArPSAnJztcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoIDwgbWluTGVuZ3RoICkgcmV0dXJuICdUT09fU0hPUlQnO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZS5sZW5ndGggPiBtYXhMZW5ndGggKSByZXR1cm4gJ1RPT19MT05HJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgbGlrZTogZnVuY3Rpb24ocmVTdHIsIGZsYWdzKSB7XG4gICAgICAgIHZhciBpc0lnbm9yZUNhc2UgPSBhcmd1bWVudHMubGVuZ3RoID09PSAzICYmIGZsYWdzLm1hdGNoKCdpJyk7XG4gICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAocmVTdHIsIGlzSWdub3JlQ2FzZSA/ICdpJyA6ICcnICk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycgKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXV0aWwuaXNOdW1iZXJPclN0cmluZyh2YWx1ZSkpIHJldHVybiAnRk9STUFUX0VSUk9SJztcblxuICAgICAgICAgICAgdmFsdWUgKz0gJyc7XG4gICAgICAgICAgICBpZiAoICF2YWx1ZS5tYXRjaChyZSkgKSByZXR1cm4gJ1dST05HX0ZPUk1BVCc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgfVxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbnZhciBERUZBVUxUX1JVTEVTID0ge307XG52YXIgSVNfREVGQVVMVF9BVVRPX1RSSU0gPSAwO1xuXG5mdW5jdGlvbiBWYWxpZGF0b3IobGl2clJ1bGVzLCBpc0F1dG9UcmltKSB7XG4gICAgdGhpcy5pc1ByZXBhcmVkID0gZmFsc2U7XG4gICAgdGhpcy5saXZyUnVsZXMgICA9IGxpdnJSdWxlcztcbiAgICB0aGlzLnZhbGlkYXRvcnMgID0ge307XG4gICAgdGhpcy52YWxpZGF0b3JCdWlsZGVycyA9IHt9O1xuICAgIHRoaXMuZXJyb3JzID0gbnVsbDtcblxuICAgIGlmICggaXNBdXRvVHJpbSAhPT0gbnVsbCAmJiBpc0F1dG9UcmltICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIHRoaXMuaXNBdXRvVHJpbSA9IGlzQXV0b1RyaW07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pc0F1dG9UcmltID0gSVNfREVGQVVMVF9BVVRPX1RSSU07XG4gICAgfVxuXG4gICAgdGhpcy5yZWdpc3RlclJ1bGVzKERFRkFVTFRfUlVMRVMpO1xufVxuXG5WYWxpZGF0b3IucmVnaXN0ZXJEZWZhdWx0UnVsZXMgPSBmdW5jdGlvbihydWxlcykge1xuICAgIGZvciAodmFyIHJ1bGVOYW1lIGluIHJ1bGVzKSB7XG4gICAgICAgIERFRkFVTFRfUlVMRVNbcnVsZU5hbWVdID0gcnVsZXNbcnVsZU5hbWVdO1xuICAgIH1cbn07XG5cblZhbGlkYXRvci5nZXREZWZhdWx0UnVsZXMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gREVGQVVMVF9SVUxFUztcbn07XG5cblZhbGlkYXRvci5yZWdpc3RlckFsaWFzZWREZWZhdWx0UnVsZSA9IGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgaWYgKCFhbGlhcy5uYW1lKSB0aHJvdyAnQWxpYXMgbmFtZSByZXF1aXJlZCc7XG5cbiAgICBERUZBVUxUX1JVTEVTW2FsaWFzLm5hbWVdID0gVmFsaWRhdG9yLl9idWlsZEFsaWFzZWRSdWxlKGFsaWFzKTtcbn07XG5cblZhbGlkYXRvci5fYnVpbGRBbGlhc2VkUnVsZSA9IGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgaWYgKCFhbGlhcy5uYW1lKSB0aHJvdyAnQWxpYXMgbmFtZSByZXF1aXJlZCc7XG4gICAgaWYgKCFhbGlhcy5ydWxlcykgdGhyb3cgJ0FsaWFzIHJ1bGVzIHJlcXVpcmVkJztcblxuICAgIHZhciBsaXZyID0ge3ZhbHVlOiBhbGlhcy5ydWxlc307XG5cbiAgICByZXR1cm4gZnVuY3Rpb24ocnVsZUJ1aWxkZXJzKSB7XG4gICAgICAgIHZhciB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKGxpdnIpLnJlZ2lzdGVyUnVsZXMocnVsZUJ1aWxkZXJzKS5wcmVwYXJlKCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCB2YWx1ZSwgcGFyYW1zLCBvdXRwdXRBcnIgKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsaWRhdG9yLnZhbGlkYXRlKHt2YWx1ZTogdmFsdWV9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIG91dHB1dEFyci5wdXNoKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxpYXMuZXJyb3IgfHwgdmFsaWRhdG9yLmdldEVycm9ycygpLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG59O1xuXG5cblZhbGlkYXRvci5kZWZhdWx0QXV0b1RyaW0gPSBmdW5jdGlvbihpc0F1dG9UcmltKSB7XG4gICAgSVNfREVGQVVMVF9BVVRPX1RSSU0gPSAhIWlzQXV0b1RyaW07XG59O1xuXG5WYWxpZGF0b3IucHJvdG90eXBlID0ge1xuICAgIHByZXBhcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYWxsUnVsZXMgPSB0aGlzLmxpdnJSdWxlcztcblxuICAgICAgICBmb3IgKHZhciBmaWVsZCBpbiBhbGxSdWxlcykge1xuICAgICAgICAgICAgdmFyIGZpZWxkUnVsZXMgPSBhbGxSdWxlc1tmaWVsZF07XG5cbiAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoZmllbGRSdWxlcykgKSB7XG4gICAgICAgICAgICAgICAgZmllbGRSdWxlcyA9IFtmaWVsZFJ1bGVzXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHZhbGlkYXRvcnMgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGZpZWxkUnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkID0gdGhpcy5fcGFyc2VSdWxlKGZpZWxkUnVsZXNbaV0pO1xuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnMucHVzaCggdGhpcy5fYnVpbGRWYWxpZGF0b3IocGFyc2VkLm5hbWUsIHBhcnNlZC5hcmdzKSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRvcnNbZmllbGRdID0gdmFsaWRhdG9ycztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaXNQcmVwYXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNQcmVwYXJlZCkgdGhpcy5wcmVwYXJlKCk7XG5cbiAgICAgICAgaWYgKCEgdXRpbC5pc09iamVjdChkYXRhKSApIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gJ0ZPUk1BVF9FUlJPUic7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHRoaXMuaXNBdXRvVHJpbSApIHtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLl9hdXRvVHJpbShkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSB7fSwgcmVzdWx0ID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgZmllbGROYW1lIGluIHRoaXMudmFsaWRhdG9ycykge1xuICAgICAgICAgICAgdmFyIHZhbGlkYXRvcnMgPSB0aGlzLnZhbGlkYXRvcnNbZmllbGROYW1lXTtcbiAgICAgICAgICAgIGlmICghdmFsaWRhdG9ycyB8fCAhdmFsaWRhdG9ycy5sZW5ndGgpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2ZpZWxkTmFtZV07XG5cbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTx2YWxpZGF0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkUmVzdWx0QXJyID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgZXJyQ29kZSA9IHZhbGlkYXRvcnNbaV0oXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5oYXNPd25Qcm9wZXJ0eShmaWVsZE5hbWUpID8gcmVzdWx0W2ZpZWxkTmFtZV0gOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZmllbGRSZXN1bHRBcnJcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVyckNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzW2ZpZWxkTmFtZV0gPSBlcnJDb2RlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBkYXRhLmhhc093blByb3BlcnR5KGZpZWxkTmFtZSkgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggZmllbGRSZXN1bHRBcnIubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkTmFtZV0gPSBmaWVsZFJlc3VsdEFyclswXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICggISByZXN1bHQuaGFzT3duUHJvcGVydHkoZmllbGROYW1lKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtmaWVsZE5hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbC5pc0VtcHR5T2JqZWN0KGVycm9ycykpIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IGVycm9ycztcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgfSxcblxuICAgIGdldEVycm9yczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVycm9ycztcbiAgICB9LFxuXG4gICAgcmVnaXN0ZXJSdWxlczogZnVuY3Rpb24ocnVsZXMpIHtcbiAgICAgICAgZm9yICh2YXIgcnVsZU5hbWUgaW4gcnVsZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yQnVpbGRlcnNbcnVsZU5hbWVdID0gcnVsZXNbcnVsZU5hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyQWxpYXNlZFJ1bGU6IGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgICAgIGlmICghYWxpYXMubmFtZSkgdGhyb3cgJ0FsaWFzIG5hbWUgcmVxdWlyZWQnO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckJ1aWxkZXJzW2FsaWFzLm5hbWVdID0gVmFsaWRhdG9yLl9idWlsZEFsaWFzZWRSdWxlKGFsaWFzKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgZ2V0UnVsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0b3JCdWlsZGVycztcbiAgICB9LFxuXG4gICAgX3BhcnNlUnVsZTogZnVuY3Rpb24obGl2clJ1bGUpIHtcbiAgICAgICAgdmFyIG5hbWUsIGFyZ3M7XG5cbiAgICAgICAgaWYgKCB1dGlsLmlzT2JqZWN0KGxpdnJSdWxlKSApIHtcbiAgICAgICAgICAgIG5hbWUgPSBPYmplY3Qua2V5cyhsaXZyUnVsZSlbMF07XG4gICAgICAgICAgICBhcmdzID0gbGl2clJ1bGVbIG5hbWUgXTtcblxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkoYXJncykgKSBhcmdzID0gW2FyZ3NdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmFtZSA9IGxpdnJSdWxlO1xuICAgICAgICAgICAgYXJncyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtuYW1lOiBuYW1lLCBhcmdzOiBhcmdzfTtcbiAgICB9LFxuXG4gICAgX2J1aWxkVmFsaWRhdG9yOiBmdW5jdGlvbihuYW1lLCBhcmdzKSAge1xuXG4gICAgICAgIGlmICggIXRoaXMudmFsaWRhdG9yQnVpbGRlcnNbbmFtZV0gKSB7XG4gICAgICAgICAgICB0aHJvdyAnUnVsZSBbJyArIG5hbWUgKyAnXSBub3QgcmVnaXN0ZXJlZCc7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWxsQXJncyA9IFtdO1xuXG4gICAgICAgIGFsbEFyZ3MucHVzaC5hcHBseShhbGxBcmdzLCBhcmdzKTtcbiAgICAgICAgYWxsQXJncy5wdXNoKCB0aGlzLmdldFJ1bGVzKCkgKTtcblxuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0b3JCdWlsZGVyc1tuYW1lXS5hcHBseShudWxsLCBhbGxBcmdzKTtcbiAgICB9LFxuXG4gICAgX2F1dG9UcmltOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBkYXRhVHlwZSA9IHR5cGVvZiBkYXRhO1xuXG4gICAgICAgIGlmICggZGF0YVR5cGUgIT09ICdvYmplY3QnICYmIGRhdGEgKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5yZXBsYWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvXlxccyovLCAnJykucmVwbGFjZSgvXFxzKiQvLCAnJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCBkYXRhVHlwZSA9PSAnb2JqZWN0JyAmJiBBcnJheS5pc0FycmF5KGRhdGEpICkge1xuICAgICAgICAgICAgdmFyIHRyaW1tZWREYXRhID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRyaW1tZWREYXRhW2ldID0gdGhpcy5fYXV0b1RyaW0oIGRhdGFbaV0gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWREYXRhO1xuICAgICAgICB9IGVsc2UgaWYgKCBkYXRhVHlwZSA9PSAnb2JqZWN0JyAmJiB1dGlsLmlzT2JqZWN0KGRhdGEpICkge1xuICAgICAgICAgICAgdmFyIHRyaW1tZWREYXRhID0ge307XG5cbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmhhc093blByb3BlcnR5KGtleSkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyaW1tZWREYXRhW2tleV0gPSB0aGlzLl9hdXRvVHJpbSggZGF0YVtrZXldICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJpbW1lZERhdGE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNOdW1iZXJPclN0cmluZzogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbHVlKSkgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgaXNPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgLy8gVE9ETyBtYWtlIGJldHRlciBjaGVja2luZ1xuICAgICAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgICB9LFxuXG4gICAgaXNFbXB0eU9iamVjdDogZnVuY3Rpb24gKG1hcCkge1xuICAgICAgICBmb3IodmFyIGtleSBpbiBtYXApIHtcbiAgICAgICAgICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgZXNjYXBlUmVnRXhwOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvW1xcLVxcW1xcXVxcL1xce1xcfVxcKFxcKVxcKlxcK1xcP1xcLlxcXFxcXF5cXCRcXHxdL2csIFwiXFxcXCQmXCIpO1xuICAgIH0sXG5cbiAgICBpc05vVmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJztcbiAgICB9XG59O1xuIiwid2luZG93LkxJVlIgPSByZXF1aXJlKFwiLi4vbGliL0xJVlJcIik7Il19
