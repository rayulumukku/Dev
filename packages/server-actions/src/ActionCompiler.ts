import { ActionRegistry } from './ActionRegistry.js';
import { ServerActionsConfig } from './types.js';

export class ActionCompiler {
  static compile(code: string, id: string, config: ServerActionsConfig = {}): { code: string; actionsCount: number } {
    let transformed = code;
    let count = 0;

    // Detect module-level "use server" or function-level "use server"
    if (code.includes('"use server"') || code.includes("'use server'")) {
      const asyncFuncRegex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)/g;
      let match;

      while ((match = asyncFuncRegex.exec(code)) !== null) {
        const actionName = match[1];
        const actionId = `${id}#${actionName}`;

        ActionRegistry.register({
          id: actionId,
          name: actionName,
          filepath: id,
          handler: () => {
            console.log(`[Ray Server Action] Executing ${actionId}`);
          },
        });

        count++;
      }

      transformed = `
/* Ray Server Actions Compiled Binding */
import { ActionRegistry } from '@ray/server-actions';
${transformed}
`;
    }

    return { code: transformed, actionsCount: count };
  }
}
