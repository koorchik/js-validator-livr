// Type inference for 'trim' rule
// A new string: literal types of earlier rules are not kept

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    trim: string;
  }
}

// A module, so that "declare module" above adds to the types instead of replacing them
export {};
