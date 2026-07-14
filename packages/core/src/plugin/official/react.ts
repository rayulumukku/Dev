import { RayPlugin } from '../index.js';
import path from 'path';

/**
 * Official Ray plugin for React workflows.
 * Extracts React component states, wraps PascalCase components in HMR proxies,
 * overrides react-dom/client createRoot context, and triggers stateful updates.
 */
export function reactPlugin(): RayPlugin {
  return {
    name: '@ray/plugin-react',

    async transform(code, id) {
      if (id.includes('node_modules')) return null;
      const ext = path.extname(id);
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return null;

      let finalCode = code;

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
      if (uniqueNames.length === 0) return null;

      // Set self-acceptance on dependency node
      const relativeUrl = '/' + path.relative(this.projectRoot, id).replace(/\\/g, '/');
      const node = this.graph.registerModule(id, id, relativeUrl);
      node.isSelfAccepting = true;

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

      // Intercept and wrap react-dom/client createRoot
      let createRootWrapper = '';
      if (finalCode.includes('/@modules/react-dom/client') || finalCode.includes('react-dom/client')) {
        finalCode = finalCode.replace(
          /import\s*\{\s*createRoot\s*\}\s*from\s*["']\/@modules\/react-dom\/client["']/g,
          'import { createRoot as _createRoot } from "/@modules/react-dom/client"'
        ).replace(
          /import\s*\{\s*createRoot\s*\}\s*from\s*["']react-dom\/client["']/g,
          'import { createRoot as _createRoot } from "react-dom/client"'
        );

        createRootWrapper = `
const createRoot = (container, options) => {
  const root = _createRoot(container, options);
  window.__ray_active_roots.add(root);
  return {
    render(element) {
      window.__ray_root_components.set(root, element);
      root.render(element);
    },
    unmount() {
      window.__ray_active_roots.delete(root);
      window.__ray_root_components.delete(root);
      root.unmount();
    }
  };
};
`;
      }

      finalCode = createRootWrapper + '\n' + finalCode + '\n' + proxyInjections + '\n' + hmrAcceptance;
      return { code: finalCode };
    },
  };
}
