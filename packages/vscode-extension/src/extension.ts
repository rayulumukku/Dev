import { isRayProject } from './utils/ProjectDetector.js';
import { RayLanguageServer } from '@ray/language-server';

let _server: RayLanguageServer | null = null;

export function activateExtension(workspaceDir: string) {
  const active = isRayProject(workspaceDir);
  console.log(`[Ray Extension] Activation check for workspace "${workspaceDir}": Ray Project active = ${active}`);

  if (active) {
    _server = new RayLanguageServer(workspaceDir);
  }

  return {
    active,
    server: _server,
    capabilities: _server ? _server.getCapabilities() : null,
    validateConfigText: (code: string) => _server ? _server.onDiagnostics('ray.config.ts', code) : [],
    getCompletions: (code: string) => _server ? _server.onCompletion('ray.config.ts', { line: 0, character: 0 }, code) : [],
    getHoverDoc: (code: string) => _server ? _server.onHover('ray.config.ts', { line: 0, character: 0 }, code) : null,
  };
}

export function deactivateExtension() {
  _server = null;
  console.log('[Ray Extension] Deactivated.');
}
