// Type inference for 'leave_only' rule
// A new string: literal types of earlier rules are not kept

declare module '../../../types/inference' {
  interface BuiltInRuleTypes {
    leave_only: string;
  }
}

// A module, so that "declare module" above adds to the types instead of replacing them
export {};
