# Built-in rules

Every rule of the [LIVR specification](https://livr-spec.org/validation-rules.html) is built in. This page is a short list with the TypeScript type of every rule. The full reference, with the arguments, error codes and examples of every rule, is on the specification site:

<RulesCard wide />

Rule names below link to their pages in the specification. The last column shows the TypeScript type that [`InferFromSchema`](/typescript) gives a field with this rule.

Rule names work in `snake_case` and in `camelCase`: `min_length` and `minLength` are the same rule.

## Common rules

| Rule | Checks | Type |
| --- | --- | --- |
| [`required`](https://livr-spec.org/validation-rules/required.html) | The value is present: not missing, not `null` and not an empty string. `0` and `false` are valid | makes the field required |
| [`not_empty`](https://livr-spec.org/validation-rules/not_empty.html) | The value is not an empty string, if the field is passed at all | `string` |
| [`not_empty_list`](https://livr-spec.org/validation-rules/not_empty_list.html) | The value is a list with at least one element | `unknown[]` |
| [`any_object`](https://livr-spec.org/validation-rules/any_object.html) | The value is a plain object, its content is not validated | `Record<string, unknown>` |

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

## Special rules

| Rule | Checks | Type |
| --- | --- | --- |
| [`email`](https://livr-spec.org/validation-rules/email.html) | The value is an email address | `string` |
| [`url`](https://livr-spec.org/validation-rules/url.html) | The value is an `http` or `https` URL | `string` |
| [`iso_date`](https://livr-spec.org/validation-rules/iso_date.html) | The value is an ISO 8601 date without time, like `2014-08-14` | `string` |
| [`equal_to_field`](https://livr-spec.org/validation-rules/equal_to_field.html) | The value equals another field, like a password confirmation | `string` |

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

## Modifiers

Modifiers change the output and never return errors.

| Rule | Does | Type |
| --- | --- | --- |
| [`trim`](https://livr-spec.org/validation-rules/trim.html) | Removes leading and trailing whitespace | `string` |
| [`to_lc`](https://livr-spec.org/validation-rules/to_lc.html) | Converts to lower case | `string` |
| [`to_uc`](https://livr-spec.org/validation-rules/to_uc.html) | Converts to upper case | `string` |
| [`remove`](https://livr-spec.org/validation-rules/remove.html) | Removes the given characters | `string` |
| [`leave_only`](https://livr-spec.org/validation-rules/leave_only.html) | Removes all characters except the given ones | `string` |
| [`default`](https://livr-spec.org/validation-rules/default.html) | Sets a value when the value is empty | the type of the default, field becomes required |

## More rules

[livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules) adds `boolean`, `ipv4`, `uuid`, `credit_card`, `iso_date` with ranges, `required_if`, `list_length` and more. You can also [write your own](/guide/custom-rules).
