'use strict';

var LIVR = {rules: {}};

LIVR.rules.common  = require('./LIVR/Rules/Common');
LIVR.rules.string  = require('./LIVR/Rules/String');
LIVR.rules.numeric = require('./LIVR/Rules/Numeric');
LIVR.rules.special = require('./LIVR/Rules/Special');
LIVR.rules.meta    = require('./LIVR/Rules/Meta');
LIVR.rules.modifiers = require('./LIVR/Rules/Modifiers');

LIVR.Validator = require('./LIVR/Validator');
LIVR.util = require('./LIVR/util');

LIVR.Validator.registerDefaultRules({
    required:         LIVR.rules.common.required,
    not_empty:        LIVR.rules.common.not_empty,
    not_empty_list:   LIVR.rules.common.not_empty_list,
    any_object:       LIVR.rules.common.any_object,

    string:           LIVR.rules.string.string,
    eq:               LIVR.rules.string.eq,
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

    nested_object:    LIVR.rules.meta.nested_object,
    variable_object:  LIVR.rules.meta.variable_object,
    list_of:          LIVR.rules.meta.list_of,
    list_of_objects:  LIVR.rules.meta.list_of_objects,
    or:               LIVR.rules.meta.or,
    list_of_different_objects: LIVR.rules.meta.list_of_different_objects,

    default:          LIVR.rules.modifiers.default,
    trim:             LIVR.rules.modifiers.trim,
    to_lc:            LIVR.rules.modifiers.to_lc,
    to_uc:            LIVR.rules.modifiers.to_uc,
    remove:           LIVR.rules.modifiers.remove,
    leave_only:       LIVR.rules.modifiers.leave_only
});

module.exports = LIVR;
