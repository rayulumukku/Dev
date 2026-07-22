export declare class CompilerCacheStore {
    private projectRoot;
    private cacheFilePath;
    private cacheData;
    constructor(projectRoot: string);
    reset(): void;
    computeHash(content: string): string;
    computeGlobalHash(envMode: string, config: any): string;
    load(globalHash: string): void;
    save(): void;
    get(file: string, contentHash: string): {
        hash: string;
        code: string;
        map?: any;
        ast?: any;
        deps: string[];
        importers: string[];
        isSelfAccepting: boolean;
    } | null;
    set(file: string, contentHash: string, data: {
        code: string;
        map?: any;
        ast?: any;
        deps: string[];
        importers: string[];
        isSelfAccepting: boolean;
    }): void;
    getPluginCache(pluginName: string): Record<string, any>;
    clear(): void;
    verify(): boolean;
    getDiagnostics(): {
        entries: number;
        sizeMB: number;
        hitRate: number;
        invalidations: number;
        reusedTransforms: number;
    };
}
//# sourceMappingURL=cacheStore.d.ts.map