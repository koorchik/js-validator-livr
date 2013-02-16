var LIVR = {rules: {}};

LIVR.rules.common  = require('./LIVR/Rules/Common');
LIVR.rules.string  = require('./LIVR/Rules/String');
LIVR.rules.numeric = require('./LIVR/Rules/Numeric');
LIVR.rules.special = require('./LIVR/Rules/Special');
LIVR.rules.helper  = require('./LIVR/Rules/Helper');

LIVR.Validator = require('./LIVR/Validator');

LIVR.Validator.register_default_rules({
    required:         LIVR.rules.common.required,
    not_empty:        LIVR.rules.common.not_empty,

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

    nested_object:    LIVR.rules.helper.nested_object,
    list_of:          LIVR.rules.helper.list_of,
    list_of_objects:  LIVR.rules.helper.list_of_objects,
    list_of_different_objects: LIVR.rules.helper.list_of_different_objects
});

module.exports = LIVR;
