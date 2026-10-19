// Types of livr-extra-rules 1.6.1, a package with the deprecated registries.
// The package as published must keep working.

import type { RuleTypeDef, ParameterizedRuleDef } from 'livr/types/inference';

// ============================================================================
// Type Inference for livr-extra-rules
// ============================================================================

// Module augmentation for simple rules (fixed output types)
declare module 'livr/types/inference' {
    // Add instance_of template for instanceOf rule
    interface TemplateOutputRegistry<Args> {
        instance_of: Args extends abstract new (...args: any) => any ? InstanceType<Args> : unknown;
    }

    interface RuleTypeRegistry {
        // String validators
        base64: RuleTypeDef<string, false, false>;
        credit_card: RuleTypeDef<string, false, false>;
        creditCard: RuleTypeRegistry['credit_card'];
        ipv4: RuleTypeDef<string, false, false>;
        md5: RuleTypeDef<string, false, false>;
        mongo_id: RuleTypeDef<string, false, false>;
        mongoId: RuleTypeRegistry['mongo_id'];
        uuid: RuleTypeDef<string, false, false>;
        iso_date: RuleTypeDef<string, false, false>;
        isoDate: RuleTypeRegistry['iso_date'];

        // Type transformer (converts to boolean)
        boolean: RuleTypeDef<boolean, false, false>;

        // Pass-through validators (validate but don't change type)
        has_methods: RuleTypeDef<unknown, false, false>;
        hasMethods: RuleTypeRegistry['has_methods'];
        list_items_unique: RuleTypeDef<unknown, false, false>;
        listItemsUnique: RuleTypeRegistry['list_items_unique'];
        list_length: RuleTypeDef<unknown, false, false>;
        listLength: RuleTypeRegistry['list_length'];
        required_if: RuleTypeDef<unknown, false, false>;
        requiredIf: RuleTypeRegistry['required_if'];
    }

    // Parameterized rules
    interface ParameterizedRuleRegistry {
        // 'is' outputs literal type of argument and has required effect
        is: ParameterizedRuleDef<'literal', true, false>;
        // 'instanceOf' outputs the instance type of the constructor argument
        instanceOf: ParameterizedRuleDef<'instance_of', false, false>;
        instance_of: ParameterizedRuleDef<'instance_of', false, false>;
    }
}

// ============================================================================
// Runtime Module Declaration
// ============================================================================

// "export =" is at the top level: inside "declare module 'livr-extra-rules'" in this file it
// would be a module augmentation, where exports are not allowed (TS2666 without skipLibCheck)

type RuleFactory = (
    ...args: Array<any>
) => (value: any, params: any, outputArr: Array<any>) => string | undefined;

/**
 * Extra rules to register with LIVR Validator.
 *
 * @example
 * ```typescript
 * import LIVR from 'livr';
 * import extraRules from 'livr-extra-rules';
 * import type { InferFromSchema } from 'livr/types';
 *
 * LIVR.Validator.registerDefaultRules(extraRules);
 *
 * const schema = {
 *     id: ['required', 'uuid'],
 *     is_active: 'boolean',
 *     status: { is: 'active' as const },
 * } as const;
 *
 * type Data = InferFromSchema<typeof schema>;
 * // { id: string; is_active?: boolean; status: 'active' }
 * ```
 */
type LivrExtraRules = Record<string, RuleFactory>;
declare const extraRules: LivrExtraRules;
export = extraRules;
