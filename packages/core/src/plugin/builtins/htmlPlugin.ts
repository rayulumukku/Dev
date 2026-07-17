import { RayPlugin, PluginContext } from '../index.js';
import path from 'path';

/**
 * Builtin plugin for compiling HTML entry files, parsing linked stylesheets,
 * and injecting the browser HMR client runtime script tag.
 */
export function htmlPlugin(): RayPlugin {
  return {
    name: 'ray:html',

    async transform(this: PluginContext, code, id) {
      if (!id.endsWith('.html')) return null;

      // 1. Scan and register linked stylesheets in the dependency graph
      const linkRegex = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
      let match;
      const depPaths = new Set<string>();

      while ((match = linkRegex.exec(code)) !== null) {
        let href = match[1];
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
          continue; // Skip external stylesheets
        }
        if (href.startsWith('/')) {
          href = href.slice(1);
        }
        const resolvedPath = path.resolve(this.projectRoot, href);
        depPaths.add(resolvedPath);
      }

      this.graph.registerModule(id, id, '/' + path.relative(this.projectRoot, id).replace(/\\/g, '/'));
      this.graph.updateDependencies(id, depPaths, (depId: string) => {
        const url = '/' + path.relative(this.projectRoot, depId).replace(/\\/g, '/');
        return { file: depId, url };
      });

      // 2. Inject HMR script tag if building or serving in development mode
      let finalHtml = code;
      if (this.buildMode === 'development') {
        // Strip any existing hardcoded HMR tags first to avoid duplicates
        finalHtml = finalHtml.replace(/<script\s+[^>]*src=["']\/@ray\/hmr\.js["'][^>]*><\/script>/gi, '');

        if (finalHtml.includes('<head>')) {
          finalHtml = finalHtml.replace('<head>', '<head>\n  <script type="module" src="/@ray/hmr.js"></script>');
        } else if (finalHtml.includes('<body>')) {
          finalHtml = finalHtml.replace('<body>', '<body>\n  <script type="module" src="/@ray/hmr.js"></script>');
        } else if (finalHtml.includes('</body>')) {
          finalHtml = finalHtml.replace('</body>', '  <script type="module" src="/@ray/hmr.js"></script>\n</body>');
        } else {
          finalHtml = '<script type="module" src="/@ray/hmr.js"></script>\n' + finalHtml;
        }
      }

      return { code: finalHtml };
    },
  };
}
