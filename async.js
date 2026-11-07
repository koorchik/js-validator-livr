const AsyncValidator = require('./lib/AsyncValidator');
const util = require('./lib/util');

// The LIVR 2.5 rules are required on first use: a schema uses a few of them, and requiring all of
// them at startup costs milliseconds. A rule is a builder that requires its module, then replaces
// itself with it in `rules` and in the built-in rules. The require() calls stay literal, so that
// bundlers include the files
function lazyRule(name, load) {
  return function lazyRuleBuilder(...args) {
    const ruleBuilder = load();

    if (rules[name] === lazyRuleBuilder) {
      rules[name] = ruleBuilder;
      AsyncValidator._registerBuiltInRules({ [name]: ruleBuilder });
    }

    return ruleBuilder(...args);
  };
}

const rules = {
  required: require('./lib/rules/common/required'),
  not_empty: require('./lib/rules/common/not_empty'),
  not_empty_list: require('./lib/rules/common/not_empty_list'),
  any_object: require('./lib/rules/common/any_object'),

  string: require('./lib/rules/string/string'),
  eq: require('./lib/rules/string/eq'),
  one_of: require('./lib/rules/string/one_of'),
  max_length: require('./lib/rules/string/max_length'),
  min_length: require('./lib/rules/string/min_length'),
  length_equal: require('./lib/rules/string/length_equal'),
  length_between: require('./lib/rules/string/length_between'),
  like: require('./lib/rules/string/like'),

  integer: require('./lib/rules/numeric/integer'),
  positive_integer: require('./lib/rules/numeric/positive_integer'),
  decimal: require('./lib/rules/numeric/decimal'),
  positive_decimal: require('./lib/rules/numeric/positive_decimal'),
  max_number: require('./lib/rules/numeric/max_number'),
  min_number: require('./lib/rules/numeric/min_number'),
  number_between: require('./lib/rules/numeric/number_between'),

  email: require('./lib/rules/special/email'),
  equal_to_field: require('./lib/rules/special/equal_to_field'),
  url: require('./lib/rules/special/url'),
  iso_date: require('./lib/rules/special/iso_date'),

  default: require('./lib/rules/modifiers/default'),
  trim: require('./lib/rules/modifiers/trim'),
  to_lc: require('./lib/rules/modifiers/to_lc'),
  to_uc: require('./lib/rules/modifiers/to_uc'),
  remove: require('./lib/rules/modifiers/remove'),
  leave_only: require('./lib/rules/modifiers/leave_only'),

  // We import here special version of async meta rules
  nested_object: require('./lib/rules/meta-async/nested_object'),
  variable_object: require('./lib/rules/meta-async/variable_object'),
  list_of: require('./lib/rules/meta-async/list_of'),
  list_of_objects: require('./lib/rules/meta-async/list_of_objects'),
  or: require('./lib/rules/meta-async/or'),
  list_of_different_objects: require('./lib/rules/meta-async/list_of_different_objects'),
  // LIVR 2.5: scalar rules, loaded on first use
  boolean: lazyRule('boolean', () => require('./lib/rules/common/boolean')),
  required_if: lazyRule('required_if', () => require('./lib/rules/common/required_if')),
  not_one_of: lazyRule('not_one_of', () => require('./lib/rules/string/not_one_of')),
  digits: lazyRule('digits', () => require('./lib/rules/string/digits')),
  starts_with: lazyRule('starts_with', () => require('./lib/rules/string/starts_with')),
  ends_with: lazyRule('ends_with', () => require('./lib/rules/string/ends_with')),
  contains: lazyRule('contains', () => require('./lib/rules/string/contains')),
  max_decimals: lazyRule('max_decimals', () => require('./lib/rules/numeric/max_decimals')),
  iso_datetime: lazyRule('iso_datetime', () => require('./lib/rules/special/iso_datetime')),
  iso_time: lazyRule('iso_time', () => require('./lib/rules/special/iso_time')),
  list_length: lazyRule('list_length', () => require('./lib/rules/list/list_length')),
  unique: lazyRule('unique', () => require('./lib/rules/list/unique')),
  split: lazyRule('split', () => require('./lib/rules/modifiers/split')),
  // LIVR 2.5: format rules, loaded on first use
  uuid: lazyRule('uuid', () => require('./lib/rules/format/uuid')),
  ip: lazyRule('ip', () => require('./lib/rules/format/ip')),
  cidr: lazyRule('cidr', () => require('./lib/rules/format/cidr')),
  hostname: lazyRule('hostname', () => require('./lib/rules/format/hostname')),
  base64: lazyRule('base64', () => require('./lib/rules/format/base64')),
  hex: lazyRule('hex', () => require('./lib/rules/format/hex')),
  digest: lazyRule('digest', () => require('./lib/rules/format/digest')),
  mongo_id: lazyRule('mongo_id', () => require('./lib/rules/format/mongo_id')),
  hex_color: lazyRule('hex_color', () => require('./lib/rules/format/hex_color')),
  mac: lazyRule('mac', () => require('./lib/rules/format/mac')),
  e164: lazyRule('e164', () => require('./lib/rules/format/e164')),
  semver: lazyRule('semver', () => require('./lib/rules/format/semver')),
  jwt: lazyRule('jwt', () => require('./lib/rules/format/jwt')),
  luhn: lazyRule('luhn', () => require('./lib/rules/checksum/luhn')),
  credit_card: lazyRule('credit_card', () => require('./lib/rules/checksum/credit_card')),
  iban: lazyRule('iban', () => require('./lib/rules/checksum/iban')),
  // LIVR 2.5: meta rules, loaded on first use
  when: lazyRule('when', () => require('./lib/rules/meta-async/when')),
  values: lazyRule('values', () => require('./lib/rules/meta-async/values')),
  keys: lazyRule('keys', () => require('./lib/rules/meta-async/keys')),
  any: lazyRule('any', () => require('./lib/rules/common/any')),
};

AsyncValidator._registerBuiltInRules(rules);

module.exports = { AsyncValidator, rules, util };
