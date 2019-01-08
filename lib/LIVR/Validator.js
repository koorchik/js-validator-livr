'use strict';

const util = require('./util');

const DEFAULT_RULES = {};
let IS_DEFAULT_AUTO_TRIM = 0;

class Validator {
    constructor(livrRules, isAutoTrim) {
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

    static getDefaultRules() {
        return DEFAULT_RULES;
    }
    
    static registerAliasedDefaultRule(alias) {
        if (!alias.name) throw 'Alias name required';
    
        DEFAULT_RULES[alias.name] = this.constructor._buildAliasedRule(alias);
    }
    
    static registerDefaultRules(rules) {
        for (const ruleName in rules) {
            DEFAULT_RULES[ruleName] = rules[ruleName];
        }
    }
    
    static defaultAutoTrim(isAutoTrim) {
        IS_DEFAULT_AUTO_TRIM = !!isAutoTrim;
    }

    static _buildAliasedRule(alias) {
        if (!alias.name) throw 'Alias name required';
        if (!alias.rules) throw 'Alias rules required';
    
        const livr = {value: alias.rules};
    
        return function(ruleBuilders) {
            const validator = new Validator(livr).registerRules(ruleBuilders).prepare();
    
            return function( value, params, outputArr ) {
                const result = validator.validate({value: value});
    
                if (result) {
                    outputArr.push(result.value);
                    return;
                } else {
                    return alias.error || validator.getErrors().value;
                }
            };
        };
    }

    prepare() {
        const allRules = this.livrRules;

        for (const field in allRules) {
            let fieldRules = allRules[field];

            if ( !Array.isArray(fieldRules) ) {
                fieldRules = [fieldRules];
            }

            const validators = [];

            for (let i=0; i<fieldRules.length; i++) {
                const parsed = this._parseRule(fieldRules[i]);
                validators.push( this._buildValidator(parsed.name, parsed.args) );
            }

            this.validators[field] = validators;
        }

        this.isPrepared = true;
        return this;
    }

    validate(data) {
        if (!this.isPrepared) this.prepare();

        if (! util.isObject(data) ) {
            this.errors = 'FORMAT_ERROR';
            return;
        }

        if ( this.isAutoTrim ) {
            data = this._autoTrim(data);
        }

        const errors = {}; 
        const result = {};

        for (const fieldName in this.validators) {
            const validators = this.validators[fieldName];
            if (!validators || !validators.length) continue;

            const value = data[fieldName];

            for (let i=0; i<validators.length; i++) {
                const fieldResultArr = [];

                const errCode = validators[i](
                    result.hasOwnProperty(fieldName) ? result[fieldName] : value,
                    data,
                    fieldResultArr
                );

                if (errCode) {
                    errors[fieldName] = errCode;
                    break;
                } else if ( fieldResultArr.length ) {
                    result[fieldName] = fieldResultArr[0];
                } else if ( data.hasOwnProperty(fieldName) && !result.hasOwnProperty(fieldName) ) {
                    result[fieldName] = value;
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

    }

    getErrors() {
        return this.errors;
    }

    registerRules(rules) {
        for (const ruleName in rules) {
            this.validatorBuilders[ruleName] = rules[ruleName];
        }

        return this;
    }

    registerAliasedRule(alias) {
        if (!alias.name) throw 'Alias name required';
        this.validatorBuilders[alias.name] = this.constructor._buildAliasedRule(alias);

        return this;
    }

    getRules() {
        return this.validatorBuilders;
    }

    _parseRule(livrRule) {
        let name;
        let args;

        if ( util.isObject(livrRule) ) {
            name = Object.keys(livrRule)[0];
            args = livrRule[ name ];

            if ( ! Array.isArray(args) ) args = [args];
        } else {
            name = livrRule;
            args = [];
        }

        return {name: name, args: args};
    }

    _buildValidator(name, args)  {
        if ( !this.validatorBuilders[name] ) {
            throw 'Rule [' + name + '] not registered';
        }

        const allArgs = [];

        allArgs.push.apply(allArgs, args);
        allArgs.push( this.getRules() );

        return this.validatorBuilders[name].apply(null, allArgs);
    }

    _autoTrim(data) {
        const dataType = typeof data;

        if ( dataType !== 'object' && data ) {
            if (data.replace) {
                return data.replace(/^\s*/, '').replace(/\s*$/, '');
            } else {
                return data;
            }
        } else if ( dataType == 'object' && Array.isArray(data) ) {
            const trimmedData = [];

            for (let i = 0; i < data.length; i++) {
                trimmedData[i] = this._autoTrim( data[i] );
            }

            return trimmedData;
        } else if ( dataType == 'object' && util.isObject(data) ) {
            const trimmedData = {};

            for (const key in data) {
                if ( data.hasOwnProperty(key) ) {
                    trimmedData[key] = this._autoTrim( data[key] );
                }
            }

            return trimmedData;
        }

        return data;
    }
}



module.exports = Validator;
