import { Lexer, Parser, CodeGenerator } from '../compiler/index.js';
function createASTStringProxy(ast, originalCode) {
    return new Proxy(ast, {
        get(target, prop) {
            if (prop === '__isProxy')
                return true;
            if (prop === '__rawString')
                return originalCode;
            if (prop === 'toString' || prop === 'valueOf' || prop === Symbol.toPrimitive) {
                return () => originalCode;
            }
            if (prop in target) {
                return target[prop];
            }
            if (typeof prop === 'string' && typeof originalCode[prop] === 'function') {
                return (...args) => {
                    return originalCode[prop](...args);
                };
            }
            return undefined;
        }
    });
}
export class PluginContainer {
    plugins = [];
    context;
    /** Active execution time accumulator per plugin (in ms) */
    metrics = new Map();
    /** Mapped hooks per plugin name */
    hooksMap = new Map();
    /** Map tracking intermediate compile stages code by filename key */
    transformStages = new Map();
    constructor(plugins, context) {
        const pre = plugins.filter((p) => p.enforce === 'pre');
        const normal = plugins.filter((p) => !p.enforce);
        const post = plugins.filter((p) => p.enforce === 'post');
        this.plugins = [...pre, ...normal, ...post];
        this.context = context;
        for (const plugin of this.plugins) {
            const hooks = [];
            const keys = Object.keys(plugin);
            for (const k of keys) {
                if (k !== 'name' && k !== 'enforce' && typeof plugin[k] === 'function') {
                    hooks.push(k);
                }
            }
            this.hooksMap.set(plugin.name, hooks);
            this.metrics.set(plugin.name, 0);
        }
    }
    getPluginContext(plugin) {
        return {
            ...this.context,
            resolveId: async (source, importer) => {
                return this.resolveId(source, importer || undefined);
            },
            load: async (id) => {
                return this.load(id);
            },
            logger: {
                ...console,
                info: (msg) => console.log(`[Plugin: ${plugin.name}] ${msg}`),
                warn: (msg) => console.warn(`[Plugin: ${plugin.name}] ${msg}`),
                error: (msg) => console.error(`[Plugin: ${plugin.name}] ${msg}`),
            },
        };
    }
    async runHook(plugin, hookName, runner) {
        const start = performance.now();
        try {
            return await runner();
        }
        finally {
            const duration = performance.now() - start;
            const prev = this.metrics.get(plugin.name) || 0;
            this.metrics.set(plugin.name, prev + duration);
        }
    }
    async resolveId(source, importer) {
        for (const plugin of this.plugins) {
            if (plugin.resolveId) {
                const resolved = await this.runHook(plugin, 'resolveId', async () => {
                    const res = plugin.resolveId.call(this.getPluginContext(plugin), source, importer || undefined);
                    return Promise.resolve(res);
                });
                if (resolved !== null) {
                    return resolved;
                }
            }
        }
        return null;
    }
    async load(id) {
        for (const plugin of this.plugins) {
            if (plugin.load) {
                const loaded = await this.runHook(plugin, 'load', async () => {
                    const res = plugin.load.call(this.getPluginContext(plugin), id);
                    return Promise.resolve(res);
                });
                if (loaded !== null) {
                    return loaded;
                }
            }
        }
        return null;
    }
    async transform(code, id) {
        let currentCode = code;
        let currentMap = undefined;
        const stages = [
            { pluginName: 'Source', code: currentCode }
        ];
        this.transformStages.set(id, stages);
        // Initial parsing to AST
        let currentAst = null;
        if (['.js', '.jsx', '.ts', '.tsx'].some(ext => id.endsWith(ext))) {
            try {
                const lexer = new Lexer(currentCode);
                const parser = new Parser(lexer.tokenize());
                currentAst = parser.parse();
            }
            catch {
                // Fallback if syntax error
            }
        }
        for (const plugin of this.plugins) {
            if (plugin.transform) {
                // Wrap input in proxy to support both AST and string backward compatibility
                const input = currentAst ? createASTStringProxy(currentAst, currentCode) : currentCode;
                const result = await this.runHook(plugin, 'transform', async () => {
                    const res = plugin.transform.call(this.getPluginContext(plugin), input, id);
                    return Promise.resolve(res);
                });
                if (result !== null && result !== undefined) {
                    let resolvedResult = result;
                    const resObj = result;
                    if (resObj.__isProxy) {
                        resolvedResult = resObj.__rawString;
                    }
                    else if (resObj.code && resObj.code.__isProxy) {
                        resolvedResult = { ...resObj, code: resObj.code.__rawString };
                    }
                    if (typeof resolvedResult === 'string') {
                        currentCode = resolvedResult;
                        currentAst = null;
                    }
                    else if (resolvedResult && typeof resolvedResult === 'object' && resolvedResult.type) {
                        currentAst = resolvedResult;
                        currentCode = new CodeGenerator().generate(currentAst);
                    }
                    else {
                        currentCode = resolvedResult.code;
                        if (resolvedResult.map)
                            currentMap = resolvedResult.map;
                        currentAst = null;
                    }
                    // If currentAst was invalidated, re-parse from currentCode
                    if (!currentAst && ['.js', '.jsx', '.ts', '.tsx'].some(ext => id.endsWith(ext))) {
                        try {
                            const lexer = new Lexer(currentCode);
                            const parser = new Parser(lexer.tokenize());
                            currentAst = parser.parse();
                        }
                        catch { }
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
    async handleHotUpdate(ctx) {
        for (const plugin of this.plugins) {
            if (plugin.handleHotUpdate) {
                await this.runHook(plugin, 'handleHotUpdate', async () => {
                    const res = plugin.handleHotUpdate.call(this.getPluginContext(plugin), ctx);
                    return Promise.resolve(res);
                });
            }
        }
    }
    async buildStart() {
        for (const plugin of this.plugins) {
            if (plugin.buildStart) {
                await this.runHook(plugin, 'buildStart', async () => {
                    const res = plugin.buildStart.call(this.getPluginContext(plugin));
                    return Promise.resolve(res);
                });
            }
        }
    }
    async buildEnd() {
        for (const plugin of this.plugins) {
            if (plugin.buildEnd) {
                await this.runHook(plugin, 'buildEnd', async () => {
                    const res = plugin.buildEnd.call(this.getPluginContext(plugin));
                    return Promise.resolve(res);
                });
            }
        }
    }
    async generateBundle(bundle) {
        for (const plugin of this.plugins) {
            if (plugin.generateBundle) {
                await this.runHook(plugin, 'generateBundle', async () => {
                    const res = plugin.generateBundle.call(this.getPluginContext(plugin), bundle);
                    return Promise.resolve(res);
                });
            }
        }
    }
    async closeBundle() {
        for (const plugin of this.plugins) {
            if (plugin.closeBundle) {
                await this.runHook(plugin, 'closeBundle', async () => {
                    const res = plugin.closeBundle.call(this.getPluginContext(plugin));
                    return Promise.resolve(res);
                });
            }
        }
    }
}
//# sourceMappingURL=container.js.map