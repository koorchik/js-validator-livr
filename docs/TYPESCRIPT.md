# TypeScript Type Inference

LIVR provides powerful TypeScript type inference that automatically derives types from your validation schemas. This gives you type safety without manually defining interfaces that duplicate your validation rules.

## Table of Contents

- [Basic Usage](#basic-usage)
- [How Types Are Inferred](#how-types-are-inferred)
  - [Required vs Optional Fields](#required-vs-optional-fields)
  - [Primitive Type Rules](#primitive-type-rules)
  - [Literal Types](#literal-types-with-one_of-and-eq)
- [Complex Schemas](#complex-schemas)
  - [Nested Objects](#nested-objects)
  - [Lists](#lists)
  - [Discriminated Unions](#discriminated-unions)
  - [Union Types](#union-types-with-or)
- [Custom Rules Type Inference](#custom-rules-type-inference)
  - [Creating Type Definitions](#step-1-create-the-rule-implementation)
  - [Parameterized Output Types](#advanced-rules-with-parameterized-output-types)
  - [RuleTypeDef Parameters](#ruletypedef-parameters)
  - [External Rule Packages](#type-inference-for-external-rule-packages)
- [Available Type Exports](#available-type-exports)

---

## Basic Usage

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';

const userSchema = {
    name: ['required', 'string'],
    email: ['required', 'email'],
    age: 'positive_integer',
} as const;

// Infer the type from the schema
type User = InferFromSchema<typeof userSchema>;
// Result: { name: string; email: string; age?: number }

// Pass the inferred type as a generic parameter
const validator = new LIVR.Validator<User>(userSchema);
const result = validator.validate(input);

if (result) {
    // result is typed as User
    console.log(result.name); // string
    console.log(result.age);  // number | undefined
}
```

> **Important:** Always use `as const` after your schema definition to preserve literal types and enable proper inference.

---

## How Types Are Inferred

### Required vs Optional Fields

By default, all fields are **optional**. Use the `required` rule to make a field mandatory:

```typescript
const schema = {
    requiredField: ['required', 'string'],  // string (required)
    optionalField: 'string',                 // string | undefined (optional)
} as const;

type Data = InferFromSchema<typeof schema>;
// { requiredField: string; optionalField?: string }
```

The `default` rule also makes fields non-optional since they always have a value:

```typescript
const schema = {
    count: [{ default: 0 }, 'integer'],     // number (has default)
    enabled: { default: true },              // boolean (has default, widened)
} as const;

type Config = InferFromSchema<typeof schema>;
// { count: number; enabled: boolean }
```

### Primitive Type Rules

| Rule | Inferred Type |
|------|---------------|
| `string` | `string` |
| `integer`, `positive_integer` | `number` |
| `decimal`, `positive_decimal` | `number` |
| `email`, `url`, `iso_date` | `string` |
| `trim`, `to_lc`, `to_uc` | `string` |
| `max_length`, `min_length`, etc. | `string` |
| `max_number`, `min_number`, etc. | `number` |

### Literal Types with `one_of` and `eq`

To get literal union types, use `as const` on the values array:

```typescript
const schema = {
    // Without as const: string
    // With as const: 'admin' | 'user' | 'guest'
    role: { one_of: ['admin', 'user', 'guest'] as const },

    // Literal type: 'active'
    status: { eq: 'active' as const },
} as const;

type Data = InferFromSchema<typeof schema>;
// { role?: 'admin' | 'user' | 'guest'; status?: 'active' }
```

### Type Widening with `default`

The `default` rule automatically widens literal types to their primitive base:

```typescript
const schema = {
    // Widens to primitive types
    count: { default: 0 },           // number (not 0)
    name: { default: 'anonymous' },  // string (not 'anonymous')
    active: { default: true },       // boolean (not true)

    // Use type assertions with unions to preserve specific types
    status: { default: 'ACTIVE' as 'ACTIVE' | 'PENDING' },  // 'ACTIVE' | 'PENDING'
} as const;

type Config = InferFromSchema<typeof schema>;
// {
//     count: number;
//     name: string;
//     active: boolean;
//     status: 'ACTIVE' | 'PENDING';
// }
```

This is useful because default values typically represent any value of that type, not just the specific default. Use type assertions with union types (`as 'A' | 'B'`) when you need a specific set of allowed values.

---

## Complex Schemas

### Nested Objects

```typescript
const schema = {
    user: {
        nested_object: {
            name: ['required', 'string'],
            email: 'email',
            address: {
                nested_object: {
                    city: ['required', 'string'],
                    zip: 'positive_integer',
                },
            },
        },
    },
} as const;

type Data = InferFromSchema<typeof schema>;
// {
//     user?: {
//         name: string;
//         email?: string;
//         address?: {
//             city: string;
//             zip?: number;
//         };
//     };
// }
```

### Lists

```typescript
const schema = {
    // List of numbers
    ids: { list_of: 'positive_integer' },

    // List of strings with validation
    tags: { list_of: ['required', 'string', { max_length: 50 }] },

    // List of objects
    items: {
        list_of_objects: {
            id: ['required', 'positive_integer'],
            name: ['required', 'string'],
            quantity: 'positive_integer',
        },
    },
} as const;

type Data = InferFromSchema<typeof schema>;
// {
//     ids?: number[];
//     tags?: string[];
//     items?: Array<{
//         id: number;
//         name: string;
//         quantity?: number;
//     }>;
// }
```

### Discriminated Unions

For polymorphic data with a type discriminator:

```typescript
const schema = {
    events: {
        list_of_different_objects: [
            'type',  // Discriminator field
            {
                click: {
                    type: { eq: 'click' as const },
                    x: ['required', 'integer'],
                    y: ['required', 'integer'],
                },
                scroll: {
                    type: { eq: 'scroll' as const },
                    direction: { one_of: ['up', 'down'] as const },
                },
            },
        ],
    },
} as const;

type Data = InferFromSchema<typeof schema>;
// {
//     events?: Array<
//         | { type: 'click'; x: number; y: number }
//         | { type: 'scroll'; direction?: 'up' | 'down' }
//     >;
// }
```

### Union Types with `or`

```typescript
const schema = {
    // Can be either a string or a number
    value: { or: ['string', 'integer'] },
} as const;

type Data = InferFromSchema<typeof schema>;
// { value?: string | number }
```

---

## Custom Rules Type Inference

When you create custom validation rules, you can also define their type inference behavior.

### Step 1: Create the Rule Implementation

```typescript
// my-rules/phone_number.js
module.exports = function phoneNumber(countryCode) {
    return (value) => {
        if (value === undefined || value === null || value === '') return;

        // Your validation logic here
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(value)) {
            return 'INVALID_PHONE_NUMBER';
        }
    };
};
```

### Step 2: Create Type Definition File

Create a `.d.ts` file alongside your rule (or in your types directory):

```typescript
// my-rules/phone_number.d.ts
import type { RuleTypeDef } from 'livr/types/inference';

declare module 'livr/types/inference' {
    interface RuleTypeRegistry {
        // Simple rule that outputs string
        phone_number: RuleTypeDef<string, false, false>;

        // Also register camelCase version
        phoneNumber: RuleTypeRegistry['phone_number'];
    }
}
```

### Step 3: Use the Rule with Type Inference

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';
import phoneNumber from './my-rules/phone_number';

// Register the rule
LIVR.Validator.registerDefaultRules({ phone_number: phoneNumber });

const schema = {
    name: ['required', 'string'],
    phone: ['required', 'phone_number'],
} as const;

type Contact = InferFromSchema<typeof schema>;
// { name: string; phone: string }

// Pass the inferred type as a generic parameter
const validator = new LIVR.Validator<Contact>(schema);
const result = validator.validate(input);
// result is typed as Contact | false
```

### Advanced: Rules with Parameterized Output Types

For rules where the output type depends on the arguments, use `ParameterizedRuleRegistry` with templates.

#### Using Built-in Templates

LIVR provides several built-in templates for common patterns:

| Template | Description | Example Usage |
|----------|-------------|---------------|
| `literal` | Output equals the argument type | `eq` |
| `array_element` | Output is element type of array argument | `one_of` |
| `infer_schema` | Output is inferred from schema argument | `nested_object` |
| `infer_schema_array` | Output is array of inferred schema type | `list_of_objects` |
| `infer_rule_array` | Output is array of inferred rule type | `list_of` |

```typescript
// my-rules/allowed_status.d.ts
import type { ParameterizedRuleDef } from 'livr/types/inference';

declare module 'livr/types/inference' {
    interface ParameterizedRuleRegistry {
        // Uses 'array_element' template: output is union of array elements
        allowed_status: ParameterizedRuleDef<'array_element', false, false>;
    }
}
```

```typescript
// Usage
const schema = {
    status: { allowed_status: ['pending', 'active', 'closed'] as const },
} as const;

type Data = InferFromSchema<typeof schema>;
// { status?: 'pending' | 'active' | 'closed' }
```

#### Creating Custom Templates

For rules that need custom type transformations, you can extend `TemplateOutputRegistry`:

```typescript
// my-rules/instance_of.d.ts
import type { ParameterizedRuleDef } from 'livr/types/inference';

declare module 'livr/types/inference' {
    // Step 1: Define custom template computation
    interface TemplateOutputRegistry<Args> {
        // Extract instance type from constructor argument
        my_instance: Args extends abstract new (...args: any) => any
            ? InstanceType<Args>
            : unknown;
    }

    // Step 2: Register rule using the template
    interface ParameterizedRuleRegistry {
        my_instance_of: ParameterizedRuleDef<'my_instance', false, false>;
    }
}
```

```typescript
// Usage
import { Temporal } from '@js-temporal/polyfill';

const schema = {
    createdAt: { my_instance_of: Temporal.Instant },
} as const;

type Data = InferFromSchema<typeof schema>;
// { createdAt?: Temporal.Instant }
```

#### ParameterizedRuleDef Parameters

```typescript
ParameterizedRuleDef<TTemplate, TRequiredEffect, TDefaultEffect>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `TTemplate` | `string` | Template name from `TemplateOutputRegistry` |
| `TRequiredEffect` | `boolean` | Set to `true` if this rule makes the field required |
| `TDefaultEffect` | `boolean` | Set to `true` if this rule provides a default value |

#### Alternative Approaches

**Option 1: Use existing rules as building blocks**

```typescript
// Use one_of which already has proper type inference
const schema = {
    status: { one_of: ['pending', 'active', 'closed'] as const },
} as const;
```

**Option 2: Create an aliased rule**

```typescript
// Register as aliased rule - types will flow through
LIVR.Validator.registerAliasedDefaultRule({
    name: 'status_enum',
    rules: { one_of: ['pending', 'active', 'closed'] },
});
```

---

## RuleTypeDef Parameters

When defining custom rule types:

```typescript
RuleTypeDef<TOutput, TRequiredEffect, TDefaultEffect>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `TOutput` | `any` | The TypeScript type this rule produces |
| `TRequiredEffect` | `boolean` | Set to `true` if this rule makes the field required |
| `TDefaultEffect` | `boolean` | Set to `true` if this rule provides a default value |

### Examples

```typescript
// Simple string output
RuleTypeDef<string, false, false>

// Makes field required (like 'required' rule)
RuleTypeDef<unknown, true, false>

// Provides default value (like 'default' rule)
RuleTypeDef<unknown, false, true>

// Number output
RuleTypeDef<number, false, false>

// Object output
RuleTypeDef<{ id: number; name: string }, false, false>
```

---

## Type Inference for External Rule Packages

If you're publishing a package with LIVR rules, include type definitions.

### Simple Rules (Fixed Output Types)

For rules that always output the same type:

```typescript
// my-livr-rules/types.d.ts
import type { RuleTypeDef } from 'livr/types/inference';

declare module 'livr/types/inference' {
    interface RuleTypeRegistry {
        // Your custom rules
        uuid: RuleTypeDef<string, false, false>;
        iso_timestamp: RuleTypeDef<string, false, false>;
        json_string: RuleTypeDef<object, false, false>;

        // CamelCase aliases
        isoTimestamp: RuleTypeRegistry['iso_timestamp'];
        jsonString: RuleTypeRegistry['json_string'];
    }
}
```

### Parameterized Rules (Output Depends on Arguments)

For rules where output type depends on arguments, use `ParameterizedRuleRegistry`:

```typescript
// my-livr-rules/types.d.ts
import type { RuleTypeDef, ParameterizedRuleDef } from 'livr/types/inference';

declare module 'livr/types/inference' {
    // Simple rules
    interface RuleTypeRegistry {
        uuid: RuleTypeDef<string, false, false>;
    }

    // Parameterized rules using built-in templates
    interface ParameterizedRuleRegistry {
        // Uses 'literal' template: output equals the argument
        is: ParameterizedRuleDef<'literal', true, false>;
        // Uses 'array_element' template: output is union of array elements
        allowed_values: ParameterizedRuleDef<'array_element', false, false>;
    }
}
```

### Custom Templates

For rules that need custom type transformations, extend `TemplateOutputRegistry`:

```typescript
// my-livr-rules/types.d.ts
import type { ParameterizedRuleDef } from 'livr/types/inference';

declare module 'livr/types/inference' {
    // Define custom template computation
    interface TemplateOutputRegistry<Args> {
        instance_of: Args extends abstract new (...args: any) => any
            ? InstanceType<Args>
            : unknown;
    }

    // Register rules using the custom template
    interface ParameterizedRuleRegistry {
        instanceOf: ParameterizedRuleDef<'instance_of', false, false>;
        instance_of: ParameterizedRuleDef<'instance_of', false, false>;
    }
}
```

### Using External Rule Packages

Users of your package will automatically get type inference when they import it:

```typescript
import LIVR from 'livr';
import type { InferFromSchema } from 'livr/types';
import 'my-livr-rules'; // Imports rules and type augmentations

const schema = {
    id: ['required', 'uuid'],
    createdAt: 'iso_timestamp',
} as const;

type Record = InferFromSchema<typeof schema>;
// { id: string; createdAt?: string }
```

---

## Available Type Exports

```typescript
import type {
    // Main inference type
    InferFromSchema,

    // Infer type from a single rule (useful for list elements)
    InferRuleType,

    // Schema and rule definition types
    LIVRSchema,
    LIVRRuleDefinition,
    LIVRPrimitive,

    // For defining custom rule types (fixed output)
    RuleTypeDef,
    RuleTypeRegistry,

    // For defining parameterized rules (output depends on arguments)
    ParameterizedRuleDef,
    ParameterizedRuleRegistry,

    // For defining custom output templates
    TemplateOutputRegistry,

    // Utility types
    Simplify,
    SimpleRule,
    RequiredRule,
    ParameterizedRule,
    DefaultRule,
} from 'livr/types';
```
