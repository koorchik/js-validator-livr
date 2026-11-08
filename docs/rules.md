---
description: 'The built-in rules of the LIVR specification with the TypeScript type of each rule.'
---

# Built-in rules

`livr` implements LIVR 2.0 and LIVR 2.5: every rule of the [LIVR specification](https://livr-spec.org/validation-rules.html) is built in. This page is a short list with the TypeScript type of every rule, in the groups of the specification. The full reference, with the arguments, error codes and examples of every rule, is on the specification site:

<RulesCard wide />

Rule names below link to their pages in the specification. The last column shows the TypeScript type that [`InferFromSchema`](./TYPESCRIPT.md) gives a field with this rule. Rules that check a value keep a more precise type of earlier rules: `[{ one_of: ['a', 'b'] }, { max_length: 1 }]` is `'a' | 'b'`, not `string`.

Rule names work in `snake_case` and in `camelCase`: `min_length` and `minLength` are the same rule.

Rules marked <sup>2.5</sup> were added in LIVR 2.5, see [below](#livr-25-rules) what they have in common.

## Common rules

| Rule | Checks | Type |
| --- | --- | --- |
| [`required`](https://livr-spec.org/validation-rules/required.html) | The value is present: not missing, not `null` and not an empty string. `0` and `false` are valid | the type of earlier rules, field becomes required |
| [`not_empty`](https://livr-spec.org/validation-rules/not_empty.html) | The value is not an empty string, if the field is passed at all | `string`, or the type of earlier rules |
| [`not_empty_list`](https://livr-spec.org/validation-rules/not_empty_list.html) | The value is a list with at least one element | `unknown[]`, or the list type of earlier rules, field becomes required |
| [`any_object`](https://livr-spec.org/validation-rules/any_object.html) | The value is a plain object, its content is not validated | `Record<string, unknown>` |
| [`required_if`](https://livr-spec.org/validation-rules/required_if.html)<sup>2.5</sup> | The field is required when other fields have the given values: `{ required_if: { type: 'company' } }` | the type of earlier rules |
| [`any`](https://livr-spec.org/validation-rules/any.html)<sup>2.5</sup> | Any value passes, unchanged: a rule for a field that is kept without checks | `unknown`, or the type of earlier rules |
| [`boolean`](https://livr-spec.org/validation-rules/boolean.html)<sup>2.5</sup> | `true`, `false`, `1`, `0`, `"1"`, `"0"`, `"true"` or `"false"`, returned as a boolean | `boolean` |

## String rules

| Rule | Checks | Type |
| --- | --- | --- |
| [`string`](https://livr-spec.org/validation-rules/string.html) | The value is a primitive, returned as a string | `string` |
| [`eq`](https://livr-spec.org/validation-rules/eq.html) | The value equals the given one | the literal |
| [`one_of`](https://livr-spec.org/validation-rules/one_of.html) | The value is one of the allowed values | a union of the literals |
| [`max_length`](https://livr-spec.org/validation-rules/max_length.html) | The string is not longer than the given length | `string` |
| [`min_length`](https://livr-spec.org/validation-rules/min_length.html) | The string is at least the given length | `string` |
| [`length_between`](https://livr-spec.org/validation-rules/length_between.html) | The length is between two values, inclusive | `string` |
| [`length_equal`](https://livr-spec.org/validation-rules/length_equal.html) | The string has exactly the given length | `string` |
| [`like`](https://livr-spec.org/validation-rules/like.html) | The value matches a regular expression | `string` |
| [`not_one_of`](https://livr-spec.org/validation-rules/not_one_of.html)<sup>2.5</sup> | The value is none of the given values | `string \| number \| boolean`, or the type of earlier rules |
| [`digits`](https://livr-spec.org/validation-rules/digits.html)<sup>2.5</sup> | The string has only the digits 0-9 | `string` |
| [`starts_with`](https://livr-spec.org/validation-rules/starts_with.html)<sup>2.5</sup>, [`ends_with`](https://livr-spec.org/validation-rules/ends_with.html)<sup>2.5</sup>, [`contains`](https://livr-spec.org/validation-rules/contains.html)<sup>2.5</sup> | The string starts with, ends with or contains one of the given strings | `string` |

## Numeric rules

Numeric rules accept strings that look like numbers, such as `'42'` from a form, and return numbers.

| Rule | Checks | Type |
| --- | --- | --- |
| [`integer`](https://livr-spec.org/validation-rules/integer.html) | The value is an integer | `number` |
| [`positive_integer`](https://livr-spec.org/validation-rules/positive_integer.html) | The value is an integer greater than zero | `number` |
| [`decimal`](https://livr-spec.org/validation-rules/decimal.html) | The value is a number, an integer or a decimal | `number` |
| [`positive_decimal`](https://livr-spec.org/validation-rules/positive_decimal.html) | The value is a number greater than zero | `number` |
| [`max_number`](https://livr-spec.org/validation-rules/max_number.html) | The number is not greater than the given value | `number` |
| [`min_number`](https://livr-spec.org/validation-rules/min_number.html) | The number is not less than the given value | `number` |
| [`number_between`](https://livr-spec.org/validation-rules/number_between.html) | The number is between two values, inclusive | `number` |
| [`max_decimals`](https://livr-spec.org/validation-rules/max_decimals.html)<sup>2.5</sup> | The number has at most the given count of decimal places | `number` |

## Special rules

| Rule | Checks | Type |
| --- | --- | --- |
| [`email`](https://livr-spec.org/validation-rules/email.html) | The value is an email address | `string` |
| [`url`](https://livr-spec.org/validation-rules/url.html) | The value is an `http` or `https` URL | `string` |
| [`iso_date`](https://livr-spec.org/validation-rules/iso_date.html) | The value is an ISO 8601 date without time, like `2014-08-14`. LIVR 2.5 adds bounds<sup>2.5</sup>: `{ iso_date: { min, max } }` with dates, `today`, `yesterday` or `tomorrow` (days in UTC). The 2.0 forms are unchanged | `string` |
| [`iso_datetime`](https://livr-spec.org/validation-rules/iso_datetime.html)<sup>2.5</sup> | An ISO 8601 date and time with an offset, returned as the instant in UTC, like `2026-01-02T01:04:05.000Z`. Also with `{ min, max }` | `string` |
| [`iso_time`](https://livr-spec.org/validation-rules/iso_time.html)<sup>2.5</sup> | A time `HH:MM`, `HH:MM:SS` or with a fraction, without an offset. Also with `{ min, max }`, a range over midnight when `min` is after `max` | `string` |
| [`equal_to_field`](https://livr-spec.org/validation-rules/equal_to_field.html) | The value equals another field, like a password confirmation | `string`, or the type of earlier rules |

## Metarules

Metarules describe nested data with other rules.

| Rule | Describes | Type |
| --- | --- | --- |
| [`nested_object`](https://livr-spec.org/validation-rules/nested_object.html) | A nested object | the object type |
| [`variable_object`](https://livr-spec.org/validation-rules/variable_object.html) | An object whose rules depend on a selector field | a union of the object types |
| [`list_of`](https://livr-spec.org/validation-rules/list_of.html) | A list, the rules apply to every element | an array |
| [`list_of_objects`](https://livr-spec.org/validation-rules/list_of_objects.html) | A list of objects | an array of the object type |
| [`list_of_different_objects`](https://livr-spec.org/validation-rules/list_of_different_objects.html) | A list of objects whose rules depend on a selector field | an array of the union |
| [`or`](https://livr-spec.org/validation-rules/or.html) | Alternatives: the first set of rules that succeeds wins | a union |
| [`when`](https://livr-spec.org/validation-rules/when.html)<sup>2.5</sup> | Rules that depend on another field: `{ when: ['type', { eq: 'company' }, 'required'] }`, with rules for the other case, or cases by value | a union of the types of the branches |
| [`values`](https://livr-spec.org/validation-rules/values.html)<sup>2.5</sup> | An object, the rules apply to every value: `{ values: 'integer' }` | `Record<string, T>` |
| [`keys`](https://livr-spec.org/validation-rules/keys.html)<sup>2.5</sup> | An object, the rules check every key: `{ keys: { one_of: ['en', 'uk'] } }` | the object type of earlier rules |

## List rules

All list rules were added in LIVR 2.5.

| Rule | Checks | Type |
| --- | --- | --- |
| [`list_length`](https://livr-spec.org/validation-rules/list_length.html) | The list has the given length, or a length between `min` and `max` | the list type of earlier rules |
| [`unique`](https://livr-spec.org/validation-rules/unique.html) | The items of the list are unique, or the values of the given keys of its objects | the list type of earlier rules |

## Format rules

All format rules were added in LIVR 2.5.

| Rule | Checks | Type |
| --- | --- | --- |
| [`uuid`](https://livr-spec.org/validation-rules/uuid.html) | A UUID (RFC 9562), of the given versions `'v1'`-`'v8'` | `string` |
| [`ip`](https://livr-spec.org/validation-rules/ip.html), [`cidr`](https://livr-spec.org/validation-rules/cidr.html) | An IPv4 or IPv6 address, or a network in CIDR notation, `'v4'` or `'v6'` only | `string` |
| [`hostname`](https://livr-spec.org/validation-rules/hostname.html) | A DNS host name | `string` |
| [`base64`](https://livr-spec.org/validation-rules/base64.html) | Base64, `'url'` for the URL-safe alphabet | `string` |
| [`hex`](https://livr-spec.org/validation-rules/hex.html), [`digest`](https://livr-spec.org/validation-rules/digest.html) | Hex digits, or a hex digest of `md5`, `sha1`, `sha256`, `sha384` or `sha512` | `string` |
| [`mongo_id`](https://livr-spec.org/validation-rules/mongo_id.html) | A MongoDB ObjectId, 24 hex digits | `string` |
| [`hex_color`](https://livr-spec.org/validation-rules/hex_color.html) | A CSS hex color, like `#fff` or `#ffffff80` | `string` |
| [`mac`](https://livr-spec.org/validation-rules/mac.html) | A MAC address, 48 bits or with `64` an EUI-64 | `string` |
| [`e164`](https://livr-spec.org/validation-rules/e164.html) | A phone number in the E.164 format, like `+380441234567` | `string` |
| [`semver`](https://livr-spec.org/validation-rules/semver.html) | A semantic version, like `1.2.3-beta.1` | `string` |
| [`jwt`](https://livr-spec.org/validation-rules/jwt.html) | A JSON Web Token in the compact form. The signature is not checked | `string` |

## Checksum rules

All checksum rules were added in LIVR 2.5. They check the value as it is: remove spaces and dashes before them, with `remove`.

| Rule | Checks | Type |
| --- | --- | --- |
| [`luhn`](https://livr-spec.org/validation-rules/luhn.html) | At least 2 digits with a valid Luhn checksum | `string` |
| [`credit_card`](https://livr-spec.org/validation-rules/credit_card.html) | A payment card number: 12-19 digits with a valid Luhn checksum | `string` |
| [`iban`](https://livr-spec.org/validation-rules/iban.html) | An IBAN with valid check digits | `string` |

## Modifiers

Modifiers change the output and never return errors.

| Rule | Does | Type |
| --- | --- | --- |
| [`trim`](https://livr-spec.org/validation-rules/trim.html) | Removes leading and trailing whitespace | `string` |
| [`to_lc`](https://livr-spec.org/validation-rules/to_lc.html) | Converts to lower case | `string`, literal types in lower case |
| [`to_uc`](https://livr-spec.org/validation-rules/to_uc.html) | Converts to upper case | `string`, literal types in upper case |
| [`remove`](https://livr-spec.org/validation-rules/remove.html) | Removes the given characters | `string` |
| [`leave_only`](https://livr-spec.org/validation-rules/leave_only.html) | Removes all characters except the given ones | `string` |
| [`default`](https://livr-spec.org/validation-rules/default.html) | Sets a value when the value is empty | the type of the default, field becomes required |
| [`split`](https://livr-spec.org/validation-rules/split.html)<sup>2.5</sup> | Splits a string at the separator into a list of strings | `string[]` |

<a id="livr-25-rules"></a>
<a id="livr-25-draft-rules"></a>

## About the LIVR 2.5 rules

LIVR 2.5 added the rules marked <sup>2.5</sup>, the list, format and checksum rules, and bounds for `iso_date`, see the [LIVR 2.5 specification](https://github.com/koorchik/LIVR/blob/master/drafts/v2.5.md). It only adds rules: every LIVR 2.0 schema gives the same result. Implementations of LIVR 2.0 in other languages do not have these rules.

The rules are loaded on first use, so a schema without them costs nothing. A rule you register under one of these names replaces the built-in one, so schemas with `boolean`, `uuid` or `required_if` of livr-extra-rules keep working while the package is registered.

Like the LIVR 2.0 rules, they skip a missing value, `null` and an empty string, so they work with `required`; only `required_if` checks them. A rule without arguments rejects any argument, `{ boolean: null }` included, and an unknown option is a schema error: a schema says what it checks.

## More rules

[livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules) adds more rules, like `ipv4` and `md5`; most of its other rules are built in now, as LIVR 2.5 rules. You can also [write your own](./guide/custom-rules.md).
