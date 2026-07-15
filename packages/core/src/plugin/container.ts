import { RayPlugin, PluginContext } from './index.js';
import { Lexer, Parser, CodeGenerator } from '../compiler/index.js';

function createASTStringProxy(ast: any, originalCode: string) {
  return new Proxy(ast, {
    get(target: any, prop: string | symbol) {
      if (prop === '__isProxy') return true;
      if (prop === '__rawString') return originalCode;
      if (prop === 'toString' || prop === 'valueOf' || prop === Symbol.toPrimitive) {
        return () => originalCode;
      }
      if (prop in target) {
        return target[prop];
      }
      if (typeof prop === 'string' && typeof (originalCode as any)[prop] === 'function') {
        return (...args: any[]) => {
          return (originalCode as any)[prop](...args);
        };
      }
      return undefined;
    }
  });
}

export class PluginContainer {
  plugins: RayPlugin[] = [];
  context: PluginContext;
  /** Active execution time accumulator per plugin (in ms) */
  metrics: Map<string, number> = new Map();
  /** Mapped hooks per plugin name */
  hooksMap: Map<string, string[]> = new Map();
  /** Map tracking intermediate compile stages code by filename key */
  transformStages: Map<string, Array<{ pluginName: string; code: string }>> = new Map();

  constructor(plugins: RayPlugin[], context: PluginContext) {
    const pre = plugins.filter((p) => p.enforce === 'pre');
    const normal = plugins.filter((p) => !p.enforce);
    const post = plugins.filter((p) => p.enforce === 'post');
    this.plugins = [...pre, ...normal, ...post];
    this.context = context;

    for (const plugin of this.plugins) {
      const hooks: string[] = [];
      const keys = Object.keys(plugin) as Array<keyof RayPlugin>;
      for (const k of keys) {
        if (k !== 'name' && k !== 'enforce' && typeof (plugin as any)[k] === 'function') {
          hooks.push(k);
        }
      }
      this.hooksMap.set(plugin.name, hooks);
      this.metrics.set(plugin.name, 0);
    }
  }

  private getPluginContext(plugin: RayPlugin): PluginContext {
    return {
      ...this.context,
      resolveId: async (source, importer) => {
        return this.resolveId(source, importer || undefined);
      },
      load: async (id) => {
        return this.load(id);
      },
      logger: {
        info: (msg) => console.log(`[Plugin: ${plugin.name}] ${msg}`),
        warn: (msg) => console.warn(`[Plugin: ${plugin.name}] ${msg}`),
        error: (msg) => console.error(`[Plugin: ${plugin.name}] ${msg}`),
      },
    };
  }

  private async runHook<T>(
    plugin: RayPlugin,
    hookName: keyof RayPlugin,
    runner: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      return await runner();
    } finally {
      const duration = performance.now() - start;
      const prev = this.metrics.get(plugin.name) || 0;
      this.metrics.set(plugin.name, prev + duration);
    }
  }

  async resolveId(source: string, importer?: string): Promise<string | null> {
    for (const plugin of this.plugins) {
      if (plugin.resolveId) {
        const resolved = await this.runHook(plugin, 'resolveId', () =>
          plugin.resolveId!.call(this.getPluginContext(plugin), source, importer || null)
        );
        if (resolved !== null) {
          return resolved;
        }
      }
    }
    return null;
  }

  async load(id: string): Promise<string | null> {
    for (const plugin of this.plugins) {
      if (plugin.load) {
        const loaded = await this.runHook(plugin, 'load', () =>
          plugin.load!.call(this.getPluginContext(plugin), id)
        );
        if (loaded !== null) {
          return loaded;
        }
      }
    }
    return null;
  }

  async transform(code: string, id: string): Promise<{ code: string; map?: any }> {
    let currentCode = code;
    let currentMap = undefined;

    const stages: Array<{ pluginName: string; code: string }> = [
      { pluginName: 'Source', code: currentCode }
    ];
    this.transformStages.set(id, stages);

    // Initial parsing to AST
    let currentAst: any = null;
    if (['.js', '.jsx', '.ts', '.tsx'].some(ext => id.endsWith(ext))) {
      try {
        const lexer = new Lexer(currentCode);
        const parser = new Parser(lexer.tokenize());
        currentAst = parser.parse();
      } catch {
        // Fallback if syntax error
      }
    }

    for (const plugin of this.plugins) {
      if (plugin.transform) {
        // Wrap input in proxy to support both AST and string backward compatibility
        const input = currentAst ? createASTStringProxy(currentAst, currentCode) : currentCode;
        const result = await this.runHook(plugin, 'transform', () =>
          plugin.transform!.call(this.getPluginContext(plugin), input, id)
        );

        if (result !== null && result !== undefined) {
          let resolvedResult = result;
          if (result && result.__isProxy) {
            resolvedResult = result.__rawString;
          } else if (result && result.code && result.code.__isProxy) {
            resolvedResult = { ...result, code: result.code.__rawString };
          }

          if (typeof resolvedResult === 'string') {
            currentCode = resolvedResult;
            currentAst = null;
          } else if (resolvedResult && typeof resolvedResult === 'object' && resolvedResult.type) {
            currentAst = resolvedResult;
            currentCode = new CodeGenerator().generate(currentAst);
          } else {
            currentCode = resolvedResult.code;
            if (resolvedResult.map) currentMap = resolvedResult.map;
            currentAst = null;
          }

          // If currentAst was invalidated, re-parse from currentCode
          if (!currentAst && ['.js', '.jsx', '.ts', '.tsx'].some(ext => id.endsWith(ext))) {
            try {
              const lexer = new Lexer(currentCode);
              const parser = new Parser(lexer.tokenize());
              currentAst = parser.parse();
            } catch {}
          }

          stages.push({ pluginName: plugin.name, code: currentCode });
        }
      }
    }

    // Generate final code and source maps from AST if available
    if (currentAst) {
      const codegen = new CodeGenerator();
      const res = codegen.generateWithSourceMap(currentAst, id);
      currentCode = res.code;
      currentMap = res.map;
    }

    return { code: currentCode, map: currentMap };
  }

  async handleHotUpdate(ctx: { file: string; timestamp: number }): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.handleHotUpdate) {
        await this.runHook(plugin, 'handleHotUpdate', () =>
          plugin.handleHotUpdate!.call(this.getPluginContext(plugin), ctx)
        );
      }
    }
  }

  async buildStart(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.buildStart) {
        await this.runHook(plugin, 'buildStart', () =>
          plugin.buildStart!.call(this.getPluginContext(plugin))
        );
      }
    }
  }

  async buildEnd(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.buildEnd) {
        await this.runHook(plugin, 'buildEnd', () =>
          plugin.buildEnd!.call(this.getPluginContext(plugin))
        );
      }
    }
  }

  async generateBundle(bundle: any): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.generateBundle) {
        await this.runHook(plugin, 'generateBundle', () =>
          plugin.generateBundle!.call(this.getPluginContext(plugin), bundle)
        );
      }
    }
  }

  async closeBundle(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.closeBundle) {
        await this.runHook(plugin, 'closeBundle', () =>
          plugin.closeBundle!.call(this.getPluginContext(plugin))
        );
      }
    }
  }
}
