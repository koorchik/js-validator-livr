'use strict';

// Performance comparison of LIVR with other validators (numbers in docs/DESIGN.md).
//
//   cd benchmarks/compare && npm install && npm run bench
//
// Static:  validator is created once, only validation is measured.
// Dynamic: validator is created from the schema for every validation.
// Schemas are equivalent: same required fields, non-empty strings where LIVR uses "required",
// unknown fields are stripped. Input data is created for every validation, because
// fastest-validator with $$strict: 'remove' mutates the input.
// Set LIVR_DIR to benchmark another LIVR checkout.

const fs = require('fs');
const os = require('os');
const path = require('path');
const Benchmark = require('benchmark');
const z = require('zod');
const v = require('valibot');
const Joi = require('joi');
const FastestValidator = require('fastest-validator');

const LIVR_DIR = path.resolve(process.env.LIVR_DIR || path.join(__dirname, '../..'));
const LIVR = require(path.join(LIVR_DIR, 'lib/LIVR'));

// ---------- Data ----------

function makeSimpleData() {
    return {
        username: 'john',
        email: 'john@example.com',
        age: 30,
        gender: 'male',
        password: 'mypassword1',
        unknownField: 'must be stripped',
    };
}

function makeNestedData() {
    return {
        id: 1,
        user: {
            name: 'John',
            email: 'john@example.com',
            address: { city: 'Kyiv', zip: '01001', country: 'UA', unknownField: 1 },
            unknownField: 1,
        },
        tags: ['a', 'b', 'c'],
        unknownField: 1,
    };
}

// ---------- LIVR ----------

const livrSimpleSchema = {
    username: ['required', { max_length: 50 }],
    email: ['required', 'email'],
    age: ['required', 'positive_integer'],
    gender: { one_of: ['male', 'female'] },
    password: ['required', { min_length: 10 }],
};

const livrNestedSchema = {
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
                        country: { one_of: ['UA', 'US', 'PL'] },
                    },
                },
            },
        },
    ],
    tags: { list_of: ['required', { max_length: 20 }] },
};

// ---------- Zod ----------

function zodSimpleSchema() {
    return z.object({
        username: z.string().min(1).max(50),
        email: z.email(),
        age: z.number().int().positive(),
        gender: z.enum(['male', 'female']).optional(),
        password: z.string().min(10),
    });
}

function zodNestedSchema() {
    return z.object({
        id: z.number().int().positive(),
        user: z.object({
            name: z.string().min(1).max(50),
            email: z.email(),
            address: z
                .object({
                    city: z.string().min(1),
                    zip: z.string().min(3).max(10),
                    country: z.enum(['UA', 'US', 'PL']),
                })
                .optional(),
        }),
        tags: z.array(z.string().min(1).max(20)).optional(),
    });
}

// ---------- Valibot ----------

function valibotSimpleSchema() {
    return v.object({
        username: v.pipe(v.string(), v.nonEmpty(), v.maxLength(50)),
        email: v.pipe(v.string(), v.email()),
        age: v.pipe(v.number(), v.integer(), v.minValue(1)),
        gender: v.optional(v.picklist(['male', 'female'])),
        password: v.pipe(v.string(), v.minLength(10)),
    });
}

function valibotNestedSchema() {
    return v.object({
        id: v.pipe(v.number(), v.integer(), v.minValue(1)),
        user: v.object({
            name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(50)),
            email: v.pipe(v.string(), v.email()),
            address: v.optional(
                v.object({
                    city: v.pipe(v.string(), v.nonEmpty()),
                    zip: v.pipe(v.string(), v.minLength(3), v.maxLength(10)),
                    country: v.picklist(['UA', 'US', 'PL']),
                })
            ),
        }),
        tags: v.optional(v.array(v.pipe(v.string(), v.nonEmpty(), v.maxLength(20)))),
    });
}

// ---------- Joi ----------

const joiOptions = { stripUnknown: true };

function joiSimpleSchema() {
    return Joi.object({
        username: Joi.string().max(50).required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().positive().required(),
        gender: Joi.string().valid('male', 'female'),
        password: Joi.string().min(10).required(),
    });
}

function joiNestedSchema() {
    return Joi.object({
        id: Joi.number().integer().positive().required(),
        user: Joi.object({
            name: Joi.string().max(50).required(),
            email: Joi.string().email().required(),
            address: Joi.object({
                city: Joi.string().required(),
                zip: Joi.string().min(3).max(10),
                country: Joi.string().valid('UA', 'US', 'PL'),
            }),
        }).required(),
        tags: Joi.array().items(Joi.string().max(20).required()),
    });
}

// ---------- fastest-validator ----------

const fastestValidator = new FastestValidator();

const fvSimpleSchema = {
    $$strict: 'remove',
    username: { type: 'string', empty: false, max: 50 },
    email: { type: 'email' },
    age: { type: 'number', integer: true, positive: true },
    gender: { type: 'enum', values: ['male', 'female'], optional: true },
    password: { type: 'string', min: 10 },
};

const fvNestedSchema = {
    $$strict: 'remove',
    id: { type: 'number', integer: true, positive: true },
    user: {
        type: 'object',
        strict: 'remove',
        props: {
            name: { type: 'string', empty: false, max: 50 },
            email: { type: 'email' },
            address: {
                type: 'object',
                strict: 'remove',
                optional: true,
                props: {
                    city: { type: 'string', empty: false },
                    zip: { type: 'string', min: 3, max: 10, optional: true },
                    country: { type: 'enum', values: ['UA', 'US', 'PL'], optional: true },
                },
            },
        },
    },
    tags: { type: 'array', optional: true, items: { type: 'string', empty: false, max: 20 } },
};

// ---------- Validators under test ----------

function livrValidate(validator, data) {
    const result = validator.validate(data);
    if (!result) throw new Error('LIVR: ' + JSON.stringify(validator.getErrors()));
    return result;
}

function zodValidate(schema, data) {
    return schema.parse(data);
}

function valibotValidate(schema, data) {
    return v.parse(schema, data);
}

function joiValidate(schema, data) {
    const { error, value } = schema.validate(data, joiOptions);
    if (error) throw error;
    return value;
}

function fvValidate(check, data) {
    const result = check(data);
    if (result !== true) throw new Error('fastest-validator: ' + JSON.stringify(result));
    return data;
}

const livrSimple = new LIVR.Validator(livrSimpleSchema).prepare();
const livrNested = new LIVR.Validator(livrNestedSchema).prepare();
const zodSimple = zodSimpleSchema();
const zodNested = zodNestedSchema();
const valibotSimple = valibotSimpleSchema();
const valibotNested = valibotNestedSchema();
const joiSimple = joiSimpleSchema();
const joiNested = joiNestedSchema();
const fvSimple = fastestValidator.compile(fvSimpleSchema);
const fvNested = fastestValidator.compile(fvNestedSchema);

const VALIDATORS = {
    LIVR: {
        static: {
            simple: () => livrValidate(livrSimple, makeSimpleData()),
            nested: () => livrValidate(livrNested, makeNestedData()),
        },
        dynamic: {
            simple: () => livrValidate(new LIVR.Validator(livrSimpleSchema), makeSimpleData()),
            nested: () => livrValidate(new LIVR.Validator(livrNestedSchema), makeNestedData()),
        },
    },
    Zod: {
        static: {
            simple: () => zodValidate(zodSimple, makeSimpleData()),
            nested: () => zodValidate(zodNested, makeNestedData()),
        },
        dynamic: {
            simple: () => zodValidate(zodSimpleSchema(), makeSimpleData()),
            nested: () => zodValidate(zodNestedSchema(), makeNestedData()),
        },
    },
    Valibot: {
        static: {
            simple: () => valibotValidate(valibotSimple, makeSimpleData()),
            nested: () => valibotValidate(valibotNested, makeNestedData()),
        },
        dynamic: {
            simple: () => valibotValidate(valibotSimpleSchema(), makeSimpleData()),
            nested: () => valibotValidate(valibotNestedSchema(), makeNestedData()),
        },
    },
    Joi: {
        static: {
            simple: () => joiValidate(joiSimple, makeSimpleData()),
            nested: () => joiValidate(joiNested, makeNestedData()),
        },
        dynamic: {
            simple: () => joiValidate(joiSimpleSchema(), makeSimpleData()),
            nested: () => joiValidate(joiNestedSchema(), makeNestedData()),
        },
    },
    'fastest-validator': {
        static: {
            simple: () => fvValidate(fvSimple, makeSimpleData()),
            nested: () => fvValidate(fvNested, makeNestedData()),
        },
        dynamic: {
            simple: () => fvValidate(fastestValidator.compile(fvSimpleSchema), makeSimpleData()),
            nested: () => fvValidate(fastestValidator.compile(fvNestedSchema), makeNestedData()),
        },
    },
};

// ---------- Sanity check: every validator accepts the data and strips unknown fields ----------

for (const name in VALIDATORS) {
    for (const mode of ['static', 'dynamic']) {
        for (const scenario of ['simple', 'nested']) {
            const output = VALIDATORS[name][mode][scenario]();
            const nestedOutput = scenario === 'nested' ? output.user : output;
            if ('unknownField' in output || 'unknownField' in nestedOutput) {
                throw new Error(`${name} ${mode} ${scenario}: unknown field was not stripped`);
            }
        }
    }
}

// ---------- Run ----------

// Not every package exports its package.json
const packageVersion = dir => JSON.parse(fs.readFileSync(path.join(dir, 'package.json'))).version;
const modulesDir = path.join(__dirname, 'node_modules');

const versions = {
    LIVR: `${packageVersion(LIVR_DIR)} (${LIVR_DIR})`,
    Zod: packageVersion(path.join(modulesDir, 'zod')),
    Valibot: packageVersion(path.join(modulesDir, 'valibot')),
    Joi: packageVersion(path.join(modulesDir, 'joi')),
    'fastest-validator': packageVersion(path.join(modulesDir, 'fastest-validator')),
};

console.log(`Node.js ${process.version}, ${os.cpus()[0].model}`);
for (const name in versions) console.log(`${name} ${versions[name]}`);
console.log('');

const results = {};
const suite = new Benchmark.Suite();

for (const mode of ['static', 'dynamic']) {
    for (const scenario of ['simple', 'nested']) {
        for (const name in VALIDATORS) {
            suite.add(`${mode} ${scenario} ${name}`, VALIDATORS[name][mode][scenario]);
        }
    }
}

suite
    .on('cycle', event => {
        const [mode, scenario, ...nameParts] = event.target.name.split(' ');
        const name = nameParts.join(' ');
        results[mode] = results[mode] || {};
        results[mode][name] = results[mode][name] || {};
        results[mode][name][scenario] = event.target.hz;
        console.log(String(event.target));
    })
    .on('complete', () => {
        const format = hz => Math.round(hz).toLocaleString('en-US');

        // How the validator compares to LIVR
        const compare = (livrHz, hz) =>
            livrHz >= hz
                ? `${(livrHz / hz).toFixed(1)}x slower`
                : `${(hz / livrHz).toFixed(1)}x faster`;

        for (const mode of ['dynamic', 'static']) {
            const names = Object.keys(results[mode]).sort(
                (a, b) => results[mode][b].simple - results[mode][a].simple
            );

            console.log(`\n${mode} (ops/sec)\n`);
            console.log('| Validator | Simple | Nested | Simple vs LIVR | Nested vs LIVR |');
            console.log('| --- | --- | --- | --- | --- |');

            for (const name of names) {
                const { simple, nested } = results[mode][name];
                const livr = results[mode].LIVR;
                const isLivr = name === 'LIVR';

                const cells = [
                    name,
                    format(simple),
                    format(nested),
                    isLivr ? 'baseline' : compare(livr.simple, simple),
                    isLivr ? 'baseline' : compare(livr.nested, nested),
                ];

                console.log(`| ${cells.join(' | ')} |`);
            }
        }
    })
    .run();
