'use strict';

const util = require('./util');

// Default rules are stored per validator family (Validator, AsyncValidator and their subclasses):
// their meta rules differ, and both entry points can be loaded in one process.
// A rule missing in the family registry is looked up in the other families,
// so custom rules registered through one class keep working in the other.
const DEFAULT_RULES_REGISTRIES = [];

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
        this._defaultValidatorBuilders = {};
        DEFAULT_RULES_REGISTRIES.push(this._defaultValidatorBuilders);
    }

    static _findDefaultRule(name) {
        const validatorBuilder = this._defaultValidatorBuilders[name];
        if (validatorBuilder) return validatorBuilder;

        for (const defaultValidatorBuilders of DEFAULT_RULES_REGISTRIES) {
            if (defaultValidatorBuilders[name]) return defaultValidatorBuilders[name];
        }
    }

    static getDefaultRules() {
        return this._defaultValidatorBuilders;
    }

    static registerAliasedDefaultRule(alias) {
        if (!alias.name) throw new Error('Alias name required');

        const defaultValidatorBuilders = this._defaultValidatorBuilders;
        defaultValidatorBuilders[alias.name] = this.buildAliasedRule(alias.rules, alias.error);

        const camelizedName = util.camelize(alias.name);
        if (defaultValidatorBuilders[camelizedName]) {
            defaultValidatorBuilders[camelizedName] = defaultValidatorBuilders[alias.name];
        }
    }

    static registerDefaultRules(rules) {
        const defaultValidatorBuilders = this._defaultValidatorBuilders;

        for (const ruleName in rules) {
            defaultValidatorBuilders[ruleName] = rules[ruleName];

            const camelizedName = util.camelize(ruleName);
            if (!defaultValidatorBuilders[camelizedName]) {
                defaultValidatorBuilders[camelizedName] = defaultValidatorBuilders[ruleName];
            }
        }
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
        const validatorBuilder = this.validatorBuilders[name] || this.constructor._findDefaultRule(name);

        if (!validatorBuilder) {
            throw new Error(`Rule [${name}] not registered`);
        }

        return validatorBuilder(...args, this.getRules());
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

        if (data.constructor === Object) {
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
