/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./lib/LIVR.js":
/*!*********************!*\
  !*** ./lib/LIVR.js ***!
  \*********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const Validator = __webpack_require__(/*! ./Validator */ \"./lib/Validator.js\");\nconst util = __webpack_require__(/*! ./util */ \"./lib/util.js\");\n\nconst rules = {\n    required:         __webpack_require__(/*! ./rules/common/required */ \"./lib/rules/common/required.js\"),\n    not_empty:        __webpack_require__(/*! ./rules/common/not_empty */ \"./lib/rules/common/not_empty.js\"),\n    not_empty_list:   __webpack_require__(/*! ./rules/common/not_empty_list */ \"./lib/rules/common/not_empty_list.js\"),\n    any_object:       __webpack_require__(/*! ./rules/common/any_object */ \"./lib/rules/common/any_object.js\"),\n\n    string:           __webpack_require__(/*! ./rules/string/string */ \"./lib/rules/string/string.js\"),\n    eq:               __webpack_require__(/*! ./rules/string/eq */ \"./lib/rules/string/eq.js\"),\n    one_of:           __webpack_require__(/*! ./rules/string/one_of */ \"./lib/rules/string/one_of.js\"),\n    max_length:       __webpack_require__(/*! ./rules/string/max_length */ \"./lib/rules/string/max_length.js\"),\n    min_length:       __webpack_require__(/*! ./rules/string/min_length */ \"./lib/rules/string/min_length.js\"),\n    length_equal:     __webpack_require__(/*! ./rules/string/length_equal */ \"./lib/rules/string/length_equal.js\"),\n    length_between:   __webpack_require__(/*! ./rules/string/length_between */ \"./lib/rules/string/length_between.js\"),\n    like:             __webpack_require__(/*! ./rules/string/like */ \"./lib/rules/string/like.js\"),\n\n    integer:          __webpack_require__(/*! ./rules/numeric/integer */ \"./lib/rules/numeric/integer.js\"),\n    positive_integer: __webpack_require__(/*! ./rules/numeric/positive_integer */ \"./lib/rules/numeric/positive_integer.js\"),\n    decimal:          __webpack_require__(/*! ./rules/numeric/decimal */ \"./lib/rules/numeric/decimal.js\"),\n    positive_decimal: __webpack_require__(/*! ./rules/numeric/positive_decimal */ \"./lib/rules/numeric/positive_decimal.js\"),\n    max_number:       __webpack_require__(/*! ./rules/numeric/max_number */ \"./lib/rules/numeric/max_number.js\"),\n    min_number:       __webpack_require__(/*! ./rules/numeric/min_number */ \"./lib/rules/numeric/min_number.js\"),\n    number_between:   __webpack_require__(/*! ./rules/numeric/number_between */ \"./lib/rules/numeric/number_between.js\"),\n\n    email:            __webpack_require__(/*! ./rules/special/email */ \"./lib/rules/special/email.js\"),\n    equal_to_field:   __webpack_require__(/*! ./rules/special/equal_to_field */ \"./lib/rules/special/equal_to_field.js\"),\n    url:              __webpack_require__(/*! ./rules/special/url */ \"./lib/rules/special/url.js\"),\n    iso_date:         __webpack_require__(/*! ./rules/special/iso_date */ \"./lib/rules/special/iso_date.js\"),\n\n    nested_object:    __webpack_require__(/*! ./rules/meta/nested_object */ \"./lib/rules/meta/nested_object.js\"),\n    variable_object:  __webpack_require__(/*! ./rules/meta/variable_object */ \"./lib/rules/meta/variable_object.js\"),\n    list_of:          __webpack_require__(/*! ./rules/meta/list_of */ \"./lib/rules/meta/list_of.js\"),\n    list_of_objects:  __webpack_require__(/*! ./rules/meta/list_of_objects */ \"./lib/rules/meta/list_of_objects.js\"),\n    or:               __webpack_require__(/*! ./rules/meta/or */ \"./lib/rules/meta/or.js\"),\n    list_of_different_objects: __webpack_require__(/*! ./rules/meta/list_of_different_objects */ \"./lib/rules/meta/list_of_different_objects.js\"),\n\n    default:          __webpack_require__(/*! ./rules/modifiers/default */ \"./lib/rules/modifiers/default.js\"),\n    trim:             __webpack_require__(/*! ./rules/modifiers/trim */ \"./lib/rules/modifiers/trim.js\"),\n    to_lc:            __webpack_require__(/*! ./rules/modifiers/to_lc */ \"./lib/rules/modifiers/to_lc.js\"),\n    to_uc:            __webpack_require__(/*! ./rules/modifiers/to_uc */ \"./lib/rules/modifiers/to_uc.js\"),\n    remove:           __webpack_require__(/*! ./rules/modifiers/remove */ \"./lib/rules/modifiers/remove.js\"),\n    leave_only:       __webpack_require__(/*! ./rules/modifiers/leave_only */ \"./lib/rules/modifiers/leave_only.js\")\n};\n\nValidator.registerDefaultRules(rules);\n\nmodule.exports = { Validator, rules, util };\n\n\n//# sourceURL=webpack://livr/./lib/LIVR.js?");

/***/ }),

/***/ "./lib/Validator.js":
/*!**************************!*\
  !*** ./lib/Validator.js ***!
  \**************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
eval("\n\nconst util = __webpack_require__(/*! ./util */ \"./lib/util.js\");\n\nconst DEFAULT_RULES = {};\nlet IS_DEFAULT_AUTO_TRIM = 0;\n\nclass Validator {\n    constructor(livrRules, isAutoTrim) {\n        this.isPrepared = false;\n        this.livrRules = livrRules;\n        this.validators = {};\n        this.validatorBuilders = {};\n        this.errors = null;\n\n        if (isAutoTrim !== null && isAutoTrim !== undefined) {\n            this.isAutoTrim = isAutoTrim;\n        } else {\n            this.isAutoTrim = IS_DEFAULT_AUTO_TRIM;\n        }\n\n        this.registerRules(DEFAULT_RULES);\n    }\n\n    static getDefaultRules() {\n        return DEFAULT_RULES;\n    }\n\n    static registerAliasedDefaultRule(alias) {\n        if (!alias.name) throw 'Alias name required';\n\n        DEFAULT_RULES[alias.name] = this._buildAliasedRule(alias.rules, alias.error);\n    }\n\n    static registerDefaultRules(rules) {\n        for (const ruleName in rules) {\n            DEFAULT_RULES[ruleName] = rules[ruleName];\n        }\n    }\n\n    static defaultAutoTrim(isAutoTrim) {\n        IS_DEFAULT_AUTO_TRIM = !!isAutoTrim;\n    }\n\n    static _buildAliasedRule(rules, errorCode) {\n        if (!rules) throw 'Alias rules required';\n\n        const livr = { value: rules };\n\n        return ruleBuilders => {\n            // ruleBuilders comes always as a last argument\n            // we register them to support custom rules in aliases\n            const validator = new Validator(livr).registerRules(ruleBuilders).prepare();\n\n            return (value, undefined, outputArr) => {\n                const result = validator.validate({ value });\n\n                if (result) {\n                    outputArr.push(result.value);\n                    return;\n                } else {\n                    return errorCode || validator.getErrors().value;\n                }\n            };\n        };\n    }\n\n    prepare() {\n        const allRules = this.livrRules;\n\n        for (const field in allRules) {\n            let fieldRules = allRules[field];\n\n            if (!Array.isArray(fieldRules)) {\n                fieldRules = [fieldRules];\n            }\n\n            const validators = [];\n\n            for (const fieldRule of fieldRules) {\n                const parsed = this._parseRule(fieldRule);\n                validators.push(this._buildValidator(parsed.name, parsed.args));\n            }\n\n            this.validators[field] = validators;\n        }\n\n        this.isPrepared = true;\n        return this;\n    }\n\n    validate(data) {\n        if (!this.isPrepared) this.prepare();\n\n        if (!util.isObject(data)) {\n            this.errors = 'FORMAT_ERROR';\n            return;\n        }\n\n        if (this.isAutoTrim) {\n            data = this._autoTrim(data);\n        }\n\n        const errors = {};\n        const result = {};\n\n        for (const fieldName in this.validators) {\n            const validators = this.validators[fieldName];\n            if (!validators || !validators.length) continue;\n\n            const value = data[fieldName];\n\n            for (const validator of validators) {\n                const fieldResultArr = [];\n\n                const errCode = validator(\n                    result.hasOwnProperty(fieldName) ? result[fieldName] : value,\n                    data,\n                    fieldResultArr\n                );\n\n                if (errCode) {\n                    errors[fieldName] = errCode;\n                    break;\n                } else if (fieldResultArr.length) {\n                    result[fieldName] = fieldResultArr[0];\n                } else if (data.hasOwnProperty(fieldName) && !result.hasOwnProperty(fieldName)) {\n                    result[fieldName] = value;\n                }\n            }\n        }\n\n        if (util.isEmptyObject(errors)) {\n            this.errors = null;\n            return result;\n        } else {\n            this.errors = errors;\n            return false;\n        }\n    }\n\n    getErrors() {\n        return this.errors;\n    }\n\n    registerRules(rules) {\n        for (const ruleName in rules) {\n            this.validatorBuilders[ruleName] = rules[ruleName];\n        }\n\n        return this;\n    }\n\n    registerAliasedRule(alias) {\n        if (!alias.name) throw 'Alias name required';\n\n        this.validatorBuilders[alias.name] = this.constructor._buildAliasedRule(\n            alias.rules,\n            alias.error\n        );\n\n        return this;\n    }\n\n    getRules() {\n        return this.validatorBuilders;\n    }\n\n    _parseRule(livrRule) {\n        let name;\n        let args;\n\n        if (util.isObject(livrRule)) {\n            name = Object.keys(livrRule)[0];\n            args = livrRule[name];\n\n            if (!Array.isArray(args)) args = [args];\n        } else {\n            name = livrRule;\n            args = [];\n        }\n\n        return { name, args };\n    }\n\n    _buildValidator(name, args) {\n        if (!this.validatorBuilders[name]) {\n            throw 'Rule [' + name + '] not registered';\n        }\n\n        const allArgs = [];\n\n        allArgs.push.apply(allArgs, args);\n        allArgs.push(this.getRules());\n\n        return this.validatorBuilders[name].apply(null, allArgs);\n    }\n\n    _autoTrim(data) {\n        const dataType = typeof data;\n\n        if (dataType !== 'object' && data) {\n            if (data.replace) {\n                return data.replace(/^\\s*/, '').replace(/\\s*$/, '');\n            } else {\n                return data;\n            }\n        } else if (dataType == 'object' && Array.isArray(data)) {\n            const trimmedData = [];\n\n            for (const item of data) {\n                trimmedData.push(this._autoTrim(item));\n            }\n\n            return trimmedData;\n        } else if (dataType == 'object' && util.isObject(data)) {\n            const trimmedData = {};\n\n            for (const key in data) {\n                if (data.hasOwnProperty(key)) {\n                    trimmedData[key] = this._autoTrim(data[key]);\n                }\n            }\n\n            return trimmedData;\n        }\n\n        return data;\n    }\n}\n\nmodule.exports = Validator;\n\n\n//# sourceURL=webpack://livr/./lib/Validator.js?");

/***/ }),

/***/ "./lib/rules/common/any_object.js":
/*!****************************************!*\
  !*** ./lib/rules/common/any_object.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction any_object() {\n    return value => {\n        if (util.isNoValue(value)) return;\n\n        if (!util.isObject(value)) {\n            return 'FORMAT_ERROR';\n        }\n    };\n};\n\nmodule.exports = any_object;\n\n//# sourceURL=webpack://livr/./lib/rules/common/any_object.js?");

/***/ }),

/***/ "./lib/rules/common/not_empty.js":
/*!***************************************!*\
  !*** ./lib/rules/common/not_empty.js ***!
  \***************************************/
/***/ ((module) => {

eval("function not_empty() {\n    return value => {\n        if (value !== null && value !== undefined && value === '') {\n            return 'CANNOT_BE_EMPTY';\n        }\n\n        return;\n    };\n}\n\nmodule.exports = not_empty;\n\n//# sourceURL=webpack://livr/./lib/rules/common/not_empty.js?");

/***/ }),

/***/ "./lib/rules/common/not_empty_list.js":
/*!********************************************!*\
  !*** ./lib/rules/common/not_empty_list.js ***!
  \********************************************/
/***/ ((module) => {

eval("function not_empty_list() {\n    return list => {\n        if (list === undefined || list === '') return 'CANNOT_BE_EMPTY';\n        if (!Array.isArray(list)) return 'FORMAT_ERROR';\n        if (list.length < 1) return 'CANNOT_BE_EMPTY';\n        return;\n    };\n};\n\nmodule.exports = not_empty_list;\n\n//# sourceURL=webpack://livr/./lib/rules/common/not_empty_list.js?");

/***/ }),

/***/ "./lib/rules/common/required.js":
/*!**************************************!*\
  !*** ./lib/rules/common/required.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction required() {\n    return value => {\n        if (util.isNoValue(value)) {\n            return 'REQUIRED';\n        }\n\n        return;\n    };\n};\n\nmodule.exports = required;\n\n//# sourceURL=webpack://livr/./lib/rules/common/required.js?");

/***/ }),

/***/ "./lib/rules/meta/list_of.js":
/*!***********************************!*\
  !*** ./lib/rules/meta/list_of.js ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const Validator = __webpack_require__(/*! ../../Validator */ \"./lib/Validator.js\");\nconst util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction list_of(rules, ruleBuilders) {\n    if (!Array.isArray(rules)) {\n        rules = Array.prototype.slice.call(arguments);\n        ruleBuilders = rules.pop();\n    }\n\n    const livr = { field: rules };\n    const validator = new Validator(livr).registerRules(ruleBuilders).prepare();\n\n    return (values, params, outputArr) => {\n        if (util.isNoValue(values)) return;\n\n        if (!Array.isArray(values)) return 'FORMAT_ERROR';\n\n        const results = [];\n        const errors = [];\n        let hasErrors = false;\n\n        for (const value of values) {\n            const result = validator.validate({ field: value });\n\n            if (result) {\n                results.push(result.field);\n                errors.push(null);\n            } else {\n                hasErrors = true;\n                errors.push(validator.getErrors().field);\n                results.push(null);\n            }\n        }\n\n        if (hasErrors) {\n            return errors;\n        } else {\n            outputArr.push(results);\n            return;\n        }\n    };\n}\n\nmodule.exports = list_of;\n\n//# sourceURL=webpack://livr/./lib/rules/meta/list_of.js?");

/***/ }),

/***/ "./lib/rules/meta/list_of_different_objects.js":
/*!*****************************************************!*\
  !*** ./lib/rules/meta/list_of_different_objects.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const Validator = __webpack_require__(/*! ../../Validator */ \"./lib/Validator.js\");\nconst util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction list_of_different_objects(selectorField, livrs, ruleBuilders) {\n    const validators = {};\n\n    for (const selectorValue in livrs) {\n        const validator = new Validator(livrs[selectorValue])\n            .registerRules(ruleBuilders)\n            .prepare();\n        validators[selectorValue] = validator;\n    }\n\n    return (objects, params, outputArr) => {\n        if (util.isNoValue(objects)) return;\n        if (!Array.isArray(objects)) return 'FORMAT_ERROR';\n\n        const results = [];\n        const errors = [];\n        let hasErrors = false;\n\n        for (const object of objects) {\n            if (\n                typeof object != 'object' ||\n                !object[selectorField] ||\n                !validators[object[selectorField]]\n            ) {\n                errors.push('FORMAT_ERROR');\n                continue;\n            }\n\n            const validator = validators[object[selectorField]];\n            const result = validator.validate(object);\n\n            if (result) {\n                results.push(result);\n                errors.push(null);\n            } else {\n                hasErrors = true;\n                errors.push(validator.getErrors());\n                results.push(null);\n            }\n        }\n\n        if (hasErrors) {\n            return errors;\n        } else {\n            outputArr.push(results);\n            return;\n        }\n    };\n}\n\nmodule.exports = list_of_different_objects;\n\n//# sourceURL=webpack://livr/./lib/rules/meta/list_of_different_objects.js?");

/***/ }),

/***/ "./lib/rules/meta/list_of_objects.js":
/*!*******************************************!*\
  !*** ./lib/rules/meta/list_of_objects.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const Validator = __webpack_require__(/*! ../../Validator */ \"./lib/Validator.js\");\nconst util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction list_of_objects(livr, ruleBuilders) {\n    const validator = new Validator(livr).registerRules(ruleBuilders).prepare();\n\n    return (objects, params, outputArr) => {\n        if (util.isNoValue(objects)) return;\n        if (!Array.isArray(objects)) return 'FORMAT_ERROR';\n\n        const results = [];\n        const errors = [];\n        let hasErrors = false;\n\n        for (const object of objects) {\n            const result = validator.validate(object);\n\n            if (result) {\n                results.push(result);\n                errors.push(null);\n            } else {\n                hasErrors = true;\n                errors.push(validator.getErrors());\n                results.push(null);\n            }\n        }\n\n        if (hasErrors) {\n            return errors;\n        } else {\n            outputArr.push(results);\n            return;\n        }\n    };\n}\n\nmodule.exports = list_of_objects;\n\n//# sourceURL=webpack://livr/./lib/rules/meta/list_of_objects.js?");

/***/ }),

/***/ "./lib/rules/meta/nested_object.js":
/*!*****************************************!*\
  !*** ./lib/rules/meta/nested_object.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const Validator = __webpack_require__(/*! ../../Validator */ \"./lib/Validator.js\");\nconst util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction nested_object(livr, ruleBuilders) {\n    const validator = new Validator(livr).registerRules(ruleBuilders).prepare();\n\n    return (nestedObject, params, outputArr) => {\n        if (util.isNoValue(nestedObject)) return;\n        if (!util.isObject(nestedObject)) return 'FORMAT_ERROR';\n\n        const result = validator.validate(nestedObject);\n\n        if (result) {\n            outputArr.push(result);\n            return;\n        } else {\n            return validator.getErrors();\n        }\n    };\n}\n\nmodule.exports = nested_object;\n\n//# sourceURL=webpack://livr/./lib/rules/meta/nested_object.js?");

/***/ }),

/***/ "./lib/rules/meta/or.js":
/*!******************************!*\
  !*** ./lib/rules/meta/or.js ***!
  \******************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const Validator = __webpack_require__(/*! ../../Validator */ \"./lib/Validator.js\");\n\nfunction or() {\n    const ruleSets = Array.prototype.slice.call(arguments);\n    const ruleBuilders = ruleSets.pop();\n\n    const validators = ruleSets.map(rules => {\n        const livr = { field: rules };\n        const validator = new Validator(livr).registerRules(ruleBuilders).prepare();\n\n        return validator;\n    });\n\n    return (value, params, outputArr) => {\n        let lastError;\n\n        for (const validator of validators) {\n            const result = validator.validate({ field: value });\n\n            if (result) {\n                outputArr.push(result.field);\n                return;\n            } else {\n                lastError = validator.getErrors().field;\n            }\n        }\n\n        return lastError;\n    };\n}\n\nmodule.exports = or;\n\n//# sourceURL=webpack://livr/./lib/rules/meta/or.js?");

/***/ }),

/***/ "./lib/rules/meta/variable_object.js":
/*!*******************************************!*\
  !*** ./lib/rules/meta/variable_object.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const Validator = __webpack_require__(/*! ../../Validator */ \"./lib/Validator.js\");\nconst util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction variable_object(selectorField, livrs, ruleBuilders) {\n    const validators = {};\n\n    for (const selectorValue in livrs) {\n        const validator = new Validator(livrs[selectorValue])\n            .registerRules(ruleBuilders)\n            .prepare();\n        validators[selectorValue] = validator;\n    }\n\n    return (object, params, outputArr) => {\n        if (util.isNoValue(object)) return;\n\n        if (\n            !util.isObject(object) ||\n            !object[selectorField] ||\n            !validators[object[selectorField]]\n        ) {\n            return 'FORMAT_ERROR';\n        }\n\n        const validator = validators[object[selectorField]];\n        const result = validator.validate(object);\n\n        if (result) {\n            outputArr.push(result);\n            return;\n        } else {\n            return validator.getErrors();\n        }\n    };\n}\n\nmodule.exports = variable_object;\n\n\n//# sourceURL=webpack://livr/./lib/rules/meta/variable_object.js?");

/***/ }),

/***/ "./lib/rules/modifiers/default.js":
/*!****************************************!*\
  !*** ./lib/rules/modifiers/default.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nmodule.exports = defaultValue => {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) {\n            outputArr.push(defaultValue);\n        }\n    };\n}\n\n\n\n\n//# sourceURL=webpack://livr/./lib/rules/modifiers/default.js?");

/***/ }),

/***/ "./lib/rules/modifiers/leave_only.js":
/*!*******************************************!*\
  !*** ./lib/rules/modifiers/leave_only.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction leave_only(chars) {\n    chars = util.escapeRegExp(chars);\n    const re = new RegExp('[^' + chars + ']', 'g');\n\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value) || typeof value === 'object') return;\n\n        value += ''; // TODO just skip numbers\n        outputArr.push(value.replace(re, ''));\n    };\n}\n\nmodule.exports = leave_only;\n\n//# sourceURL=webpack://livr/./lib/rules/modifiers/leave_only.js?");

/***/ }),

/***/ "./lib/rules/modifiers/remove.js":
/*!***************************************!*\
  !*** ./lib/rules/modifiers/remove.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction remove(chars) {\n    chars = util.escapeRegExp(chars);\n    const re = new RegExp('[' + chars + ']', 'g');\n\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value) || typeof value === 'object') return;\n\n        value += ''; // TODO just skip numbers\n        outputArr.push(value.replace(re, ''));\n    };\n}\n\nmodule.exports = remove;\n\n//# sourceURL=webpack://livr/./lib/rules/modifiers/remove.js?");

/***/ }),

/***/ "./lib/rules/modifiers/to_lc.js":
/*!**************************************!*\
  !*** ./lib/rules/modifiers/to_lc.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction to_lc() {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value) || typeof value === 'object') return;\n\n        value += ''; // TODO just skip numbers\n        outputArr.push(value.toLowerCase());\n    };\n}\n\nmodule.exports = to_lc;\n\n//# sourceURL=webpack://livr/./lib/rules/modifiers/to_lc.js?");

/***/ }),

/***/ "./lib/rules/modifiers/to_uc.js":
/*!**************************************!*\
  !*** ./lib/rules/modifiers/to_uc.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction to_uc() {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value) || typeof value === 'object') return;\n\n        value += ''; // TODO just skip numbers\n        outputArr.push(value.toUpperCase());\n    };\n}\n\nmodule.exports = to_uc;\n\n//# sourceURL=webpack://livr/./lib/rules/modifiers/to_uc.js?");

/***/ }),

/***/ "./lib/rules/modifiers/trim.js":
/*!*************************************!*\
  !*** ./lib/rules/modifiers/trim.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction trim() {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value) || typeof value === 'object') return;\n\n        value += ''; // TODO just do not trim numbers\n        outputArr.push(value.replace(/^\\s*/, '').replace(/\\s*$/, ''));\n    };\n}\n\nmodule.exports = trim;\n\n//# sourceURL=webpack://livr/./lib/rules/modifiers/trim.js?");

/***/ }),

/***/ "./lib/rules/numeric/decimal.js":
/*!**************************************!*\
  !*** ./lib/rules/numeric/decimal.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction decimal() {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n        if (!util.looksLikeNumber(value)) return 'NOT_DECIMAL';\n\n        value += '';\n        if (!/^(?:\\-?(?:(?:[0-9]+\\.[0-9]+)|(?:[0-9]+)))$/.test(value)) return 'NOT_DECIMAL';\n        outputArr.push(+value);\n    };\n}\n\nmodule.exports = decimal;\n\n//# sourceURL=webpack://livr/./lib/rules/numeric/decimal.js?");

/***/ }),

/***/ "./lib/rules/numeric/integer.js":
/*!**************************************!*\
  !*** ./lib/rules/numeric/integer.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction integer() {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n        if (!util.looksLikeNumber(value)) return 'NOT_INTEGER';\n\n        if (!Number.isInteger(+value)) return 'NOT_INTEGER';\n        outputArr.push(+value);\n    };\n}\n\nmodule.exports = integer;\n\n//# sourceURL=webpack://livr/./lib/rules/numeric/integer.js?");

/***/ }),

/***/ "./lib/rules/numeric/max_number.js":
/*!*****************************************!*\
  !*** ./lib/rules/numeric/max_number.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction max_number(maxNumber) {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n        if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';\n\n        if (+value > +maxNumber) return 'TOO_HIGH';\n        outputArr.push(+value);\n    };\n}\n\nmodule.exports = max_number;\n\n//# sourceURL=webpack://livr/./lib/rules/numeric/max_number.js?");

/***/ }),

/***/ "./lib/rules/numeric/min_number.js":
/*!*****************************************!*\
  !*** ./lib/rules/numeric/min_number.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction min_number(minNumber) {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n        if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';\n\n        if (+value < +minNumber) return 'TOO_LOW';\n        outputArr.push(+value);\n    };\n}\n\nmodule.exports = min_number;\n\n//# sourceURL=webpack://livr/./lib/rules/numeric/min_number.js?");

/***/ }),

/***/ "./lib/rules/numeric/number_between.js":
/*!*********************************************!*\
  !*** ./lib/rules/numeric/number_between.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction number_between(minNumber, maxNumber) {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n        if (!util.looksLikeNumber(value)) return 'NOT_NUMBER';\n\n        if (+value < +minNumber) return 'TOO_LOW';\n        if (+value > +maxNumber) return 'TOO_HIGH';\n        outputArr.push(+value);\n    };\n}\n\nmodule.exports = number_between;\n\n//# sourceURL=webpack://livr/./lib/rules/numeric/number_between.js?");

/***/ }),

/***/ "./lib/rules/numeric/positive_decimal.js":
/*!***********************************************!*\
  !*** ./lib/rules/numeric/positive_decimal.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction positive_decimal() {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n        if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_DECIMAL';\n\n        if (Number.isNaN(+value) || +value <= 0) return 'NOT_POSITIVE_DECIMAL';\n        outputArr.push(+value);\n    };\n}\n\nmodule.exports = positive_decimal;\n\n\n//# sourceURL=webpack://livr/./lib/rules/numeric/positive_decimal.js?");

/***/ }),

/***/ "./lib/rules/numeric/positive_integer.js":
/*!***********************************************!*\
  !*** ./lib/rules/numeric/positive_integer.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction positive_integer() {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n        if (!util.looksLikeNumber(value)) return 'NOT_POSITIVE_INTEGER';\n\n        if (!Number.isInteger(+value) || +value < 1) return 'NOT_POSITIVE_INTEGER';\n        outputArr.push(+value);\n    };\n}\n\nmodule.exports = positive_integer;\n\n//# sourceURL=webpack://livr/./lib/rules/numeric/positive_integer.js?");

/***/ }),

/***/ "./lib/rules/special/email.js":
/*!************************************!*\
  !*** ./lib/rules/special/email.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction email() {\n    var emailRe = /^(([^<>()\\[\\]\\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@\"]+)*)|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$/;\n\n    return value => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        value += '';\n        if (!emailRe.test(value)) return 'WRONG_EMAIL';\n        if (/\\@.*\\@/.test(value)) return 'WRONG_EMAIL';\n        if (/\\@.*_/.test(value)) return 'WRONG_EMAIL';\n        return;\n    };\n}\n\nmodule.exports = email;\n\n//# sourceURL=webpack://livr/./lib/rules/special/email.js?");

/***/ }),

/***/ "./lib/rules/special/equal_to_field.js":
/*!*********************************************!*\
  !*** ./lib/rules/special/equal_to_field.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction equal_to_field(field) {\n    return (value, params) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        if (value != params[field]) return 'FIELDS_NOT_EQUAL';\n        return;\n    };\n}\n\nmodule.exports = equal_to_field;\n\n//# sourceURL=webpack://livr/./lib/rules/special/equal_to_field.js?");

/***/ }),

/***/ "./lib/rules/special/iso_date.js":
/*!***************************************!*\
  !*** ./lib/rules/special/iso_date.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction iso_date() {\n    return value => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        const matched = value.match(/^(\\d{4})-([0-1][0-9])-([0-3][0-9])$/);\n\n        if (matched) {\n            const epoch = Date.parse(value);\n            if (!epoch && epoch !== 0) return 'WRONG_DATE';\n\n            const d = new Date(epoch);\n            d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);\n\n            if (\n                d.getFullYear() == matched[1] &&\n                d.getMonth() + 1 == +matched[2] &&\n                d.getDate() == +matched[3]\n            ) {\n                return;\n            }\n        }\n\n        return 'WRONG_DATE';\n    };\n}\n\nmodule.exports = iso_date;\n\n//# sourceURL=webpack://livr/./lib/rules/special/iso_date.js?");

/***/ }),

/***/ "./lib/rules/special/url.js":
/*!**********************************!*\
  !*** ./lib/rules/special/url.js ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction url() {\n    const urlReStr =\n        '^(?:(?:http|https)://)(?:\\\\S+(?::\\\\S*)?@)?(?:(?:(?:[1-9]\\\\d?|1\\\\d\\\\d|2[0-1]\\\\d|22[0-3])(?:\\\\.(?:1?\\\\d{1,2}|2[0-4]\\\\d|25[0-5])){2}(?:\\\\.(?:[0-9]\\\\d?|1\\\\d\\\\d|2[0-4]\\\\d|25[0-4]))|(?:(?:[a-z\\\\u00a1-\\\\uffff0-9]-*)*[a-z\\\\u00a1-\\\\uffff0-9]+)(?:\\\\.(?:[a-z\\\\u00a1-\\\\uffff0-9]-*)*[a-z\\\\u00a1-\\\\uffff0-9]+)*(?:\\\\.(?:[a-z\\\\u00a1-\\\\uffff]{2,})))\\\\.?|localhost)(?::\\\\d{2,5})?(?:[/?#]\\\\S*)?$';\n    const urlRe = new RegExp(urlReStr, 'i');\n\n    return value => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        if (value.length < 2083 && urlRe.test(value)) return;\n        return 'WRONG_URL';\n    };\n}\n\nmodule.exports = url;\n\n//# sourceURL=webpack://livr/./lib/rules/special/url.js?");

/***/ }),

/***/ "./lib/rules/string/eq.js":
/*!********************************!*\
  !*** ./lib/rules/string/eq.js ***!
  \********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction eq(allowedValue) {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        if (value + '' === allowedValue + '') {\n            outputArr.push(allowedValue);\n            return;\n        }\n\n        return 'NOT_ALLOWED_VALUE';\n    };\n}\n\nmodule.exports = eq;\n\n//# sourceURL=webpack://livr/./lib/rules/string/eq.js?");

/***/ }),

/***/ "./lib/rules/string/length_between.js":
/*!********************************************!*\
  !*** ./lib/rules/string/length_between.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction length_between(minLength, maxLength) {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        value += '';\n        if (value.length < minLength) return 'TOO_SHORT';\n        if (value.length > maxLength) return 'TOO_LONG';\n        outputArr.push(value);\n    };\n}\n\nmodule.exports = length_between;\n\n//# sourceURL=webpack://livr/./lib/rules/string/length_between.js?");

/***/ }),

/***/ "./lib/rules/string/length_equal.js":
/*!******************************************!*\
  !*** ./lib/rules/string/length_equal.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction length_equal(length) {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        value += '';\n        if (value.length < length) return 'TOO_SHORT';\n        if (value.length > length) return 'TOO_LONG';\n        outputArr.push(value);\n    };\n}\n\nmodule.exports = length_equal;\n\n//# sourceURL=webpack://livr/./lib/rules/string/length_equal.js?");

/***/ }),

/***/ "./lib/rules/string/like.js":
/*!**********************************!*\
  !*** ./lib/rules/string/like.js ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction like(reStr, flags) {\n    const isIgnoreCase = arguments.length === 3 && flags.match('i');\n    const re = new RegExp(reStr, isIgnoreCase ? 'i' : '');\n\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        value += '';\n        if (!value.match(re)) return 'WRONG_FORMAT';\n        outputArr.push(value);\n    };\n}\n\nmodule.exports = like;\n\n//# sourceURL=webpack://livr/./lib/rules/string/like.js?");

/***/ }),

/***/ "./lib/rules/string/max_length.js":
/*!****************************************!*\
  !*** ./lib/rules/string/max_length.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n \nfunction max_length(maxLength) {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        value += '';\n        if (value.length > maxLength) return 'TOO_LONG';\n        outputArr.push(value);\n    };\n}\n\nmodule.exports = max_length;\n\n//# sourceURL=webpack://livr/./lib/rules/string/max_length.js?");

/***/ }),

/***/ "./lib/rules/string/min_length.js":
/*!****************************************!*\
  !*** ./lib/rules/string/min_length.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction min_length(minLength) {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        value += '';\n        if (value.length < minLength) return 'TOO_SHORT';\n        outputArr.push(value);\n    };\n}\n\nmodule.exports = min_length;\n\n//# sourceURL=webpack://livr/./lib/rules/string/min_length.js?");

/***/ }),

/***/ "./lib/rules/string/one_of.js":
/*!************************************!*\
  !*** ./lib/rules/string/one_of.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction one_of(allowedValues) {\n    if (!Array.isArray(allowedValues)) {\n        allowedValues = Array.prototype.slice.call(arguments);\n        allowedValues.pop(); // pop ruleBuilders\n    }\n\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        for (const allowedValue of allowedValues) {\n            if (value + '' === allowedValue + '') {\n                outputArr.push(allowedValue);\n                return;\n            }\n        }\n\n        return 'NOT_ALLOWED_VALUE';\n    };\n}\n\nmodule.exports = one_of;\n\n//# sourceURL=webpack://livr/./lib/rules/string/one_of.js?");

/***/ }),

/***/ "./lib/rules/string/string.js":
/*!************************************!*\
  !*** ./lib/rules/string/string.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const util = __webpack_require__(/*! ../../util */ \"./lib/util.js\");\n\nfunction string() {\n    return (value, params, outputArr) => {\n        if (util.isNoValue(value)) return;\n        if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';\n\n        outputArr.push(value + '');\n        return;\n    };\n}\n\nmodule.exports = string;\n\n//# sourceURL=webpack://livr/./lib/rules/string/string.js?");

/***/ }),

/***/ "./lib/util.js":
/*!*********************!*\
  !*** ./lib/util.js ***!
  \*********************/
/***/ ((module) => {

eval("module.exports = {\n    isPrimitiveValue(value) {\n        if (typeof value == 'string') return true;\n        if (typeof value == 'number' && isFinite(value)) return true;\n        if (typeof value == 'boolean') return true;\n        return false;\n    },\n\n    looksLikeNumber(value) {\n        if (!isNaN(+value)) return true;\n        return false;\n    },\n\n    isObject(obj) {\n        return Object(obj) === obj && Object.getPrototypeOf(obj) === Object.prototype;\n    },\n\n    isEmptyObject(map) {\n        for (const key in map) {\n            if (map.hasOwnProperty(key)) {\n                return false;\n            }\n        }\n        return true;\n    },\n\n    escapeRegExp(str) {\n        return str.replace(/[\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|]/g, '\\\\$&');\n    },\n\n    isNoValue(value) {\n        return value === undefined || value === null || value === '';\n    }\n};\n\n\n//# sourceURL=webpack://livr/./lib/util.js?");

/***/ }),

/***/ "./scripts/browser_build_entry.js":
/*!****************************************!*\
  !*** ./scripts/browser_build_entry.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("window.LIVR = __webpack_require__(/*! ../lib/LIVR */ \"./lib/LIVR.js\");\n\n\n//# sourceURL=webpack://livr/./scripts/browser_build_entry.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./scripts/browser_build_entry.js");
/******/ 	
/******/ })()
;