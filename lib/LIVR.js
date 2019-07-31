const Validator = require('./Validator');
const util = require('./util');

const rules = {
    required:         require('./rules/common/required'),
    not_empty:        require('./rules/common/not_empty'),
    not_empty_list:   require('./rules/common/not_empty_list'),
    any_object:       require('./rules/common/any_object'),

    string:           require('./rules/string/string'),
    eq:               require('./rules/string/eq'),
    one_of:           require('./rules/string/one_of'),
    max_length:       require('./rules/string/max_length'),
    min_length:       require('./rules/string/min_length'),
    length_equal:     require('./rules/string/length_equal'),
    length_between:   require('./rules/string/length_between'),
    like:             require('./rules/string/like'),

    integer:          require('./rules/numeric/integer'),
    positive_integer: require('./rules/numeric/positive_integer'),
    decimal:          require('./rules/numeric/decimal'),
    positive_decimal: require('./rules/numeric/positive_decimal'),
    max_number:       require('./rules/numeric/max_number'),
    min_number:       require('./rules/numeric/min_number'),
    number_between:   require('./rules/numeric/number_between'),

    email:            require('./rules/special/email'),
    equal_to_field:   require('./rules/special/equal_to_field'),
    url:              require('./rules/special/url'),
    iso_date:         require('./rules/special/iso_date'),

    nested_object:    require('./rules/meta/nested_object'),
    variable_object:  require('./rules/meta/variable_object'),
    list_of:          require('./rules/meta/list_of'),
    list_of_objects:  require('./rules/meta/list_of_objects'),
    or:               require('./rules/meta/or'),
    list_of_different_objects: require('./rules/meta/list_of_different_objects'),

    default:          require('./rules/modifiers/default'),
    trim:             require('./rules/modifiers/trim'),
    to_lc:            require('./rules/modifiers/to_lc'),
    to_uc:            require('./rules/modifiers/to_uc'),
    remove:           require('./rules/modifiers/remove'),
    leave_only:       require('./rules/modifiers/leave_only')
};

Validator.registerDefaultRules(rules);

module.exports = { Validator, rules, util };
