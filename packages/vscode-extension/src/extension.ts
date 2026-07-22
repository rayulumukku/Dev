import { isRayProject } from './utils/ProjectDetector.js';
import { validateConfigText } from './diagnostics/ConfigDiagnostics.js';
import { getCompletions } from './completion/CompletionProvider.js';
import { getHoverDoc } from './providers/HoverProvider.js';

export function activateExtension(workspaceDir: string) {
  const active = isRayProject(workspaceDir);
  console.log(`[Ray Extension] Activation check for workspace "${workspaceDir}": Ray Project active = ${active}`);

  return {
    active,
    validateConfigText,
    getCompletions,
    getHoverDoc,
  };
}

export function deactivateExtension() {
  console.log('[Ray Extension] Deactivated.');
}
