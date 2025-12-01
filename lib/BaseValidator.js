'use strict';

const util = require('./util');

const DEFAULT_VALIDATOR_BUILDERS = {};
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

    static getDefaultRules() {
        return DEFAULT_VALIDATOR_BUILDERS;
    }

    static registerAliasedDefaultRule(alias) {
        if (!alias.name) throw new Error('Alias name required');

        DEFAULT_VALIDATOR_BUILDERS[alias.name] = this.buildAliasedRule(alias.rules, alias.error);

        const camelizedName = util.camelize(alias.name);
        if (DEFAULT_VALIDATOR_BUILDERS[camelizedName]) {
            DEFAULT_VALIDATOR_BUILDERS[camelizedName] = DEFAULT_VALIDATOR_BUILDERS[alias.name];
        }
    }

    static registerDefaultRules(rules) {
        for (const ruleName in rules) {
            DEFAULT_VALIDATOR_BUILDERS[ruleName] = rules[ruleName];

            const camelizedName = util.camelize(ruleName);
            if (!DEFAULT_VALIDATOR_BUILDERS[camelizedName]) {
                DEFAULT_VALIDATOR_BUILDERS[camelizedName] = DEFAULT_VALIDATOR_BUILDERS[ruleName];
            }
        }
    }

    static defaultAutoTrim(isAutoTrim) {
        DEFAULT_OPTIONS.autoTrim = !!isAutoTrim;
    }

    prepare() {
        const allRules = this.livrRules;

        for (const field in allRules) {
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
        const validatorBuilder = this.validatorBuilders[name] || DEFAULT_VALIDATOR_BUILDERS[name];

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
                trimmedData[key] = this._autoTrim(data[key]);
            }
            return trimmedData;
        }

        return data;
    }
}

module.exports = BaseValidator;
