---
title: Performance
description: LIVR is the fastest JavaScript validator in the benchmarks, with a validator created once and with one created per call, and it generates no code.
---

# Performance

LIVR is the fastest of the popular JavaScript validators in both benchmarks: when a validator is created once and reused, and when a validator is created for every call. It gets there without generating code, so its schemas stay [plain data](/why/schemas-are-data) that is safe to load from anywhere.

> **Speed in both modes** is the priority → schemas are **compiled into closures once**, never into JavaScript source → no extra speed from code generation, and LIVR is still the fastest

<BenchmarkHighlights />

## Validator created once

The usual case: a schema in your code, one validator for the lifetime of the process.

<BenchmarkChart mode="static" />

## Validator created per call

A new validator for every validation: schemas loaded from a database, rules per tenant, form builders, or code that simply creates validators inline. Validators that generate code pay the price of generating and compiling it again for every schema.

<BenchmarkChart mode="dynamic" />

## All results

LIVR in operations per second, the others as how many times they are slower than LIVR:

<BenchmarkTable />

## How LIVR gets its speed

**The schema is compiled once.** On the first validation, or when you call `prepare()`, every rule of the schema is turned into a small function: the rule factory receives its arguments, does the expensive work once (`like` builds its regular expression, `one_of` converts the allowed values to strings, or to a map for long lists) and returns a closure that only checks a value. Validation is a loop over these closures. Nothing is parsed or looked up again.

**Creating a validator is cheap.** Building closures from a JSON structure costs far less than generating JavaScript source and compiling it with `new Function()`, which is what fastest-validator and Ajv do. That is why they are 100–130 and 780–950 times slower than LIVR when a validator is created per call.

**The hot path allocates little.** All rules share one output array, the errors object is created only when there are errors, and metarules like `list_of` and `or` validate their items through [`getFieldRule()`](/api#validatorgetfieldrulefieldname), without building result and errors objects for every item.

**The async validator stays sync until it has to.** `AsyncValidator` runs rules synchronously and waits only for a rule that returns a promise, so async validation of sync rules costs little more than sync validation.

## Fast enough for anything

3.5 million validations per second of a five-field form is about 300 billion validations a day on one CPU core. In a real service, the network, the database and the business logic take far longer than validation. So the point of the numbers is not that you need them, but that choosing data over code, and safety over code generation, costs nothing in speed.

## How the numbers were measured

The benchmark lives in its own repository, [validators-benchmarks](https://github.com/koorchik/validators-benchmarks), with the code of every scenario. The charts on this site are its latest published results.

- **Simple**: a form of five fields: required strings, an email, a positive integer, an enum and a minimum length
- **Nested**: an object with two levels of nested objects and a list of strings
- The schemas of all validators are equivalent: the benchmark checks that all of them accept and reject the same data, and unknown fields are removed from the output
- Every validation gets a new input object, because fastest-validator and Ajv change their input
- Every result is an average of repeated runs

Absolute numbers depend on the hardware, so compare the ratios. To check them on your machine:

```bash
git clone https://github.com/koorchik/validators-benchmarks
cd validators-benchmarks
npm install
npm run bench
```

## More

- [Design decision #3: Optimized for both dynamic and static validation](/why/design-decisions#design-decision-3-optimized-for-both-dynamic-and-static-validation)
- [Design decision #2: No code generation](/why/design-decisions#design-decision-2-no-code-generation-security)
