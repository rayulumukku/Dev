import { CodeAction, Diagnostic, Range } from './types.js';

export class CodeActionProvider {
  getCodeActions(uri: string, range: Range, diagnostics: Diagnostic[]): CodeAction[] {
    const actions: CodeAction[] = [];

    for (const diag of diagnostics) {
      if (diag.code === 'DEPRECATED_OPTION') {
        actions.push({
          title: 'Remove deprecated option',
          kind: 'quickfix',
          diagnostics: [diag],
        });
      } else if (diag.code === 'UNRESOLVED_IMPORT') {
        actions.push({
          title: 'Create missing file or check path alias',
          kind: 'quickfix',
          diagnostics: [diag],
        });
      }
    }

    return actions;
  }
}
