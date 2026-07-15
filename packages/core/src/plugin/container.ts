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
      resolveId: async (source: string, importer?: string) => {
        return this.resolveId(source, importer || undefined);
      },
      load: async (id: string) => {
        return this.load(id);
      },
      logger: {
        ...console,
        info: (msg: any) => console.log(`[Plugin: ${plugin.name}] ${msg}`),
        warn: (msg: any) => console.warn(`[Plugin: ${plugin.name}] ${msg}`),
        error: (msg: any) => console.error(`[Plugin: ${plugin.name}] ${msg}`),
      } as any as Console,
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

  async resolveId(source: string, importer?: string | null): Promise<string | null> {
    for (const plugin of this.plugins) {
      if (plugin.resolveId) {
        const resolved = await this.runHook(plugin, 'resolveId', async () => {
          const res = plugin.resolveId!.call(this.getPluginContext(plugin), source, importer || undefined);
          return Promise.resolve(res);
        });
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
        const loaded = await this.runHook(plugin, 'load', async () => {
          const res = plugin.load!.call(this.getPluginContext(plugin), id);
          return Promise.resolve(res);
        });
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
        const result = await this.runHook(plugin, 'transform', async () => {
          const res = plugin.transform!.call(this.getPluginContext(plugin), input, id);
          return Promise.resolve(res);
        });

        if (result !== null && result !== undefined) {
          let resolvedResult: any = result;
          const resObj = result as any;
          if (resObj.__isProxy) {
            resolvedResult = resObj.__rawString;
          } else if (resObj.code && resObj.code.__isProxy) {
            resolvedResult = { ...resObj, code: resObj.code.__rawString };
          }

          if (typeof resolvedResult === 'string') {
            currentCode = resolvedResult;
            currentAst = null;
          } else if (resolvedResult && typeof resolvedResult === 'object' && (resolvedResult as any).type) {
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
        await this.runHook(plugin, 'handleHotUpdate', async () => {
          const res = plugin.handleHotUpdate!.call(this.getPluginContext(plugin), ctx);
          return Promise.resolve(res);
        });
      }
    }
  }

  async buildStart(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.buildStart) {
        await this.runHook(plugin, 'buildStart', async () => {
          const res = plugin.buildStart!.call(this.getPluginContext(plugin));
          return Promise.resolve(res);
        });
      }
    }
  }

  async buildEnd(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.buildEnd) {
        await this.runHook(plugin, 'buildEnd', async () => {
          const res = plugin.buildEnd!.call(this.getPluginContext(plugin));
          return Promise.resolve(res);
        });
      }
    }
  }

  async generateBundle(bundle: any): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.generateBundle) {
        await this.runHook(plugin, 'generateBundle', async () => {
          const res = plugin.generateBundle!.call(this.getPluginContext(plugin), bundle);
          return Promise.resolve(res);
        });
      }
    }
  }

  async closeBundle(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.closeBundle) {
        await this.runHook(plugin, 'closeBundle', async () => {
          const res = plugin.closeBundle!.call(this.getPluginContext(plugin));
          return Promise.resolve(res);
        });
      }
    }
  }
}
