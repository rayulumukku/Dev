import { ActionDispatcher } from './ActionDispatcher.js';
import { ActionSerializer } from './ActionSerializer.js';
import { ActionInvocationResult, ServerActionsConfig } from './types.js';

export class ActionRuntime {
  static async handleActionRequest(actionId: string, payloadRaw: string, config: ServerActionsConfig = {}): Promise<ActionInvocationResult> {
    const args = ActionSerializer.deserialize(payloadRaw);
    const parsedArgs = Array.isArray(args) ? args : [args];
    return await ActionDispatcher.dispatch(actionId, parsedArgs, config);
  }
}
