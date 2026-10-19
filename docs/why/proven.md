---
title: Proven by 13 years and a spec
description: Maintained since 2013, built on the cross-language LIVR specification and its shared test suite, which collects edge cases found in every implementation.
---

# Proven by 13 years and a spec

A validator is a dependency you keep for years: your schemas, error codes and UI translations depend on it. LIVR has been around since 2013, and its behavior is not defined by this code alone, but by a written specification and a test suite shared by implementations in 11 languages.

> **Predictable, cross-language behavior** is the priority → a **formal specification with a shared JSON test suite** → the specification has to be maintained, and a new rule needs agreement before it lands

## 13 years

| Year | |
| --- | --- |
| 2012 | Work on the [LIVR specification](https://livr-spec.org) starts |
| 2013 | The JavaScript implementation starts in February, first npm release in December |
| 2016 | Specification 2.0 and `livr` 2.0.0, on the same day. Version 2 is still the current one |
| 2023 | 2.7: camelCase rule names, faster validation, 3–5× faster validator construction |
| 2025 | 2.8 and 2.9: TypeScript declarations, then type inference from the schema |
| 2026 | 2.11: fixes found by new test suite cases, and the fastest results in the [benchmarks](/why/performance) |

43 releases on npm, all of version 2 since 2016: a schema written for `livr` 2.0 still works with the latest release.

## One specification

The [specification](https://livr-spec.org) describes every rule: its arguments, what it accepts, what it returns and which error code it gives. Because a LIVR schema is [data](/why/schemas-are-data), the specification can be language independent, and the same schema means the same thing in every implementation: JavaScript (this library), Perl, PHP, Python, Go, Java, Ruby, Erlang (two implementations), Lua, Raku and Swift. The [implementations page](https://livr-spec.org/introduction/implementations.html) links to all of them. A browser form validated by this library and a backend in Python or Go return the same error codes for the same data.

## One test suite, edge cases from every language

The specification comes with a [test suite](https://livr-spec.org/how-to-contribute/test-suite.html) of JSON files: a schema, an input, and the expected output or errors. Implementations run these files in their own tests, and this library runs them for both the sync and the async validator.

When an edge case is found in any implementation, it is added to the suite, so every other implementation gets checked against it too. Examples from the history of the suite:

- **Fields named `constructor`, `toString` or `hasOwnProperty`.** In JavaScript, data objects inherit these names from `Object.prototype`, which caught bugs in this library. Now every implementation is tested with them.
- **A trailing line break.** In Perl, PHP, Python and Ruby, `$` in a regular expression also matches before a final line break, so `"user@example.com\n"` could pass `email`. The suite now checks `email`, `url` and `iso_date` for it.
- **Leap years and impossible dates** in `iso_date`, `"0.0"` in `positive_decimal`, numeric strings like `"10"` and `"1e1"` in `equal_to_field`, the output type of `one_of`, and empty values in `or` and aliases.

Fixing a bug in one language makes all of them better. A new implementation starts with 13 years of found edge cases on day one.

## Checked in public

The specification site runs every implementation against the test suite every week and publishes the results in its [conformance table](https://livr-spec.org/introduction/implementations.html). The current version of this library passes all 70 test cases.

## More

- [Design decision #5: Formal specification with shared test suite](/why/design-decisions#design-decision-5-formal-specification-with-shared-test-suite)
- [The LIVR specification](https://livr-spec.org)
- [Changelog](/changelog)
