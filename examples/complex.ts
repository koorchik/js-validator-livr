// examples/complex.ts
// Complex TypeScript Type Inference Example
//
// This example demonstrates advanced LIVR type inference features:
// - Custom rules with type definitions
// - Nested objects using `nested_object`
// - Lists using `list_of` and `list_of_objects`
// - Discriminated unions with `list_of_different_objects`
// - Default values with type widening
// - Rules aliasing with `registerAliasedRule`

// When using as an npm package:
//   import LIVR from 'livr';
//   import type { InferFromSchema, RuleTypeDef } from 'livr/types';

// Within the repo, use relative imports:
import LIVR = require('../lib/LIVR');
type InferFromSchema<S> = LIVR.InferFromSchema<S>;
type RuleTypeDef<O, R extends boolean, D extends boolean> = LIVR.RuleTypeDef<O, R, D>;

// ============================================================================
// SECTION 1: Custom Rule with Type Definition
// ============================================================================

// Define custom rule: phone_number
function phoneNumber() {
    return (value: unknown) => {
        if (value === undefined || value === null || value === '') return;
        if (typeof value !== 'string') return 'FORMAT_ERROR';

        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(value)) {
            return 'INVALID_PHONE_NUMBER';
        }
    };
}

// Register type for custom rule (declaration merging)
// When using as npm package: declare module 'livr/types/inference'
declare module '../types/inference' {
    interface RuleTypeRegistry {
        phone_number: RuleTypeDef<string, false, false>;
        phoneNumber: RuleTypeRegistry['phone_number'];
    }
}

// Register the custom rule
LIVR.Validator.registerDefaultRules({ phone_number: phoneNumber });

// ============================================================================
// SECTION 2: Complex Schema with Nested Data
// ============================================================================

const orderSchema = {
    // Required fields
    id: ['required', 'positive_integer'],

    // Nested object
    customer: {
        nested_object: {
            name: ['required', 'string'],
            email: ['required', 'email'],
            phone: 'phone_number',  // Using custom rule
            address: {
                nested_object: {
                    street: ['required', 'string'],
                    city: ['required', 'string'],
                    zip: 'string',
                    country: { one_of: ['US', 'CA', 'UK', 'DE'] as const },
                },
            },
        },
    },

    // List of objects
    items: {
        list_of_objects: {
            productId: ['required', 'positive_integer'],
            name: ['required', 'string'],
            quantity: ['required', 'positive_integer'],
            price: 'positive_decimal',
        },
    },

    // List of primitives
    tags: { list_of: 'string' },

    // Default value (widens to union type)
    status: { default: 'pending' as 'pending' | 'processing' | 'shipped' | 'delivered' },

    // Discriminated union with list_of_different_objects
    events: {
        list_of_different_objects: [
            'type',
            {
                created: {
                    type: { eq: 'created' as const },
                    timestamp: ['required', 'iso_date'],
                },
                updated: {
                    type: { eq: 'updated' as const },
                    timestamp: ['required', 'iso_date'],
                    changes: { list_of: 'string' },
                },
                shipped: {
                    type: { eq: 'shipped' as const },
                    timestamp: ['required', 'iso_date'],
                    trackingNumber: ['required', 'string'],
                },
            },
        ],
    },
} as const;

// Infer the complex type
type Order = InferFromSchema<typeof orderSchema>;

// ============================================================================
// SECTION 3: Rules Aliasing
// ============================================================================

const validator = new LIVR.Validator<Order>(orderSchema);

// Register aliased rules for reusable validation patterns
validator.registerAliasedRule({
    name: 'valid_zip',
    rules: ['string', { like: '^\\d{5}(-\\d{4})?$' }],
    error: 'INVALID_ZIP_CODE'
});

validator.registerAliasedRule({
    name: 'positive_price',
    rules: ['required', 'positive_decimal', { min_number: 0.01 }],
    error: 'INVALID_PRICE'
});

// ============================================================================
// SECTION 4: Validate Data
// ============================================================================

const input: unknown = {
    id: 12345,
    customer: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-123-4567',
        address: {
            street: '123 Main St',
            city: 'New York',
            zip: '10001',
            country: 'US',
        },
    },
    items: [
        { productId: 1, name: 'Widget', quantity: 2, price: 29.99 },
        { productId: 2, name: 'Gadget', quantity: 1, price: 49.99 },
    ],
    tags: ['express', 'gift-wrap'],
    events: [
        { type: 'created', timestamp: '2024-01-15' },
        { type: 'updated', timestamp: '2024-01-16', changes: ['address'] },
    ],
};

const validData = validator.validate(input);

if (validData) {
    // validData is typed as Order - hover to verify!
    console.log('Validation passed!');

    // Access nested data with full type safety
    console.log('Order ID:', validData.id);                           // number
    console.log('Customer:', validData.customer?.name);               // string | undefined
    console.log('City:', validData.customer?.address?.city);          // string | undefined
    console.log('Country:', validData.customer?.address?.country);    // 'US' | 'CA' | 'UK' | 'DE' | undefined
    console.log('Status:', validData.status);                         // 'pending' | 'processing' | 'shipped' | 'delivered'

    // Iterate items with proper types
    validData.items?.forEach(item => {
        console.log(`  ${item.name}: ${item.quantity} x $${item.price}`);
    });

    // Handle discriminated union
    validData.events?.forEach(event => {
        if (event.type === 'shipped') {
            console.log('Tracking:', event.trackingNumber);  // TypeScript knows this exists!
        }
    });
} else {
    console.log('Validation failed:', validator.getErrors());
}
