import { ConfigOption } from '../types.js';

export const RAY_CONFIG_SCHEMA: ConfigOption[] = [
  { key: 'root', type: 'string', description: 'Project root directory path', default: "process.cwd()" },
  { key: 'base', type: 'string', description: 'Base public path for deployment', default: "'/'" },
  { key: 'resolve.alias', type: 'object', description: 'Module resolution path aliases mapping', default: "{ '@': '/src' }" },
  { key: 'server.port', type: 'number', description: 'Development server listening port', default: '3000' },
  { key: 'server.host', type: 'string | boolean', description: 'Listen on specified IP or all interfaces', default: "'localhost'" },
  { key: 'server.open', type: 'boolean', description: 'Automatically open browser on dev server start', default: 'false' },
  { key: 'build.outDir', type: 'string', description: 'Output directory for production assets', default: "'dist'" },
  { key: 'build.assetsDir', type: 'string', description: 'Directory under outDir to place static assets', default: "'assets'" },
  { key: 'build.minify', type: 'boolean', description: 'Enable production code minification', default: 'true' },
  { key: 'build.sourcemap', type: 'boolean', description: 'Generate source maps during production build', default: 'false' },
  { key: 'plugins', type: 'array', description: 'Array of Ray plugins', default: '[]' },
];
