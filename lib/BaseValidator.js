'use strict';

const util = require('./util');

const DEFAULT_RULES = {};
let IS_DEFAULT_AUTO_TRIM = 0;

class BaseValidator {
    constructor(livrRules, isAutoTrim) {
        this.isPrepared = false;
        this.livrRules = livrRules;
        this.validators = {};
        this.validatorBuilders = {};

        if (isAutoTrim !== null && isAutoTrim !== undefined) {
            this.isAutoTrim = isAutoTrim;
        } else {
            this.isAutoTrim = IS_DEFAULT_AUTO_TRIM;
        }

        this.registerRules(DEFAULT_RULES);
    }

    static getDefaultRules() {
        return DEFAULT_RULES;
    }

    static registerAliasedDefaultRule(alias) {
        if (!alias.name) throw 'Alias name required';

        DEFAULT_RULES[alias.name] = this.buildAliasedRule(alias.rules, alias.error);
    }

    static registerDefaultRules(rules) {
        for (const ruleName in rules) {
            DEFAULT_RULES[ruleName] = rules[ruleName];
        }
    }

    static defaultAutoTrim(isAutoTrim) {
        IS_DEFAULT_AUTO_TRIM = !!isAutoTrim;
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
        if (!alias.name) throw 'Alias name required';

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
        if (!this.validatorBuilders[name]) {
            throw 'Rule [' + name + '] not registered';
        }

        const allArgs = [];

        allArgs.push.apply(allArgs, args);
        allArgs.push(this.getRules());

        return this.validatorBuilders[name].apply(null, allArgs);
    }

    _autoTrim(data) {
        const dataType = typeof data;

        if (dataType !== 'object' && data) {
            if (data.replace) {
                return data.replace(/^\s*/, '').replace(/\s*$/, '');
            } else {
                return data;
            }
        } else if (dataType == 'object' && Array.isArray(data)) {
            const trimmedData = [];

            for (const item of data) {
                trimmedData.push(this._autoTrim(item));
            }

            return trimmedData;
        } else if (dataType == 'object' && util.isObject(data)) {
            const trimmedData = {};

            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    trimmedData[key] = this._autoTrim(data[key]);
                }
            }

            return trimmedData;
        }

        return data;
    }
}

module.exports = BaseValidator;
