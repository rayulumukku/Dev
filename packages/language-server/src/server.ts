import { RayLanguageServer } from './LanguageServer.js';

export function startServer(projectRoot = process.cwd()) {
  const server = new RayLanguageServer(projectRoot);
  console.log(`[Ray Language Server] Server initialized for workspace: ${projectRoot}`);
  return server;
}
