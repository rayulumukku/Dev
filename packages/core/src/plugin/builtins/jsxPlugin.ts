import { RayPlugin } from '../index.js';
import { transformJsx } from '@ray/transform';
import path from 'path';
import { Lexer, Parser, ASTVisitor, CodeGenerator } from '../../compiler/index.js';

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

export function jsxPlugin(): RayPlugin {
  return {
    name: 'ray:jsx',
    async transform(code: any, id: string) {
      if (!['.js', '.jsx', '.ts', '.tsx'].some(ext => id.endsWith(ext))) {
        return null;
      }

      // Check config setting
      const configCompiler = (globalThis as any).__ray_cache_store?.config?.compiler || 'auto';

      let ast = (code && typeof code === 'object' && code.type) ? code : null;
      const rawCode = ast ? code.toString() : code;

      // 1. Process JSX compilation
      let jsCode = '';
      if (configCompiler === 'ray') {
        const compiler = new (await import('../../compiler/index.js')).RayCompiler((globalThis as any).__ray_cache_store?.env || {});
        const res = compiler.compile(rawCode, id);
        jsCode = res.code;
        // Parse the generated code to continue AST transforms
        const parser = new Parser(new Lexer(jsCode).tokenize());
        ast = parser.parse();
      } else {
        // Auto mode or default: always use RayCompiler
        try {
          const compiler = new (await import('../../compiler/index.js')).RayCompiler(
            (globalThis as any).__ray_cache_store?.env || {}
          );
          const res = compiler.compile(rawCode, id);
          jsCode = res.code;
          const parser = new Parser(new Lexer(jsCode).tokenize());
          ast = parser.parse();
        } catch (err: any) {
          // Parse error → fall through with raw JS, transformJsx handles remaining cases
          jsCode = await transformJsx(rawCode, id);
          return { code: jsCode };
        }
      }

      // 2. Rewrite imports/exports using AST Visitor instead of MagicString
      const depIds = new Set<string>();
      const visitor = new ASTVisitor({
        ImportDeclaration: (node: any) => {
          const specifier = node.source.value;
          if (specifier) {
            let rewrittenSpecifier = specifier;
            try {
              const pluginResolved = specifier.startsWith('\0virtual:') ? specifier : null;
              let resolvedPath = pluginResolved !== null ? pluginResolved : resolve(specifier, id, this.resolver, this.projectRoot);
              depIds.add(resolvedPath);

              if (resolvedPath.startsWith('\0virtual:')) {
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
                const isJsLoader = ['.mdx', '.md', '.wasm', '.json'].includes(path.extname(resolvedPath).toLowerCase());
                if (isCss || isAsset || isJsLoader) {
                  rewrittenSpecifier += '?import';
                }
              }
            } catch (err: any) {
              this.logger.error(`[Ray JSX Plugin] Resolving error for "${specifier}" in "${id}": ${err.message}`);
            }

            node.source.value = rewrittenSpecifier;
            node.source.raw = JSON.stringify(rewrittenSpecifier);
          }
          return node;
        }
      });

      // Bind resolveId context to visitor callbacks
      (visitor as any).resolveId = this.resolveId.bind(this);
      (visitor as any).resolver = this.resolver;
      (visitor as any).projectRoot = this.projectRoot;
      (visitor as any).logger = this.logger;

      await visitor.traverse(ast);

      // 3. Register module and update graph links
      const relativeUrl = '/' + path.relative(this.projectRoot, id).replace(/\\/g, '/');
      const graphNode = this.graph.registerModule(id, id, relativeUrl);
      graphNode.lastTransformTime = Date.now();

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

      return ast;
    },
  };
}
