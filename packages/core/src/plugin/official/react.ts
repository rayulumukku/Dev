import { RayPlugin } from '../index.js';
import path from 'path';

/**
 * Official Ray plugin for React workflows with experimental React Server Components (RSC) support.
 */
export function reactPlugin(options: any = {}): RayPlugin {
  return {
    name: '@ray/plugin-react',

    async transform(code, id) {
      if (id.includes('node_modules')) return null;
      const ext = path.extname(id);
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return null;

      let finalCode = code;

      // Handle experimental RSC boundary detection if enabled
      if (options.rsc?.enabled) {
        try {
          const { RSCCompiler } = require('@ray/react-server');
          const rscResult = RSCCompiler.compile(finalCode, id, options.rsc);
          finalCode = rscResult.code;
        } catch {
          // Fallback if @ray/react-server is not installed
        }
      }

      // Detect PascalCase functions or constant definitions (react component candidates)
      const componentNames: string[] = [];
      const funcRegex = /function\s+([A-Z][a-zA-Z0-9_]*)\b/g;
      let m;
      while ((m = funcRegex.exec(finalCode)) !== null) {
        componentNames.push(m[1]);
      }
      const constRegex = /const\s+([A-Z][a-zA-Z0-9_]*)\b/g;
      while ((m = constRegex.exec(finalCode)) !== null) {
        componentNames.push(m[1]);
      }

      const uniqueNames = Array.from(new Set(componentNames));
      if (uniqueNames.length === 0) return { code: finalCode };

      // Set self-acceptance on dependency node
      if (this.projectRoot && this.graph) {
        const relativeUrl = '/' + path.relative(this.projectRoot, id).replace(/\\/g, '/');
        const node = this.graph.registerModule(id, id, relativeUrl);
        node.isSelfAccepting = true;
      }

      // Rewrite const declarations to let so that components can be proxy-rebound
      for (const name of uniqueNames) {
        const constPattern = new RegExp(`\\bconst\\s+(${name})\\b`, 'g');
        finalCode = finalCode.replace(constPattern, 'let $1');
      }

      // Generate Proxy registrations
      let proxyInjections = `\n/* Ray React HMR Component Proxies */\n`;
      for (const name of uniqueNames) {
        proxyInjections += `if (typeof ${name} !== 'undefined') {\n  ${name} = window.__ray_register_component(new URL(import.meta.url).pathname, '${name}', ${name});\n}\n`;
      }

      // Injects hot acceptance checks
      const hmrAcceptance = `
if (import.meta.hot) {
  import.meta.hot.accept();
}
`;

      finalCode = finalCode + '\n' + proxyInjections + '\n' + hmrAcceptance;
      return { code: finalCode };
    },
  };
}
