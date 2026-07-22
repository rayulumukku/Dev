import { RayPlugin, PluginContext } from './index.js';
export declare class PluginContainer {
    plugins: RayPlugin[];
    context: PluginContext;
    /** Active execution time accumulator per plugin (in ms) */
    metrics: Map<string, number>;
    /** Mapped hooks per plugin name */
    hooksMap: Map<string, string[]>;
    /** Map tracking intermediate compile stages code by filename key */
    transformStages: Map<string, Array<{
        pluginName: string;
        code: string;
    }>>;
    constructor(plugins: RayPlugin[], context: PluginContext);
    private getPluginContext;
    private runHook;
    resolveId(source: string, importer?: string | null): Promise<string | null>;
    load(id: string): Promise<string | null>;
    transform(code: string, id: string): Promise<{
        code: string;
        map?: any;
    }>;
    handleHotUpdate(ctx: {
        file: string;
        timestamp: number;
    }): Promise<void>;
    buildStart(): Promise<void>;
    buildEnd(): Promise<void>;
    generateBundle(bundle: any): Promise<void>;
    closeBundle(): Promise<void>;
}
//# sourceMappingURL=container.d.ts.map