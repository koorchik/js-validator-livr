'use strict';

const Validator = require('./LIVR/Validator');
const util = require('./LIVR/util');

const rules = {
    required:         require('./LIVR/rules/common/required'),
    not_empty:        require('./LIVR/rules/common/not_empty'),
    not_empty_list:   require('./LIVR/rules/common/not_empty_list'),
    any_object:       require('./LIVR/rules/common/any_object'),

    string:           require('./LIVR/rules/string/string'),
    eq:               require('./LIVR/rules/string/eq'),
    one_of:           require('./LIVR/rules/string/one_of'),
    max_length:       require('./LIVR/rules/string/max_length'),
    min_length:       require('./LIVR/rules/string/min_length'),
    length_equal:     require('./LIVR/rules/string/length_equal'),
    length_between:   require('./LIVR/rules/string/length_between'),
    like:             require('./LIVR/rules/string/like'),

    integer:          require('./LIVR/rules/numeric/integer'),
    positive_integer: require('./LIVR/rules/numeric/positive_integer'),
    decimal:          require('./LIVR/rules/numeric/decimal'),
    positive_decimal: require('./LIVR/rules/numeric/positive_decimal'),
    max_number:       require('./LIVR/rules/numeric/max_number'),
    min_number:       require('./LIVR/rules/numeric/min_number'),
    number_between:   require('./LIVR/rules/numeric/number_between'),

    email:            require('./LIVR/rules/special/email'),
    equal_to_field:   require('./LIVR/rules/special/equal_to_field'),
    url:              require('./LIVR/rules/special/url'),
    iso_date:         require('./LIVR/rules/special/iso_date'),

    nested_object:    require('./LIVR/rules/meta/nested_object'),
    variable_object:  require('./LIVR/rules/meta/variable_object'),
    list_of:          require('./LIVR/rules/meta/list_of'),
    list_of_objects:  require('./LIVR/rules/meta/list_of_objects'),
    or:               require('./LIVR/rules/meta/or'),
    list_of_different_objects: require('./LIVR/rules/meta/list_of_different_objects'),

    default:          require('./LIVR/rules/modifiers/default'),
    trim:             require('./LIVR/rules/modifiers/trim'),
    to_lc:            require('./LIVR/rules/modifiers/to_lc'),
    to_uc:            require('./LIVR/rules/modifiers/to_uc'),
    remove:           require('./LIVR/rules/modifiers/remove'),
    leave_only:       require('./LIVR/rules/modifiers/leave_only')
};

Validator.registerDefaultRules(rules);

const LIVR = {Validator, rules, util};

module.exports = LIVR;
