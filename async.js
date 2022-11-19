const AsyncValidator = require('./lib/AsyncValidator');
const util = require('./lib/util');

const rules = {
    required:         require('./lib/rules/common/required'),
    not_empty:        require('./lib/rules/common/not_empty'),
    not_empty_list:   require('./lib/rules/common/not_empty_list'),
    any_object:       require('./lib/rules/common/any_object'),

    string:           require('./lib/rules/string/string'),
    eq:               require('./lib/rules/string/eq'),
    one_of:           require('./lib/rules/string/one_of'),
    max_length:       require('./lib/rules/string/max_length'),
    min_length:       require('./lib/rules/string/min_length'),
    length_equal:     require('./lib/rules/string/length_equal'),
    length_between:   require('./lib/rules/string/length_between'),
    like:             require('./lib/rules/string/like'),

    integer:          require('./lib/rules/numeric/integer'),
    positive_integer: require('./lib/rules/numeric/positive_integer'),
    decimal:          require('./lib/rules/numeric/decimal'),
    positive_decimal: require('./lib/rules/numeric/positive_decimal'),
    max_number:       require('./lib/rules/numeric/max_number'),
    min_number:       require('./lib/rules/numeric/min_number'),
    number_between:   require('./lib/rules/numeric/number_between'),

    email:            require('./lib/rules/special/email'),
    equal_to_field:   require('./lib/rules/special/equal_to_field'),
    url:              require('./lib/rules/special/url'),
    iso_date:         require('./lib/rules/special/iso_date'),

    default:          require('./lib/rules/modifiers/default'),
    trim:             require('./lib/rules/modifiers/trim'),
    to_lc:            require('./lib/rules/modifiers/to_lc'),
    to_uc:            require('./lib/rules/modifiers/to_uc'),
    remove:           require('./lib/rules/modifiers/remove'),
    leave_only:       require('./lib/rules/modifiers/leave_only'),

    // We import here special version of async meta rules
    nested_object:    require('./lib/rules/meta-async/nested_object'),
    variable_object:  require('./lib/rules/meta-async/variable_object'),
    list_of:          require('./lib/rules/meta-async/list_of'),
    list_of_objects:  require('./lib/rules/meta-async/list_of_objects'),
    or:               require('./lib/rules/meta-async/or'),
    list_of_different_objects: require('./lib/rules/meta-async/list_of_different_objects')
};

AsyncValidator.registerDefaultRules(rules);

module.exports = { AsyncValidator, rules, util };
