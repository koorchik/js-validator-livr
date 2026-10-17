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
        let options = {};
        if (util.isObject(arg)) {
            options = arg;
        } else if (arg !== null && arg !== undefined) {
            options.autoTrim = arg;
        }

        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.isPrepared = false;
        this.livrRules = livrRules;
        this.validators = {};
        this.validatorBuilders = {};
    }

    static _initDefaultRules() {
        this._builtInRules = Object.create(null);
    }

    // For the entry points (livr, livr/async): built-in rules of this validator family
    static _registerBuiltInRules(rules) {
        for (const ruleName in rules) addRule(this._builtInRules, ruleName, rules[ruleName]);
    }

    static _findDefaultRule(name) {
        if (hasOwn.call(SHARED_DEFAULT_RULES, name)) return SHARED_DEFAULT_RULES[name];
        if (hasOwn.call(this._builtInRules, name)) return this._builtInRules[name];
    }

    static getDefaultRules() {
        return { ...this._builtInRules, ...SHARED_DEFAULT_RULES };
    }

    static registerAliasedDefaultRule(alias) {
        if (!alias.name) throw new Error('Alias name required');

        const ruleBuilder = this.buildAliasedRule(alias.rules, alias.error);
        addRule(SHARED_DEFAULT_RULES, alias.name, ruleBuilder);
    }

    static registerDefaultRules(rules) {
        for (const ruleName in rules) addRule(SHARED_DEFAULT_RULES, ruleName, rules[ruleName]);
    }

    static defaultAutoTrim(isAutoTrim) {
        DEFAULT_OPTIONS.autoTrim = !!isAutoTrim;
    }

    prepare() {
        const allRules = this.livrRules;

        for (const field in allRules) {
            if (field === '__proto__') continue;
            let fieldRules = allRules[field];

            if (!Array.isArray(fieldRules)) {
                fieldRules = [fieldRules];
            }

            const validators = [];

            for (const fieldRule of fieldRules) {
                const parsed = this._parseRule(fieldRule);
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

        if (util.isObject(livrRule)) {
            name = Object.keys(livrRule)[0];
            args = livrRule[name];

            if (!Array.isArray(args)) args = [args];
        } else {
            name = livrRule;
            args = [];
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
