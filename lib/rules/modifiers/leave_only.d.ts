// Type inference for 'leave_only' rule
import type { RuleTypeDef } from '../../../types/inference';

declare module '../../../types/inference' {
  interface RuleTypeRegistry {
    leave_only: RuleTypeDef<string, false, false>;
    leaveOnly: RuleTypeRegistry['leave_only'];
  }
}
