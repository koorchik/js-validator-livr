# LIVR: Design Decisions

This document examines LIVR's design decisions, compares them to alternatives in other validators, and explains why each choice matters. Every design decision follows a simple formula:

> **Quality X** is a priority → We choose **design Y** → Accepting **trade-off Z**

---

## Quick Start

```typescript
import LIVR, { InferFromSchema } from 'livr';

const schema = {
    email: ['required', 'email'],
    age: ['required', 'positiveInteger'],
    role: { oneOf: ['admin', 'user'] },
} as const;

type User = InferFromSchema<typeof schema>;
// Inferred: { email: string; age: number; role: 'admin' | 'user' }

const validator = new LIVR.Validator<User>(schema);

const result = validator.validate({
    email: 'user@example.com',
    age: '25', // String from form → automatically becomes number
    role: 'admin',
    hackAttempt: true, // Unknown field → automatically stripped
});

if (result) {
    console.log(result.role); // TypeScript knows: 'admin' | 'user'
}
// result: { email: 'user@example.com', age: 25, role: 'admin' }
```

**What just happened?**

-   Type inference from schema via `InferFromSchema<>`
-   String `'25'` automatically coerced to number `25`
-   Unknown `hackAttempt` field automatically stripped
-   Result is fully typed as `User`

> **Note**: Examples use JavaScript's camelCase naming convention (`positiveInteger`, `oneOf`). The [LIVR specification](https://livr-spec.org) uses underscore notation (`positive_integer`, `one_of`). The JavaScript implementation supports both.

---

## Cool Things You Can Do

### Store Validation Rules in a Database

```javascript
// Schema is just JSON - store it anywhere
const schema = JSON.parse(await db.getSchema('user-registration'));
const validator = new LIVR.Validator(schema);
```

### Share Rules Across Languages

The same schema works in JavaScript, Python, Java, Ruby, and 6 more languages:

```json
{ "email": ["required", "email"], "age": ["positiveInteger"] }
```

```python
# Python
validator = LIVR.Validator(schema)
```

```javascript
// JavaScript
const validator = new LIVR.Validator(schema);
```

### Create Domain-Specific Rules

```javascript
validator.registerAliasedRule({
    name: 'productSku',
    rules: ['required', { like: '^[A-Z]{3}-\\d{6}$' }],
    error: 'INVALID_PRODUCT_SKU', // Semantic error code
});

// Now use it like a built-in rule
const schema = { sku: 'productSku' };
```

### Validate with Async Rules

```javascript
LIVR.Validator.registerDefaultRules({
    uniqueEmail: () => async (email) => {
        const exists = await db.users.findByEmail(email);
        if (exists) return 'EMAIL_ALREADY_TAKEN';
    },
});
```

### Validate Arrays

```javascript
const schema = {
    tags: { listOf: 'string' },
    items: {
        listOf: {
            nestedObject: {
                id: ['required', 'positiveInteger'],
                name: 'string',
            },
        },
    },
};

// Input: { tags: ["js", "node"], items: [{ id: 1, name: "Item" }] }
```

### Safe with User-Provided Schemas

```javascript
// LIVR schemas are data, not code - safe to load from untrusted sources
const schema = JSON.parse(req.body.schema);
const validator = new LIVR.Validator(schema); // No code execution risk
```

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Cool Things You Can Do](#cool-things-you-can-do)
3. [Feature Comparison Matrix](#feature-comparison-matrix)
4. [Design Decisions](#design-decisions)
    - [#1: Schemas as Data vs Schemas as Code](#design-decision-1-schemas-as-data-vs-schemas-as-code)
    - [#2: No Code Generation (Security)](#design-decision-2-no-code-generation-security)
    - [#3: Error Codes with Mirrored Structure](#design-decision-3-error-codes-with-mirrored-structure)
    - [#4: Rules Aliasing with Custom Error Codes](#design-decision-4-rules-aliasing-with-custom-error-codes)
    - [#5: Optimized for Both Dynamic AND Static Validation](#design-decision-5-optimized-for-both-dynamic-and-static-validation)
    - [#6: Rules as Transformers](#design-decision-6-rules-as-transformers-not-just-validators)
    - [#7: "Everything is a Rule" Architecture](#design-decision-7-everything-is-a-rule-architecture)
    - [#8: Input Immutability](#design-decision-8-input-immutability)
    - [#9: Unknown Fields Stripped by Default](#design-decision-9-unknown-fields-stripped-by-default)
    - [#10: Formal Specification with Shared Test Suite](#design-decision-10-formal-specification-with-shared-test-suite)
    - [#11: Zero Dependencies](#design-decision-11-zero-dependencies)
5. [TypeScript Integration](#typescript-integration)
6. [Performance Summary](#performance-summary)

---

## Feature Comparison Matrix

Before diving into design decisions, here's a comprehensive comparison of LIVR against popular alternatives:

| Feature                         | LIVR                       | Zod               | Joi            | fastest-validator | Valibot            |
| ------------------------------- | -------------------------- | ----------------- | -------------- | ----------------- | ------------------ |
| **TypeScript Inference**        | ✅ `InferFromSchema<>`     | ✅ `z.infer<>`    | ❌ No          | ❌ No             | ✅ `InferOutput<>` |
| **Async Validation**            | ✅ AsyncValidator          | ⚠️ Via parseAsync | ✅ Yes         | ✅ Yes            | ⚠️ Via pipeAsync   |
| **Custom Rules**                | ✅ Very Easy               | ✅ `.refine()`    | ✅ `.custom()` | ✅ Yes            | ✅ `v.custom()`    |
| **Rules Aliasing**              | ✅ `registerAliasedRule()` | ❌ No             | ❌ No          | ⚠️ Partial        | ❌ No              |
| **Schema Serializable**         | ✅ Pure JSON               | ❌ Code           | ❌ Code        | ⚠️ Partial        | ❌ Code            |
| **Multi-Language Support**      | ✅ 10+ languages           | ❌ JS/TS only     | ❌ JS only     | ❌ JS only        | ❌ JS/TS only      |
| **Error Format**                | Codes (i18n-ready)         | Messages          | Messages       | Messages          | Messages           |
| **Error Structure**             | Mirrors input              | Flat array        | Flat array     | Flat array        | Flat array         |
| **Type Coercion**               | ✅ Automatic               | Manual            | ✅ Via options | ✅ Yes            | Manual             |
| **Unknown Fields**              | Strip (default)            | Strip (default)   | Pass through   | Pass through      | Strip (default)    |
| **Input Immutability**          | ✅ Always                  | ✅ Always         | ✅ Always      | ⚠️ Mutates        | ✅ Always          |
| **Bundle Size (gzip)**          | 4.5 KB                     | 14 KB             | 55 KB          | 12.4 KB           | 1.8 KB             |
| **Zero Dependencies**           | ✅ Yes                     | ✅ Yes            | ❌ No          | ✅ Yes            | ✅ Yes             |
| **Safe with Untrusted Schemas** | ✅ Yes                     | N/A               | N/A            | ❌ RCE risk       | N/A                |

---

## Design Decisions

### Design Decision #1: Schemas as Data vs Schemas as Code

> **Portability & Composability** is a priority →
> We choose **pure JSON data structures** for schemas →
> Accepting **no fluent API or method chaining**

#### Comparison

| Validator         | Approach         | Serializable | Embeddable in Config | Multi-Language |
| ----------------- | ---------------- | ------------ | -------------------- | -------------- |
| **LIVR**          | JSON data        | ✅ Yes       | ✅ Yes               | ✅ Yes         |
| Zod               | Function chains  | ❌ No        | ❌ No                | ❌ No          |
| Valibot           | Pipe composition | ❌ No        | ❌ No                | ❌ No          |
| Joi               | Fluent builder   | ❌ No        | ❌ No                | ❌ No          |
| fastest-validator | Object literals  | ⚠️ Partial   | ⚠️ Partial           | ❌ No          |

#### Example

**LIVR** - Schema is pure data:

```javascript
// Can be stored in DB, sent over API, loaded from config file
const schema = {
    username: ['required', { minLength: 3 }, { maxLength: 50 }],
    email: ['required', 'email'],
    role: { oneOf: ['admin', 'user', 'guest'] },
};

// Store in database
await db.saveSchema('user-registration', JSON.stringify(schema));

// Load and validate
const loadedSchema = JSON.parse(await db.getSchema('user-registration'));
const validator = new LIVR.Validator(loadedSchema);
```

**Zod** - Schema is code:

```typescript
// Cannot serialize - this is JavaScript code, not data
const schema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    role: z.enum(['admin', 'user', 'guest']),
});

// Cannot store in database
// Cannot send over API
// Cannot share with Python/Java services
```

#### Why This Matters: Embedding in Larger Configurations

Because LIVR schemas are data, they can be embedded within larger configuration systems:

**Form Builder** - Single JSON payload with UI + validation:

```json
{
    "formId": "contact-form",
    "fields": [
        {
            "name": "email",
            "type": "text",
            "label": "Email Address",
            "placeholder": "you@example.com",
            "validation": ["required", "email"]
        },
        {
            "name": "age",
            "type": "number",
            "label": "Age",
            "validation": ["positiveInteger", { "numberBetween": [18, 120] }]
        }
    ]
}
```

**API Gateway Config** - Route definition with validation:

```json
{
    "route": "/api/users",
    "method": "POST",
    "auth": "jwt",
    "rateLimit": { "requests": 100, "window": "1m" },
    "validation": {
        "body": {
            "email": ["required", "email"],
            "password": ["required", { "minLength": 8 }]
        }
    }
}
```

**CMS Content Type** - Field definitions with validation:

```json
{
    "contentType": "BlogPost",
    "fields": {
        "title": {
            "type": "string",
            "required": true,
            "validation": ["required", { "maxLength": 200 }]
        },
        "slug": {
            "type": "string",
            "validation": ["required", { "like": "^[a-z0-9-]+$" }]
        }
    }
}
```

This is impossible with code-based validators—you cannot embed JavaScript class instances in JSON configurations.

#### Advanced Use Cases

**Database-Driven Validation:**

```javascript
// Database table: validation_schemas
// | entity_type | schema                                    | version |
// |-------------|-------------------------------------------|------------|
// | user        | {"name": ["required"], "email": "email"}  | 3       |
// | product     | {"sku": "productSku", "price": "..."}    | 5       |

async function validateEntity(entityType, data) {
    const { schema } = await db.query(
        'SELECT schema FROM validation_schemas WHERE entity_type = ?',
        [entityType]
    );
    const validator = new LIVR.Validator(JSON.parse(schema));
    return validator.validate(data);
}
```

**Multi-Tenant SaaS Validation:**

```javascript
// Each tenant has customized validation requirements
const tenantSchemas = {
    'tenant-acme': {
        order: {
            amount: ['required', { maxNumber: 10000 }], // Conservative limit
            approver: 'required', // Requires approval
        },
    },
    'tenant-bigcorp': {
        order: {
            amount: ['required', { maxNumber: 1000000 }], // Higher limit
            // No approver required
        },
    },
};

function validateForTenant(tenantId, entityType, data) {
    const schema = tenantSchemas[tenantId]?.[entityType];
    if (!schema) throw new Error('Unknown entity type');
    return new LIVR.Validator(schema).validate(data);
}
```

**Safe Schema Loading:**

LIVR schemas are just data—safe to load from untrusted sources:

```javascript
// SAFE: Loading LIVR schema from user input
const userSchema = JSON.parse(req.body.schema);
const validator = new LIVR.Validator(userSchema); // Just data, no code execution

// DANGEROUS: fastest-validator with untrusted schema (real RCE vulnerability)
const Validator = require('fastest-validator');
const v = new Validator();
const check = v.compile(req.body.schema); // RCE if schema contains malicious code!

// Also dangerous: Using eval with any schema (obvious security risk)
// const zodSchema = eval(req.body.schema);  // Never eval untrusted input!
```

LIVR schemas cannot contain executable code. The worst a malicious schema can do is define invalid rules (which LIVR will reject) or create overly complex validations.

---

### Design Decision #2: No Code Generation (Security)

> **Security** is a priority →
> We choose **rule parameters as data, never executed** →
> Accepting **slightly lower static validation speed vs code-gen approaches**

#### Comparison

| Validator         | Approach            | Code Injection Risk      | Safe with Untrusted Schemas |
| ----------------- | ------------------- | ------------------------ | --------------------------- |
| **LIVR**          | Data interpretation | ❌ Impossible            | ✅ Yes                      |
| fastest-validator | Code generation     | ⚠️ RCE vulnerability     | ❌ No                       |
| Zod               | Runtime evaluation  | ❌ No (not serializable) | N/A                         |
| Joi               | Runtime evaluation  | ❌ No (not serializable) | N/A                         |

#### The fastest-validator RCE Vulnerability

fastest-validator achieves high static performance by compiling schemas to JavaScript code. This creates a dangerous attack vector when schema parameters aren't properly sanitized.

**Real vulnerability** ([GitHub Issue #326](https://github.com/icebob/fastest-validator/issues/326)):

```javascript
const Validator = require('fastest-validator');
const v = new Validator();

// Attacker controls schema (e.g., from database, API, user input)
const maliciousSchema = {
    id: {
        type: 'number',
        max: 'console.log(process.env) || 999', // Injected code!
    },
};

const check = v.compile(maliciousSchema);
check({ id: 123 }); // Executes: console.log(process.env) - RCE!
```

#### Why LIVR is Immune

LIVR treats schema parameters as data, never as code:

```javascript
const LIVR = require('livr');

// Even with malicious input, no code execution
const schema = {
    id: ['required', { maxNumber: 'console.log(process.env)' }],
};

const validator = new LIVR.Validator(schema);
validator.validate({ id: 123 });
// Result: Validation error (not a valid number parameter)
// No code execution - the string is treated as a malformed number
```

#### When This Matters

-   **Multi-tenant SaaS**: Different customers define their own validation rules
-   **No-code platforms**: Users build forms with custom validation
-   **Database-stored schemas**: Schemas loaded from potentially compromised sources
-   **API-driven validation**: Schemas received from external services

---

### Design Decision #3: Error Codes with Mirrored Structure

> **i18n & Domain clarity** is a priority →
> We choose **error codes in a structure mirroring input** →
> Accepting **less verbose error details (no rule names, expected values, etc.)**

#### Comparison

| Validator         | Error Format          | Structure     | Focus          | i18n Approach                   |
| ----------------- | --------------------- | ------------- | -------------- | ------------------------------- |
| **LIVR**          | Codes (`WRONG_EMAIL`) | Mirrors input | Domain meaning | Codes (separate translation)    |
| Zod               | Messages + metadata   | Flat array    | Implementation | Messages (40+ built-in locales) |
| Joi               | Messages + context    | Flat array    | Implementation | Messages (manual setup)         |
| Valibot           | Issues array          | Flat array    | Implementation | Messages (i18n package)         |
| fastest-validator | Messages              | Flat array    | Implementation | Messages (manual setup)         |

**Why LIVR's approach is different**: All validators offer some form of message customization, but LIVR is the only one that returns **error codes** instead of messages. This creates a clean separation of concerns:

-   **LIVR**: Validator returns codes (`WRONG_EMAIL`) → UI layer translates to localized messages
-   **Others**: Translation logic is baked into the validator via message customization

With LIVR, you maintain a single translation table mapping codes to messages. Other validators require configuring translations within the validation layer itself. For example:

-   **Valibot**: The [@valibot/i18n](https://valibot.dev/guides/internationalization/) package provides translations, but you're translating rule-specific messages—you cannot define custom domain error codes
-   **Zod**: [Error customization](https://zod.dev/error-customization) allows custom messages and has 40+ built-in locales, but LIVR's aliasing approach (`registerAliasedRule` with custom error codes) is more powerful for domain-driven validation

#### Example

**Input:**

```javascript
const input = {
    user: {
        email: 'not-an-email',
        profile: {
            age: 'not-a-number',
        },
    },
};
```

**LIVR errors** - Mirrors input structure:

```javascript
{
  user: {
    email: 'WRONG_EMAIL',
    profile: {
      age: 'NOT_INTEGER'
    }
  }
}
```

**Other validators** - Flat array with paths:

```javascript
[
    {
        path: ['user', 'email'],
        message: 'Invalid email format',
        code: 'invalid_string',
    },
    {
        path: ['user', 'profile', 'age'],
        message: 'Expected number, received string',
        code: 'invalid_type',
    },
];
```

#### Why Mirrored Structure Matters

**Easy field mapping**: Error structure matches input structure exactly. Display errors next to fields trivially:

```javascript
// LIVR - direct property access
const emailError = errors.user?.email; // 'WRONG_EMAIL'
const ageError = errors.user?.profile?.age; // 'NOT_INTEGER'

// Others - must search array
const emailError = errors.find((e) => e.path.join('.') === 'user.email')?.message;
```

#### Domain-Focused vs Implementation-Focused

LIVR tells you **WHAT** is wrong (domain meaning):

```
WRONG_EMAIL       - The email is invalid
TOO_SHORT         - The value is too short
INVALID_PRODUCT_SKU - The SKU doesn't match our format
```

Others tell you **WHICH rule** failed (implementation detail):

```
"Invalid email format"
"String must contain at least 8 character(s)"
"Invalid input: expected string to match pattern /^[A-Z]{3}-\d{6}$/"
```

#### i18n Benefits

Error codes map cleanly to translations:

```javascript
// translations/en.json
{
  "WRONG_EMAIL": "Please enter a valid email address",
  "TOO_SHORT": "Must be at least {min} characters",
  "INVALID_PRODUCT_SKU": "SKU format: ABC-123456"
}

// translations/es.json
{
  "WRONG_EMAIL": "Por favor ingrese un correo electrónico válido",
  "TOO_SHORT": "Debe tener al menos {min} caracteres",
  "INVALID_PRODUCT_SKU": "Formato SKU: ABC-123456"
}
```

With message-based validators, translations are scattered across validator configurations or require complex message extraction.

#### Clean Separation of Concerns

Validation logic belongs in the business layer. Message formatting belongs in the presentation layer. LIVR enforces this separation:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Validation    │───▶│   Error Codes    │───▶│  Presentation   │
│     Layer       │    │  (WRONG_EMAIL)   │    │    Layer        │
│   (LIVR)        │    │                  │    │  (Messages)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

Benefits:

-   **Backend doesn't dictate UI text**: Same API serves web, mobile, and third-party clients
-   **Messages can change without code changes**: Update translation files, not validators
-   **Different clients, different messages**: Mobile app might show shorter messages than web

---

### Design Decision #4: Rules Aliasing with Custom Error Codes

> **Domain-driven validation** is a priority →
> We choose **rule aliasing with custom error code override** →
> Accepting **indirection (alias → underlying rules)**

#### Comparison

| Validator         | Rule Aliasing           | Custom Error Codes   | Domain Vocabularies |
| ----------------- | ----------------------- | -------------------- | ------------------- |
| **LIVR**          | `registerAliasedRule()` | Via `error` property | Yes                 |
| fastest-validator | Limited                 | No                   | No                  |
| Zod               | No                      | Via message only     | No                  |
| Joi               | No                      | Via message only     | No                  |
| Valibot           | No                      | Via message only     | No                  |

#### Creating Domain Vocabularies

Aliases compose existing rules into domain-specific validators:

```javascript
const validator = new LIVR.Validator(schema);

// E-commerce domain rules
validator.registerAliasedRule({
    name: 'productSku',
    rules: ['required', { like: '^[A-Z]{3}-\\d{6}$' }],
    error: 'INVALID_PRODUCT_SKU', // Custom error code!
});

validator.registerAliasedRule({
    name: 'priceUsd',
    rules: ['required', 'positiveDecimal', { maxNumber: 999999.99 }],
    error: 'INVALID_PRICE',
});

validator.registerAliasedRule({
    name: 'quantity',
    rules: ['required', 'positiveInteger', { maxNumber: 10000 }],
    error: 'INVALID_QUANTITY',
});

// Clean, domain-focused schema
const orderSchema = {
    sku: 'productSku',
    price: 'priceUsd',
    qty: 'quantity',
};
```

#### Healthcare Domain Example

```javascript
validator.registerAliasedRule({
    name: 'patientMrn',
    rules: ['required', { lengthEqual: 10 }, { like: '^MRN\\d{7}$' }],
    error: 'INVALID_MEDICAL_RECORD_NUMBER',
});

validator.registerAliasedRule({
    name: 'diagnosisCode',
    rules: ['required', { like: '^[A-Z]\\d{2}\\.?\\d{0,4}$' }],
    error: 'INVALID_ICD10_CODE',
});

validator.registerAliasedRule({
    name: 'npiNumber',
    rules: ['required', { lengthEqual: 10 }, 'integer'],
    error: 'INVALID_NPI',
});

const patientSchema = {
    mrn: 'patientMrn',
    diagnosis: 'diagnosisCode',
    provider: 'npiNumber',
};
```

#### Alias Composition

Aliases can reference other aliases, enabling hierarchical rule composition:

```javascript
// Base rules
validator.registerAliasedRule({
    name: 'nonEmptyString',
    rules: ['required', 'string', 'trim', { minLength: 1 }],
});

// Domain rules built on base rules
validator.registerAliasedRule({
    name: 'personName',
    rules: ['nonEmptyString', { maxLength: 100 }],
    error: 'INVALID_NAME',
});

validator.registerAliasedRule({
    name: 'companyName',
    rules: ['nonEmptyString', { maxLength: 200 }],
    error: 'INVALID_COMPANY_NAME',
});

// Higher-level aliases building on previous ones
validator.registerAliasedRule({
    name: 'contactEmail',
    rules: ['required', 'email', 'toLc'],
    error: 'INVALID_CONTACT_EMAIL',
});
```

This layered approach enables:

-   **DRY principle**: Common patterns defined once
-   **Consistency**: All name fields share the same base validation
-   **Easy maintenance**: Update base rule, all dependent rules benefit

#### Configuration-Driven Aliases

Since aliases are defined with plain objects, load them from configuration:

```json
{
    "aliases": [
        {
            "name": "productSku",
            "rules": ["required", { "like": "^[A-Z]{3}-\\d{6}$" }],
            "error": "INVALID_SKU"
        },
        {
            "name": "priceUsd",
            "rules": ["required", "positiveDecimal", { "maxNumber": 999999.99 }],
            "error": "INVALID_PRICE"
        }
    ]
}
```

```javascript
const config = JSON.parse(fs.readFileSync('rules-config.json'));
config.aliases.forEach((alias) => validator.registerAliasedRule(alias));
```

This enables:

-   Non-developers defining validation rules via config files
-   Different rule sets per environment
-   A/B testing validation strictness
-   Multi-tenant rule customization

---

### Design Decision #5: Optimized for Both Dynamic AND Static Validation

> **Balanced performance** is a priority →
> We choose **lightweight JSON parsing + efficient rule execution** →
> Accepting **not being #1 in static-only benchmarks (but still millions ops/sec)**

#### Dynamic Validation Performance

Dynamic validation measures schema creation + validation—critical for runtime-generated schemas.

| Validator         | Simple (ops/sec) | Nested (ops/sec) | vs LIVR        |
| ----------------- | ---------------- | ---------------- | -------------- |
| **LIVR**          | **680,439**      | **268,485**      | baseline       |
| Valibot           | 110,558          | 83,013           | 6x slower      |
| Joi               | 34,098           | 19,569           | 20x slower     |
| fastest-validator | 10,450           | 5,267            | 65x slower     |
| Zod               | 7,234            | 5,541            | **94x slower** |

LIVR dominates dynamic validation because schemas are lightweight JSON structures, not complex class hierarchies.

#### Static Validation Performance

Static validation measures pre-compiled validator speed—typical production usage.

| Validator         | Simple (ops/sec) | Nested (ops/sec) | Note                |
| ----------------- | ---------------- | ---------------- | ------------------- |
| fastest-validator | 6,145,848        | 1,990,363        | Code generation     |
| Zod               | 4,437,226        | 2,380,376        |                     |
| **LIVR**          | **3,417,841**    | **883,965**      | Data interpretation |
| Valibot           | 2,810,239        | 1,218,845        |                     |
| Joi               | 356,850          | 149,656          |                     |

#### The Key Insight

**3.4 million ops/sec is already far beyond any real-world need.**

To put this in perspective:

-   3.4M ops/sec = validating every request for a service handling 200 billion requests/day
-   Most applications handle thousands, not millions, of validations per second
-   Network latency, database queries, and business logic dominate actual response times

The "slower" static performance is irrelevant in practice. LIVR gives you best-in-class dynamic performance AND production-ready static performance.

#### When Dynamic Performance Matters

-   **Form builders**: Schemas constructed at runtime based on configuration
-   **Multi-tenant validation**: Different rules per customer, loaded dynamically
-   **A/B testing**: Different validation strictness across variants
-   **API gateways**: Route-specific validation loaded from config

---

### Design Decision #6: Rules as Transformers (Not Just Validators)

> **Single-pass processing & web form compatibility** is a priority →
> We choose **rules that validate AND transform in one pass** →
> Accepting **implicit transformation (less explicit than separate transform step)**

#### Comparison

| Validator         | String Transformers             | Type Coercion                 | Approach           |
| ----------------- | ------------------------------- | ----------------------------- | ------------------ |
| **LIVR**          | `trim`, `toLc`, `toUc`          | Automatic (safe)              | Single pass        |
| Zod               | `trim()`, `toLowerCase()`, etc. | `z.coerce.*` (explicit)       | Pipe/chain         |
| Valibot           | `trim`, `toLowerCase`, etc.     | `toNumber()`, etc. (explicit) | Pipe               |
| Joi               | `.trim()`, `.lowercase()`, etc. | `convert: true` (default)     | Chain              |
| fastest-validator | `trim`, `lowercase`             | `convert: true`               | Options (mutates!) |

#### Example: Web Form Data

HTML forms submit everything as strings. LIVR handles this seamlessly:

```javascript
const validator = new LIVR.Validator({
    age: ['required', 'positiveInteger'],
    price: ['required', 'decimal'],
    name: ['required', 'trim'],
    email: ['required', 'email', 'toLc'],
});

// Input from web form (all strings)
const input = {
    age: '25',
    price: '19.99',
    name: '  John Doe  ',
    email: 'JOHN@EXAMPLE.COM',
};

const result = validator.validate(input);
// Output (properly typed):
// {
//   age: 25,              // number (coerced from string)
//   price: 19.99,         // number (coerced from string)
//   name: 'John Doe',     // string (trimmed)
//   email: 'john@example.com'  // string (lowercased)
// }
```

#### Built-in Transformers

| Rule        | Effect                             |
| ----------- | ---------------------------------- |
| `trim`      | Remove leading/trailing whitespace |
| `toLc`      | Convert to lowercase               |
| `toUc`      | Convert to uppercase               |
| `default`   | Provide default value if missing   |
| `remove`    | Remove field from output           |
| `leaveOnly` | Keep only specified fields         |

#### Type Coercion

Numeric rules automatically coerce string inputs:

| Rule              | Input    | Output |
| ----------------- | -------- | ------ |
| `integer`         | `"42"`   | `42`   |
| `positiveInteger` | `"100"`  | `100`  |
| `decimal`         | `"3.14"` | `3.14` |
| `numberBetween`   | `"50"`   | `50`   |

**Reference**: [LIVR Type Coercing Specification](https://livr-spec.org/validation-rules/types-coercing.html)

#### Secure Coercion: LIVR vs Valibot's Old Approach

LIVR's numeric coercion is **secure by design**. Before transforming a value, it validates the input type:

```javascript
// LIVR internal implementation
if (!util.isPrimitiveValue(value)) return 'FORMAT_ERROR';
value += ''; // Only coerce AFTER validating it's a primitive
```

This prevents dangerous coercions where complex types masquerade as valid strings:

| Input           | Old Valibot `coerce`          | LIVR                      |
| --------------- | ----------------------------- | ------------------------- |
| `{}`            | `"[object Object]"` (passes!) | `FORMAT_ERROR` (rejected) |
| `[]`            | `""` (passes!)                | `FORMAT_ERROR` (rejected) |
| `[1,2,3]`       | `"1,2,3"` (passes!)           | `FORMAT_ERROR` (rejected) |
| `"42"` (string) | `"42"` (valid)                | `42` (number, valid)      |

Valibot [removed implicit coercion](https://valibot.dev/blog/valibot-v1.2-release-notes/) in v1.2 due to this security concern, now requiring explicit `toNumber()`, `toString()` etc. LIVR has always followed the secure pattern: **validate type first, then transform**.

---

### Design Decision #7: "Everything is a Rule" Architecture

> **Extensibility & Consistency** is a priority →
> We choose **minimal core where built-in and custom rules use identical API** →
> Accepting **no special optimizations for built-in rules**

#### Comparison

| Validator         | Core Size | Custom Rule API          | Replace Built-ins |
| ----------------- | --------- | ------------------------ | ----------------- |
| **LIVR**          | ~4KB      | Same as built-in         | ✅ Yes            |
| Zod               | ~12KB     | Different (`.refine()`)  | ❌ No             |
| Joi               | ~150KB    | Different (`.custom()`)  | ❌ No             |
| Valibot           | ~1KB      | Different (`v.custom()`) | ❌ No             |
| fastest-validator | ~40KB     | Different                | ❌ No             |

#### The Uniform Rule API

Every rule in LIVR—built-in or custom—follows the same pattern:

```javascript
ruleName: (ruleArg) => (value, allValues, outputArr) => {
    // Return error code if invalid
    if (invalid) return 'ERROR_CODE';
    // Optionally transform value
    if (transform) outputArr.push(transformedValue);
};
```

#### Creating Custom Rules

**Simple validation rule:**

```javascript
LIVR.Validator.registerDefaultRules({
    strongPassword: () => (value) => {
        if (!value) return; // Let 'required' handle empty
        if (value.length < 8) return 'TOO_SHORT';
        if (!/[A-Z]/.test(value)) return 'MISSING_UPPERCASE';
        if (!/[0-9]/.test(value)) return 'MISSING_NUMBER';
        if (!/[!@#$%^&*]/.test(value)) return 'MISSING_SPECIAL';
    },
});

// Use like any built-in rule
const schema = { password: ['required', 'strongPassword'] };
```

**Rule with parameter:**

```javascript
LIVR.Validator.registerDefaultRules({
    minAge: (minAge) => (value) => {
        if (value === undefined || value === null) return;
        if (value < minAge) return 'TOO_YOUNG';
    },
});

// Use with parameter
const schema = { age: ['required', 'positiveInteger', { minAge: 18 }] };
```

**Rule with transformation:**

```javascript
LIVR.Validator.registerDefaultRules({
    toDate: () => (value, _, outputArr) => {
        if (!value) return;
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'INVALID_DATE';
        outputArr.push(date); // Transform string to Date object
    },
});

const schema = { birthDate: ['required', 'toDate'] };
// Input: { birthDate: '1990-05-15' }
// Output: { birthDate: Date object }
```

#### Why "Everything is a Rule" Matters

1. **First-class custom rules**: Your rules are not second-class citizens
2. **Replace built-ins**: Don't like how `email` works? Replace it
3. **Consistent debugging**: All rules work the same way
4. **Predictable API**: One pattern to learn, one pattern to document
5. **Transparent implementation**: Inspect code of complex meta rules (like `nestedObject`, `listOf`) and use them as examples for your own rules

#### Async Validation

The uniform rule API extends to async rules. Use `AsyncValidator` for rules that need database lookups or API calls:

```javascript
import LIVR from 'livr/async'; // Use async version

// Register an async rule
LIVR.Validator.registerDefaultRules({
    uniqueEmail: () => async (email) => {
        if (!email) return;
        const exists = await db.users.findByEmail(email);
        if (exists) return 'EMAIL_ALREADY_TAKEN';
    },
});

// Use like any other rule
const validator = new LIVR.AsyncValidator({
    email: ['required', 'email', 'uniqueEmail'],
});

// Validate returns a Promise
const result = await validator.validate({ email: 'test@example.com' });
```

No special syntax—async rules follow the same pattern, just return a Promise.

#### Rule Isolation for Multi-Tenancy

Register rules per-validator instance to prevent cross-tenant rule pollution:

```javascript
// Tenant A's validator with custom rules
const tenantAValidator = new LIVR.Validator(schemaA);
tenantAValidator.registerRules({
    tenantAFormat: () => (value) => {
        if (!value) return;
        if (!value.startsWith('ACME-')) return 'INVALID_FORMAT';
    },
});

// Tenant B's validator - cannot use tenantAFormat
const tenantBValidator = new LIVR.Validator(schemaB);
// tenantBValidator doesn't have access to tenantAFormat rule
```

This enables secure multi-tenant validation where each tenant can have custom rules without affecting others.

---

### Design Decision #8: Input Immutability

> **Predictability & Functional style** is a priority →
> We choose **always return new object, never mutate input** →
> Accepting **memory allocation overhead (negligible in practice)**

#### Comparison

| Validator         | Input Mutation                       | Predictable | Safe Reuse |
| ----------------- | ------------------------------------ | ----------- | ---------- |
| **LIVR**          | ❌ Never                             | ✅ Yes      | ✅ Yes     |
| fastest-validator | ⚠️ Mutates with `$$strict: 'remove'` | ❌ No       | ❌ No      |
| Zod               | ❌ Never                             | ✅ Yes      | ✅ Yes     |
| Joi               | ❌ Never                             | ✅ Yes      | ✅ Yes     |
| Valibot           | ❌ Never                             | ✅ Yes      | ✅ Yes     |

#### Example

**LIVR - Input preserved:**

```javascript
const input = {
    name: '  John  ',
    email: 'JOHN@EXAMPLE.COM',
    extraField: 'will be stripped',
};

const result = validator.validate(input);

// Result (new object):
// { name: 'John', email: 'john@example.com' }

// Input UNCHANGED:
console.log(input.extraField); // 'will be stripped' - still there!
console.log(input.name); // '  John  ' - still has whitespace!
```

**fastest-validator - Input mutated:**

```javascript
const input = {
    name: 'John',
    extraField: 'will be removed',
};

const result = check(input); // With $$strict: 'remove'

// Input MODIFIED:
console.log(input.extraField); // undefined - gone!
```

#### Why Immutability Matters

1. **Predictable behavior**: Functions shouldn't have hidden side effects
2. **Safe reuse**: Validate same input with multiple validators
3. **Debugging**: Original input preserved for logging/inspection
4. **Functional programming**: Fits naturally with immutable data patterns

---

### Design Decision #9: Unknown Fields Stripped by Default

> **Security by default** is a priority →
> We choose **always strip unknown fields** →
> Accepting **must explicitly allow extra fields if needed**

#### Comparison

| Validator         | Default Behavior | Security  | Configuration Needed               |
| ----------------- | ---------------- | --------- | ---------------------------------- |
| **LIVR**          | Strip unknown    | ✅ Secure | None                               |
| Zod               | Strip unknown    | ✅ Secure | `.passthrough()` to allow          |
| Joi               | Pass through     | ⚠️ Risk   | `.options({ stripUnknown: true })` |
| fastest-validator | Pass through     | ⚠️ Risk   | `$$strict: 'remove'`               |
| Valibot           | Strip unknown    | ✅ Secure | Use `passthrough` to allow         |

#### Example

```javascript
const validator = new LIVR.Validator({
    username: 'required',
    email: 'email',
});

const input = {
    username: 'john',
    email: 'john@example.com',
    isAdmin: true, // Attacker-injected
    role: 'superuser', // Attacker-injected
    __proto__: { hack: 1 }, // Prototype pollution attempt
};

const result = validator.validate(input);
// { username: 'john', email: 'john@example.com' }
// Malicious fields stripped automatically
```

#### Security Benefits

1. **Mass assignment protection**: Extra fields can't sneak into your data model
2. **Privilege escalation prevention**: Fields like `isAdmin` or `role` are stripped
3. **Prototype pollution defense**: Dangerous properties removed
4. **Defense in depth**: Security by default, not by configuration

#### Safe Defaults Summary

LIVR's design choices consistently favor security:

| Aspect                  | LIVR Default             | Why It's Secure                |
| ----------------------- | ------------------------ | ------------------------------ |
| Unknown fields          | Stripped                 | Mass assignment protection     |
| Missing optional fields | Omitted from output      | No unexpected nulls/undefineds |
| Invalid rules           | Rejected at compile time | Fail-fast, no silent failures  |
| Rule isolation          | Supported per-instance   | Multi-tenant security          |
| Schema parameters       | Data, never code         | No code injection possible     |

---

### Design Decision #10: Formal Specification with Shared Test Suite

> **Cross-platform consistency** is a priority →
> We choose **formal spec (livr-spec.org) with JSON test suite** →
> Accepting **specification maintenance overhead**

#### Comparison

| Validator         | Has Specification                         | Shared Test Suite | Language Implementations |
| ----------------- | ----------------------------------------- | ----------------- | ------------------------ |
| **LIVR**          | ✅ [livr-spec.org](https://livr-spec.org) | ✅ JSON files     | 10+                      |
| Zod               | ❌ No                                     | ❌ No             | JS/TS only               |
| Joi               | ❌ No                                     | ❌ No             | JS only                  |
| fastest-validator | ❌ No                                     | ❌ No             | JS only                  |
| Valibot           | ❌ No                                     | ❌ No             | JS/TS only               |

#### Why a Formal Specification is Possible

Because LIVR schemas are data (JSON), not code:

-   The specification is language-agnostic
-   Test cases are JSON files any implementation can run
-   No need to port JavaScript code to other languages

#### Available Implementations

The same schema works identically across all implementations:

| Language              | Package                                                          |
| --------------------- | ---------------------------------------------------------------- |
| JavaScript/TypeScript | [livr](https://www.npmjs.com/package/livr)                       |
| Perl                  | [Validator::LIVR](https://metacpan.org/pod/Validator::LIVR)      |
| PHP                   | [validator-livr](https://packagist.org/packages/validator/livr)  |
| Python                | [livr](https://pypi.org/project/livr/)                           |
| Ruby                  | [livr](https://rubygems.org/gems/livr)                           |
| Java                  | [livr-validator](https://github.com/vlbaluk/java-validator-livr) |
| Erlang                | [livr](https://github.com/koorchik/erlang-validator-livr)        |
| Lua                   | [livr](https://github.com/nicoster/lua-validator-livr)           |
| Rust                  | [livr](https://crates.io/crates/livr)                            |
| C++                   | [livr](https://github.com/nicoster/cpp-validator-livr)           |

#### Benefits

1. **Polyglot microservices**: Share validation logic across services in different languages
2. **Frontend/backend consistency**: Same rules in browser (JS) and server (Python/Java/etc.)
3. **Mobile validation**: Identical rules in iOS, Android, and web
4. **Community growth**: Anyone can create a new implementation with confidence

---

### Design Decision #11: Zero Dependencies

> **Supply chain security & lightweight deployment** is a priority →
> We choose **zero runtime dependencies** →
> Accepting **implementing each rule without reusing existing libraries**

#### Comparison

| Validator         | Zero Deps | Transitive Deps | Gzipped |
| ----------------- | --------- | --------------- | ------- |
| **LIVR**          | Yes       | 0               | 4.5 KB  |
| Valibot           | Yes       | 0               | 1.8 KB  |
| Zod               | Yes       | 0               | 14 KB   |
| fastest-validator | Yes       | 0               | 12.4 KB |
| Joi               | No        | 6+ (@hapi/\*)   | 55 KB   |

#### Why Zero Dependencies Matters

**Supply chain security:**

-   Every dependency is a potential attack vector
-   Transitive dependencies multiply risk exponentially
-   Notable incidents: [event-stream](https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident) (bitcoin theft), [colors.js](https://www.bleepingcomputer.com/news/security/dev-corrupts-npm-libs-colors-and-faker-breaking-thousands-of-apps/) (intentional corruption), [ua-parser-js](https://github.com/nicebyte/ua-parser-js/issues/536) (cryptominer injection)
-   Joi's 6+ @hapi/\* dependencies each represent audit surface

**Audit complexity:**

-   Zero dependencies = only your code to audit
-   No transitive dependency trees to review
-   Simpler security compliance (SOC2, HIPAA, etc.)

**Stability:**

-   No breaking changes from upstream packages
-   No version conflicts in dependency resolution
-   No abandoned dependency risk

#### Additional Benefits: Minimal Bundle Size

**Serverless/Edge computing:**

-   Cold start time directly affected by bundle size
-   Edge functions have strict size limits (Cloudflare Workers: 1MB)
-   Smaller bundles = faster deployments

**Frontend applications:**

-   Every KB affects page load time
-   Validation often needed client-side for UX
-   4.5KB vs 55KB is significant for mobile users

**Embedded systems:**

-   IoT devices have limited memory
-   Validation needed at the edge

---

## TypeScript Integration

LIVR fully supports TypeScript type inference using the `InferFromSchema<>` utility:

```typescript
import LIVR, { InferFromSchema } from 'livr';

const userSchema = {
    id: ['required', 'positiveInteger'],
    username: ['required', { minLength: 3 }, { maxLength: 50 }],
    role: { oneOf: ['admin', 'user', 'guest'] },
    settings: {
        nestedObject: {
            theme: { oneOf: ['light', 'dark'] },
            notifications: 'boolean',
        },
    },
} as const; // 'as const' required for literal type inference

type User = InferFromSchema<typeof userSchema>;
// Inferred type:
// {
//   id: number;
//   username: string;
//   role: 'admin' | 'user' | 'guest';
//   settings: {
//     theme: 'light' | 'dark';
//     notifications: boolean;
//   }
// }

const validator = new LIVR.Validator<User>(userSchema);
const result = validator.validate(input);

if (result) {
    // result is typed as User
    console.log(result.role); // TypeScript knows: 'admin' | 'user' | 'guest'
}
```

### Custom Rules with Type Inference

Register custom rule types via module augmentation:

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr';
import type { RuleTypeDef } from 'livr/types/inference';

// Declare custom rule types via module augmentation
declare module 'livr/types/inference' {
    interface RuleTypeRegistry {
        toDate: RuleTypeDef<Date, false, false>;
        uuid: RuleTypeDef<string, false, false>;
    }
}

// Register the rules
LIVR.Validator.registerDefaultRules({
    toDate: () => (value, _, outputArr) => {
        if (!value) return;
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'INVALID_DATE';
        outputArr.push(date);
    },
    uuid: () => (value) => {
        if (!value) return;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) return 'INVALID_UUID';
    },
});

const schema = {
    id: ['required', 'uuid'],
    createdAt: ['required', 'toDate'],
} as const;

type Entity = InferFromSchema<typeof schema>;
// { id: string; createdAt: Date }
```

---

## Performance Summary

### Dynamic Validation (Schema Creation + Validation)

Best for: Runtime-generated schemas, form builders, multi-tenant validation

| Validator         | Simple  | Nested  | Relative         |
| ----------------- | ------- | ------- | ---------------- |
| **LIVR**          | 680,439 | 268,485 | **1x (fastest)** |
| Valibot           | 110,558 | 83,013  | 6x slower        |
| Joi               | 34,098  | 19,569  | 20x slower       |
| fastest-validator | 10,450  | 5,267   | 65x slower       |
| Zod               | 7,234   | 5,541   | 94x slower       |

### Static Validation (Pre-compiled)

Best for: Fixed schemas, API endpoints, production validation

| Validator         | Simple    | Nested    | Note            |
| ----------------- | --------- | --------- | --------------- |
| fastest-validator | 6,145,848 | 1,990,363 | Code generation |
| Zod               | 4,437,226 | 2,380,376 |                 |
| **LIVR**          | 3,417,841 | 883,965   |                 |
| Valibot           | 2,810,239 | 1,218,845 |                 |
| Joi               | 356,850   | 149,656   |                 |

### The Bottom Line

-   **Dynamic validation**: LIVR is 94x faster than Zod, 65x faster than fastest-validator
-   **Static validation**: LIVR's 3.4M ops/sec exceeds any real-world requirement
-   **Balance**: Best-in-class dynamic + production-ready static

---

### Resources

-   **Specification**: [livr-spec.org](https://livr-spec.org)
-   **GitHub**: [github.com/koorchik/LIVR](https://github.com/koorchik/LIVR)
-   **NPM**: [npmjs.com/package/livr](https://www.npmjs.com/package/livr)
-   **Extra Rules**: [livr-extra-rules](https://www.npmjs.com/package/livr-extra-rules)
