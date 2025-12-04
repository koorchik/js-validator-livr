// examples/simple.ts
// Simple TypeScript Type Inference Example
//
// This example demonstrates basic LIVR type inference features:
// - Required and optional fields
// - Primitive types (string, number)
// - Literal types with `one_of` and `eq`
// - Using `as const` for proper inference

// When using as an npm package:
//   import LIVR from 'livr';
//   import type { InferFromSchema } from 'livr/types';

// Within the repo, use relative imports:
import LIVR = require('../lib/LIVR');
type InferFromSchema<S> = LIVR.InferFromSchema<S>;

// ============================================================================
// Define Schema
// ============================================================================

const userSchema = {
    name: ['required', 'string'],
    email: ['required', 'email'],
    age: 'positive_integer',
    role: { one_of: ['admin', 'user', 'guest'] as const },
    status: { eq: 'active' as const },
} as const;

// Infer TypeScript type from schema
type User = InferFromSchema<typeof userSchema>;
// Result: {
//     name: string;
//     email: string;
//     age?: number;
//     role?: 'admin' | 'user' | 'guest';
//     status?: 'active';
// }

// ============================================================================
// Create Validator and Validate Data
// ============================================================================

const validator = new LIVR.Validator<User>(userSchema);

// Sample input (simulating data from API, form, etc.)
const input: unknown = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    role: 'admin',
    status: 'active',
};

const validData = validator.validate(input);

if (validData) {
    // validData is typed as User - hover to verify!
    console.log('Validation passed!');
    console.log('Name:', validData.name);           // string
    console.log('Email:', validData.email);         // string
    console.log('Age:', validData.age);             // number | undefined
    console.log('Role:', validData.role);           // 'admin' | 'user' | 'guest' | undefined
    console.log('Status:', validData.status);       // 'active' | undefined
} else {
    console.log('Validation failed:', validator.getErrors());
}
