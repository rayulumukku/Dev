import { ActionRegistry } from './ActionRegistry.js';
import { ActionSecurity } from './ActionSecurity.js';
import { ActionInvocationResult, ServerActionsConfig } from './types.js';

export class ActionDispatcher {
  static async dispatch(actionId: string, args: any[], config: ServerActionsConfig = {}): Promise<ActionInvocationResult> {
    const start = Date.now();

    if (!ActionSecurity.validateActionId(actionId)) {
      return {
        success: false,
        error: `[Ray Security Error] Invalid action ID: "${actionId}"`,
        actionId,
        durationMs: Date.now() - start,
      };
    }

    const action = ActionRegistry.get(actionId);
    if (!action || typeof action.handler !== 'function') {
      return {
        success: false,
        error: `[Ray Runtime Error] Server action "${actionId}" not found or handler is not executable.`,
        actionId,
        durationMs: Date.now() - start,
      };
    }

    try {
      const boundArgs = action.boundArgs || [];
      const finalArgs = [...boundArgs, ...args];
      const result = await action.handler(...finalArgs);

      return {
        success: true,
        result,
        actionId,
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Execution error during Server Action invocation',
        actionId,
        durationMs: Date.now() - start,
      };
    }
  }
}
