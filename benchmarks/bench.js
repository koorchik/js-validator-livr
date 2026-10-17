'use strict';

const Benchmark = require('benchmark');
const LIVR = require('../lib/LIVR');
const AsyncLIVR = require('../async');

const suite = new Benchmark.Suite();

// Scenario 1: Simple flat form validation (primary focus)
const simpleSchema = {
    name: 'required',
    email: 'email',
    age: 'positive_integer',
    phone: { max_length: 20 },
    website: 'url',
    bio: { max_length: 1000 }
};
const simpleValidator = new LIVR.Validator(simpleSchema);
simpleValidator.prepare();

const simpleData = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 25,
    phone: '555-1234',
    website: 'https://example.com',
    bio: 'A software developer'
};

// Scenario 2: Multiple rules per field
const multiRuleSchema = {
    username: ['required', { min_length: 3 }, { max_length: 20 }],
    email: ['required', 'email'],
    password: ['required', { min_length: 8 }],
    age: ['required', 'positive_integer', { min_number: 18 }]
};
const multiRuleValidator = new LIVR.Validator(multiRuleSchema);
multiRuleValidator.prepare();

const multiRuleData = {
    username: 'johndoe',
    email: 'john@example.com',
    password: 'secretpass123',
    age: 25
};

// Scenario 3: String-heavy validation (trim, to_lc, length checks)
const stringSchema = {
    firstName: ['required', 'trim', { min_length: 2 }, { max_length: 50 }],
    lastName: ['required', 'trim', { min_length: 2 }, { max_length: 50 }],
    email: ['required', 'trim', 'to_lc', 'email'],
    phone: ['trim', { max_length: 20 }],
    address: ['trim', { max_length: 200 }]
};
const stringValidator = new LIVR.Validator(stringSchema);
stringValidator.prepare();

const stringData = {
    firstName: '  John  ',
    lastName: '  Doe  ',
    email: '  JOHN@EXAMPLE.COM  ',
    phone: '  555-1234  ',
    address: '  123 Main St  '
};

// Scenario 4: Numeric validation
const numericSchema = {
    age: 'positive_integer',
    price: 'decimal',
    quantity: ['integer', { min_number: 0 }, { max_number: 1000 }],
    rating: ['decimal', { min_number: 0 }, { max_number: 5 }],
    score: { number_between: [0, 100] }
};
const numericValidator = new LIVR.Validator(numericSchema);
numericValidator.prepare();

const numericData = {
    age: 25,
    price: '19.99',
    quantity: 5,
    rating: '4.5',
    score: 85
};

// Scenario 5: Date validation (iso_date)
const dateSchema = {
    birthDate: ['required', 'iso_date'],
    startDate: 'iso_date',
    endDate: 'iso_date'
};
const dateValidator = new LIVR.Validator(dateSchema);
dateValidator.prepare();

const dateData = {
    birthDate: '1990-05-15',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
};

// Scenario 6: Larger form (15 fields)
const largeFormSchema = {
    firstName: 'required',
    lastName: 'required',
    email: ['required', 'email'],
    phone: { max_length: 20 },
    age: 'positive_integer',
    address1: { max_length: 100 },
    address2: { max_length: 100 },
    city: 'required',
    state: { max_length: 50 },
    zip: { max_length: 10 },
    country: 'required',
    website: 'url',
    company: { max_length: 100 },
    title: { max_length: 100 },
    bio: { max_length: 1000 }
};
const largeFormValidator = new LIVR.Validator(largeFormSchema);
largeFormValidator.prepare();

const largeFormData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    age: 30,
    address1: '123 Main St',
    address2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'USA',
    website: 'https://johndoe.com',
    company: 'Acme Corp',
    title: 'Software Engineer',
    bio: 'Experienced developer'
};

// Scenario 7: Validation with errors (tests error path)
const errorSchema = {
    email: ['required', 'email'],
    age: ['required', 'positive_integer']
};
const errorValidator = new LIVR.Validator(errorSchema);
errorValidator.prepare();

const errorData = {
    email: 'not-an-email',
    age: -5
};

// Scenario 8: Enum/choice validation (one_of, eq)
const enumSchema = {
    status: { one_of: ['pending', 'active', 'suspended', 'deleted'] },
    role: { one_of: ['admin', 'user', 'guest'] },
    priority: { one_of: [1, 2, 3, 4, 5] },
    type: { eq: 'standard' },
    category: { one_of: ['electronics', 'clothing', 'food', 'other'] }
};
const enumValidator = new LIVR.Validator(enumSchema);
enumValidator.prepare();

const enumData = {
    status: 'active',
    role: 'user',
    priority: 3,
    type: 'standard',
    category: 'electronics'
};

// Scenario 9: Nested objects with a list
const nestedSchema = {
    id: ['required', 'positive_integer'],
    user: [
        'required',
        {
            nested_object: {
                name: ['required', { max_length: 50 }],
                email: ['required', 'email'],
                address: {
                    nested_object: {
                        city: 'required',
                        zip: { length_between: [3, 10] },
                        country: { one_of: ['UA', 'US', 'PL'] }
                    }
                }
            }
        }
    ],
    tags: { list_of: ['required', { max_length: 20 }] }
};
const nestedValidator = new LIVR.Validator(nestedSchema);
nestedValidator.prepare();

const nestedData = {
    id: 1,
    user: {
        name: 'John',
        email: 'john@example.com',
        address: { city: 'Kyiv', zip: '01001', country: 'UA' }
    },
    tags: ['a', 'b', 'c']
};

// Scenario 10: List of 100 primitives
const listOfValidator = new LIVR.Validator({ ids: { list_of: ['required', 'positive_integer'] } });
listOfValidator.prepare();

const listOfData = { ids: Array.from({ length: 100 }, (_, i) => i + 1) };

// Scenario 11: List of 50 objects
const listOfObjectsSchema = {
    items: [
        'required',
        {
            list_of_objects: {
                id: ['required', 'positive_integer'],
                name: ['required', { max_length: 50 }],
                price: ['required', 'positive_decimal'],
                status: { one_of: ['new', 'old'] }
            }
        }
    ]
};
const listOfObjectsValidator = new LIVR.Validator(listOfObjectsSchema);
listOfObjectsValidator.prepare();

const listOfObjectsData = {
    items: Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: 'Item ' + i,
        price: '9.99',
        status: 'new'
    }))
};

// Scenario 12: Aliased rules and "or"
const aliasesValidator = new LIVR.Validator({
    age: 'adult_age',
    sku: 'product_sku',
    contact: { or: ['email', 'url'] }
});
aliasesValidator.registerAliasedRule({
    name: 'adult_age',
    rules: ['required', 'positive_integer', { min_number: 18 }],
    error: 'MUST_BE_ADULT'
});
aliasesValidator.registerAliasedRule({
    name: 'product_sku',
    rules: ['required', { like: '^[A-Z]{3}-\\d{6}$' }]
});
aliasesValidator.prepare();

const aliasesData = { age: 30, sku: 'ABC-123456', contact: 'https://example.com' };

// Scenarios 13-15: Async validator
const asyncSimpleValidator = new AsyncLIVR.AsyncValidator(simpleSchema);
asyncSimpleValidator.prepare();

const asyncNestedValidator = new AsyncLIVR.AsyncValidator(nestedSchema);
asyncNestedValidator.prepare();

const asyncListOfObjectsValidator = new AsyncLIVR.AsyncValidator(listOfObjectsSchema);
asyncListOfObjectsValidator.prepare();

console.log('LIVR Validator Benchmark Suite');
console.log('==============================\n');

suite
    .add('simple-form (6 fields, basic rules)', () => {
        simpleValidator.validate(simpleData);
    })
    .add('multi-rule (4 fields, 3-4 rules each)', () => {
        multiRuleValidator.validate(multiRuleData);
    })
    .add('string-heavy (5 fields, trim/length)', () => {
        stringValidator.validate(stringData);
    })
    .add('numeric (5 fields, number rules)', () => {
        numericValidator.validate(numericData);
    })
    .add('date-validation (3 iso_date fields)', () => {
        dateValidator.validate(dateData);
    })
    .add('large-form (15 fields)', () => {
        largeFormValidator.validate(largeFormData);
    })
    .add('error-path (validation failure)', () => {
        errorValidator.validate(errorData);
    })
    .add('enum-validation (5 fields, one_of/eq)', () => {
        enumValidator.validate(enumData);
    })
    .add('nested (2 nested objects + list_of)', () => {
        nestedValidator.validate(nestedData);
    })
    .add('list_of (100 integers)', () => {
        listOfValidator.validate(listOfData);
    })
    .add('list_of_objects (50 objects, 4 fields)', () => {
        listOfObjectsValidator.validate(listOfObjectsData);
    })
    .add('aliases and or', () => {
        aliasesValidator.validate(aliasesData);
    })
    .add('dynamic simple-form (new Validator per call)', () => {
        new LIVR.Validator(simpleSchema).validate(simpleData);
    })
    .add('dynamic nested (new Validator per call)', () => {
        new LIVR.Validator(nestedSchema).validate(nestedData);
    })
    .add('async simple-form (6 fields, basic rules)', {
        defer: true,
        fn: deferred => {
            asyncSimpleValidator.validate(simpleData).then(() => deferred.resolve());
        }
    })
    .add('async nested (2 nested objects + list_of)', {
        defer: true,
        fn: deferred => {
            asyncNestedValidator.validate(nestedData).then(() => deferred.resolve());
        }
    })
    .add('async list_of_objects (50 objects, 4 fields)', {
        defer: true,
        fn: deferred => {
            asyncListOfObjectsValidator.validate(listOfObjectsData).then(() => deferred.resolve());
        }
    })
    .on('cycle', event => {
        console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('\n==============================');
        console.log('Benchmark complete');
    })
    .run({ async: true });
