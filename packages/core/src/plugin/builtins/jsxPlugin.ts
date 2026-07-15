import { RayPlugin, PluginContext } from '../index.js';
import { transformJsx } from '@ray/transform';
import { init, parse } from 'es-module-lexer';
import MagicString from 'magic-string';
import path from 'path';

function resolve(specifier: string, importer: string, resolver: any, projectRoot: string): string {
  if (specifier.startsWith('.') || specifier.startsWith('..')) {
    return path.resolve(path.dirname(importer), specifier);
  }
  if (specifier.startsWith('/')) {
    if (specifier.startsWith('/@modules/')) {
      const bareSpec = specifier.slice('/@modules/'.length);
      return resolver.resolveBarePackage(bareSpec, projectRoot);
    }
    return path.join(projectRoot, specifier.slice(1));
  }
  return resolver.resolveBarePackage(specifier, path.dirname(importer));
}

/**
 * Builtin plugin for compiling JSX/TSX/TS files, rewriting import/export specifiers,
 * and wrapping components in HMR proxies.
 */
export function jsxPlugin(): RayPlugin {
  return {
    name: 'ray:jsx',

    async transform(this: PluginContext, code, id) {
      const ext = path.extname(id);
      const isJsxOrTs = ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
      if (!isJsxOrTs) return null;

      await init;

      // 1. Compile JSX/TS
      let jsCode = code;
      const isTransformable = ['.jsx', '.tsx', '.ts'].includes(ext);
      if (isTransformable) {
        const configCompiler = (globalThis as any).__ray_config_compiler || 'auto';
        let compiledResult = null;

        if (configCompiler === 'ray' || configCompiler === 'auto') {
          try {
            const { RayCompiler } = await import('../../compiler/index.js');
            const compiler = new RayCompiler((globalThis as any).__ray_cache_store?.env || {});
            const res = compiler.compile(code, id);
            compiledResult = res.code;

            // Record compiler stats
            if (!(globalThis as any).__ray_compiler_stats) {
              (globalThis as any).__ray_compiler_stats = {
                backend: 'ray',
                astNodes: 0,
                parseTimeMs: 0,
                transformTimeMs: 0,
                emitTimeMs: 0
              };
            }
            const stats = (globalThis as any).__ray_compiler_stats;
            stats.backend = 'ray';
            stats.astNodes += res.astNodesCount;
            stats.parseTimeMs += res.parseTimeMs;
            stats.transformTimeMs += res.transformTimeMs;
            stats.emitTimeMs += res.emitTimeMs;
          } catch (err: any) {
            if (configCompiler === 'ray') {
              throw err;
            }
            console.warn(`[Ray Compiler] Compilation failed for ${id}, falling back to esbuild compatibility mode:`, err.message);
          }
        }

        if (compiledResult !== null) {
          jsCode = compiledResult;
        } else {
          jsCode = await transformJsx(code, id);
          if (!(globalThis as any).__ray_compiler_stats) {
            (globalThis as any).__ray_compiler_stats = {
              backend: 'esbuild',
              astNodes: 0,
              parseTimeMs: 0,
              transformTimeMs: 0,
              emitTimeMs: 0
            };
          }
          (globalThis as any).__ray_compiler_stats.backend = 'esbuild';
        }
      }

      // 2. Parse and rewrite imports/exports
      const [imports] = parse(jsCode);
      const s = new MagicString(jsCode);
      const depIds = new Set<string>();

      for (const imp of imports) {
        const specifier = imp.n;
        if (specifier) {
          let rewrittenSpecifier = specifier;
          try {
            // First check if any plugin resolveId hook resolves the specifier (e.g., virtual modules)
            const pluginResolved = await this.resolveId(specifier, id);
            let resolvedPath = '';

            if (pluginResolved !== null) {
              resolvedPath = pluginResolved;
            } else {
              resolvedPath = resolve(specifier, id, this.resolver, this.projectRoot);
            }

            depIds.add(resolvedPath);

            if (resolvedPath.startsWith('\0virtual:')) {
              // Rewrite virtual modules to virtual namespaces served by dev-server
              const virtName = resolvedPath.slice('\0virtual:'.length);
              rewrittenSpecifier = `/@virtual/${virtName}?import`;
            } else if (resolvedPath.includes('node_modules')) {
              const idx = resolvedPath.indexOf('node_modules');
              const rel = resolvedPath.slice(idx + 'node_modules/'.length).replace(/\\/g, '/');
              rewrittenSpecifier = `/@modules/${rel}`;
            } else {
              const rel = path.relative(this.projectRoot, resolvedPath).replace(/\\/g, '/');
              rewrittenSpecifier = '/' + rel;
              const isCss = path.extname(resolvedPath) === '.css';
              const isAsset = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(path.extname(resolvedPath).toLowerCase());
              if (isCss || isAsset) {
                rewrittenSpecifier += '?import';
              }
            }
          } catch (err: any) {
            this.logger.error(`[Ray JSX Plugin] Resolving error for "${specifier}" in "${id}": ${err.message}`);
          }

          s.overwrite(imp.s, imp.e, rewrittenSpecifier);
        }
      }

      const rewrittenCode = s.toString();

      // 3. Register module and update graph links
      const relativeUrl = '/' + path.relative(this.projectRoot, id).replace(/\\/g, '/');
      const node = this.graph.registerModule(id, id, relativeUrl);
      node.lastTransformTime = Date.now();

      // Helper to update dependencies inside context
      this.graph.updateDependencies(id, depIds, (depId: string) => {
        let depUrl = '';
        if (depId.includes('\0virtual:')) {
          const virtName = depId.slice('\0virtual:'.length);
          depUrl = `/@virtual/${virtName}?import`;
        } else if (depId.includes('node_modules')) {
          const idx = depId.indexOf('node_modules');
          const rel = depId.slice(idx + 'node_modules/'.length).replace(/\\/g, '/');
          depUrl = `/@modules/${rel}`;
        } else {
          depUrl = '/' + path.relative(this.projectRoot, depId).replace(/\\/g, '/');
        }
        return { file: depId, url: depUrl };
      });

      return { code: rewrittenCode };
    },
  };
}
