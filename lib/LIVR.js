const Validator = require('./Validator');
const util = require('./util');

// The LIVR 2.5 rules are required on first use: a schema uses a few of them, and requiring all of
// them at startup costs milliseconds. A rule is a builder that requires its module, then replaces
// itself with it in `rules` and in the built-in rules. The require() calls stay literal, so that
// bundlers include the files
function lazyRule(name, load) {
  return function lazyRuleBuilder(...args) {
    const ruleBuilder = load();

    if (rules[name] === lazyRuleBuilder) {
      rules[name] = ruleBuilder;
      Validator._registerBuiltInRules({ [name]: ruleBuilder });
    }

    return ruleBuilder(...args);
  };
}

const rules = {
  required: require('./rules/common/required'),
  not_empty: require('./rules/common/not_empty'),
  not_empty_list: require('./rules/common/not_empty_list'),
  any_object: require('./rules/common/any_object'),

  string: require('./rules/string/string'),
  eq: require('./rules/string/eq'),
  one_of: require('./rules/string/one_of'),
  max_length: require('./rules/string/max_length'),
  min_length: require('./rules/string/min_length'),
  length_equal: require('./rules/string/length_equal'),
  length_between: require('./rules/string/length_between'),
  like: require('./rules/string/like'),

  integer: require('./rules/numeric/integer'),
  positive_integer: require('./rules/numeric/positive_integer'),
  decimal: require('./rules/numeric/decimal'),
  positive_decimal: require('./rules/numeric/positive_decimal'),
  max_number: require('./rules/numeric/max_number'),
  min_number: require('./rules/numeric/min_number'),
  number_between: require('./rules/numeric/number_between'),

  email: require('./rules/special/email'),
  equal_to_field: require('./rules/special/equal_to_field'),
  url: require('./rules/special/url'),
  iso_date: require('./rules/special/iso_date'),

  default: require('./rules/modifiers/default'),
  trim: require('./rules/modifiers/trim'),
  to_lc: require('./rules/modifiers/to_lc'),
  to_uc: require('./rules/modifiers/to_uc'),
  remove: require('./rules/modifiers/remove'),
  leave_only: require('./rules/modifiers/leave_only'),

  nested_object: require('./rules/meta/nested_object'),
  variable_object: require('./rules/meta/variable_object'),
  list_of: require('./rules/meta/list_of'),
  list_of_objects: require('./rules/meta/list_of_objects'),
  or: require('./rules/meta/or'),
  list_of_different_objects: require('./rules/meta/list_of_different_objects'),
  // LIVR 2.5: scalar rules, loaded on first use
  boolean: lazyRule('boolean', () => require('./rules/common/boolean')),
  required_if: lazyRule('required_if', () => require('./rules/common/required_if')),
  not_one_of: lazyRule('not_one_of', () => require('./rules/string/not_one_of')),
  digits: lazyRule('digits', () => require('./rules/string/digits')),
  starts_with: lazyRule('starts_with', () => require('./rules/string/starts_with')),
  ends_with: lazyRule('ends_with', () => require('./rules/string/ends_with')),
  contains: lazyRule('contains', () => require('./rules/string/contains')),
  max_decimals: lazyRule('max_decimals', () => require('./rules/numeric/max_decimals')),
  iso_datetime: lazyRule('iso_datetime', () => require('./rules/special/iso_datetime')),
  iso_time: lazyRule('iso_time', () => require('./rules/special/iso_time')),
  list_length: lazyRule('list_length', () => require('./rules/list/list_length')),
  unique: lazyRule('unique', () => require('./rules/list/unique')),
  split: lazyRule('split', () => require('./rules/modifiers/split')),
  // LIVR 2.5: format rules, loaded on first use
  uuid: lazyRule('uuid', () => require('./rules/format/uuid')),
  ip: lazyRule('ip', () => require('./rules/format/ip')),
  cidr: lazyRule('cidr', () => require('./rules/format/cidr')),
  hostname: lazyRule('hostname', () => require('./rules/format/hostname')),
  base64: lazyRule('base64', () => require('./rules/format/base64')),
  hex: lazyRule('hex', () => require('./rules/format/hex')),
  digest: lazyRule('digest', () => require('./rules/format/digest')),
  mongo_id: lazyRule('mongo_id', () => require('./rules/format/mongo_id')),
  hex_color: lazyRule('hex_color', () => require('./rules/format/hex_color')),
  mac: lazyRule('mac', () => require('./rules/format/mac')),
  e164: lazyRule('e164', () => require('./rules/format/e164')),
  semver: lazyRule('semver', () => require('./rules/format/semver')),
  jwt: lazyRule('jwt', () => require('./rules/format/jwt')),
  luhn: lazyRule('luhn', () => require('./rules/checksum/luhn')),
  credit_card: lazyRule('credit_card', () => require('./rules/checksum/credit_card')),
  iban: lazyRule('iban', () => require('./rules/checksum/iban')),
  // LIVR 2.5: meta rules, loaded on first use
  when: lazyRule('when', () => require('./rules/meta/when')),
  values: lazyRule('values', () => require('./rules/meta/values')),
  keys: lazyRule('keys', () => require('./rules/meta/keys')),
  any: lazyRule('any', () => require('./rules/common/any')),
};

Validator._registerBuiltInRules(rules);

module.exports = { Validator, rules, util };
