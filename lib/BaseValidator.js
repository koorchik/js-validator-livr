'use strict';

const util = require('./util');

const hasOwn = Object.prototype.hasOwnProperty;

// Built-in rules are stored per validator family (Validator, AsyncValidator and their
// subclasses): their meta rules differ, and both entry points can be loaded in one process.
// Rules registered through registerDefaultRules() and registerAliasedDefaultRule() are shared by
// all families and take precedence over built-in rules, so overriding a rule through one class
// changes it in the other one too. Registries have no prototype: rule names like "toString" or
// "__proto__" are not registered unless added explicitly.
const SHARED_DEFAULT_RULES = Object.create(null);

// Validator families (classes with their own built-in rules). Each one keeps its built-in and the
// shared rules in one registry (_defaultRules), rebuilt on every registration: rule lookup is
// one property read then, which matters when a validator is created for every validation.
const FAMILIES = [];

function rebuildDefaultRules(family) {
    family._defaultRules = Object.assign(
        Object.create(null),
        family._builtInRules,
        SHARED_DEFAULT_RULES
    );
}

// For rules without arguments: _buildValidator() only reads its length
const NO_ARGS = [];

// Adds a rule and its camelCase name. The camelCase name follows the rule,
// unless it was registered as a separate rule.
function addRule(registry, name, ruleBuilder) {
    const camelizedName = util.camelize(name);

    if (
        camelizedName !== name &&
        (!hasOwn.call(registry, camelizedName) || registry[camelizedName] === registry[name])
    ) {
        registry[camelizedName] = ruleBuilder;
    }

    registry[name] = ruleBuilder;
}

const DEFAULT_OPTIONS = {
    autoTrim: false,
};

class BaseValidator {
    constructor(livrRules, arg) {
        if (arg === null || arg === undefined) {
            // The common case, same as the spread below: DEFAULT_OPTIONS has only autoTrim
            this.options = { autoTrim: DEFAULT_OPTIONS.autoTrim };
        } else {
            let options = {};
            if (util.isObject(arg)) {
                options = arg;
            } else {
                options.autoTrim = arg;
            }

            this.options = { ...DEFAULT_OPTIONS, ...options };
        }

        this.isPrepared = false;
        this.livrRules = livrRules;
        this.validators = {};
        this.validatorBuilders = {};
    }

    static _initDefaultRules() {
        this._builtInRules = Object.create(null);
        FAMILIES.push(this);
        rebuildDefaultRules(this);
    }

    // For the entry points (livr, livr/async): built-in rules of this validator family
    static _registerBuiltInRules(rules) {
        for (const ruleName in rules) addRule(this._builtInRules, ruleName, rules[ruleName]);
        rebuildDefaultRules(this);
    }

    // The registry has no prototype, so a missing rule is undefined
    static _findDefaultRule(name) {
        return this._defaultRules[name];
    }

    static getDefaultRules() {
        return { ...this._defaultRules };
    }

    static registerAliasedDefaultRule(alias) {
        if (!alias.name) throw new Error('Alias name required');

        const ruleBuilder = this.buildAliasedRule(alias.rules, alias.error);
        addRule(SHARED_DEFAULT_RULES, alias.name, ruleBuilder);
        FAMILIES.forEach(rebuildDefaultRules);
    }

    static registerDefaultRules(rules) {
        for (const ruleName in rules) addRule(SHARED_DEFAULT_RULES, ruleName, rules[ruleName]);
        FAMILIES.forEach(rebuildDefaultRules);
    }

    static defaultAutoTrim(isAutoTrim) {
        DEFAULT_OPTIONS.autoTrim = !!isAutoTrim;
    }

    prepare() {
        const allRules = this.livrRules;

        for (const field in allRules) {
            if (field === '__proto__') continue;
            const fieldRules = allRules[field];
            const validators = [];

            if (Array.isArray(fieldRules)) {
                for (let i = 0; i < fieldRules.length; i++) {
                    const parsed = this._parseRule(fieldRules[i]);
                    validators.push(this._buildValidator(parsed.name, parsed.args));
                }
            } else {
                const parsed = this._parseRule(fieldRules);
                validators.push(this._buildValidator(parsed.name, parsed.args));
            }

            this.validators[field] = validators;
        }

        this.isPrepared = true;
        return this;
    }

    registerRules(rules) {
        for (const ruleName in rules) {
            this.validatorBuilders[ruleName] = rules[ruleName];
        }

        return this;
    }

    registerAliasedRule(alias) {
        if (!alias.name) throw new Error('Alias name required');

        this.validatorBuilders[alias.name] = this.constructor.buildAliasedRule(
            alias.rules,
            alias.error
        );

        return this;
    }

    getRules() {
        return this.validatorBuilders;
    }

    // Prepared rule functions of a field, for getFieldRule()
    _getFieldValidators(fieldName) {
        if (!this.isPrepared) this.prepare();

        if (!hasOwn.call(this.validators, fieldName)) {
            throw new Error(`Field [${fieldName}] is not in the schema`);
        }

        return this.validators[fieldName];
    }

    _parseRule(livrRule) {
        let name;
        let args;

        if (typeof livrRule === 'string') {
            // The most common form: a rule without arguments
            name = livrRule;
            args = NO_ARGS;
        } else if (util.isObject(livrRule)) {
            // The first own key, like Object.keys(livrRule)[0], without creating the keys array.
            // Own keys come first in for-in, so an inherited first key means no own keys
            for (const key in livrRule) {
                if (hasOwn.call(livrRule, key)) name = key;
                break;
            }
            args = livrRule[name];

            if (!Array.isArray(args)) args = [args];
        } else {
            name = livrRule;
            args = NO_ARGS;
        }

        return { name, args };
    }

    _buildValidator(name, args) {
        // Own properties only: "toString" or "constructor" are not rules of a plain object
        const validatorBuilder = hasOwn.call(this.validatorBuilders, name)
            ? this.validatorBuilders[name]
            : this.constructor._findDefaultRule(name);

        if (!validatorBuilder) {
            throw new Error(`Rule [${name}] not registered`);
        }

        const ruleBuilders = this.getRules();

        // Direct calls for common arities: spread is slow for a new validator per request
        switch (args.length) {
            case 0:
                return validatorBuilder(ruleBuilders);
            case 1:
                return validatorBuilder(args[0], ruleBuilders);
            case 2:
                return validatorBuilder(args[0], args[1], ruleBuilders);
            case 3:
                return validatorBuilder(args[0], args[1], args[2], ruleBuilders);
            case 4:
                return validatorBuilder(args[0], args[1], args[2], args[3], ruleBuilders);
            default:
                return validatorBuilder(...args, ruleBuilders);
        }
    }

    _autoTrim(data) {
        if (data === null || data === undefined) {
            return data;
        }

        const dataType = typeof data;

        if (dataType === 'string') {
            return data.trim();
        }

        if (dataType !== 'object') {
            return data;
        }

        if (Array.isArray(data)) {
            const len = data.length;
            const trimmedData = new Array(len);
            for (let i = 0; i < len; i++) {
                trimmedData[i] = this._autoTrim(data[i]);
            }
            return trimmedData;
        }

        if (util.isObject(data)) {
            const trimmedData = {};
            const keys = Object.keys(data);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key === '__proto__') continue;
                trimmedData[key] = this._autoTrim(data[key]);
            }
            return trimmedData;
        }

        return data;
    }
}

BaseValidator._initDefaultRules();

module.exports = BaseValidator;
