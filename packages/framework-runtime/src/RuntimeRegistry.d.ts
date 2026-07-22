import { FrameworkAdapter } from './types.js';
export declare class RuntimeRegistry {
    private static adapters;
    static registerAdapter(adapter: FrameworkAdapter): void;
    static getAdapter(name: string): FrameworkAdapter | undefined;
    static getAdapters(): FrameworkAdapter[];
    static resolveActiveAdapters(id?: string): FrameworkAdapter[];
    static clear(): void;
}
//# sourceMappingURL=RuntimeRegistry.d.ts.map