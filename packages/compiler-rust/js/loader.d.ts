export interface RustNativeBackend {
    scanDirectory?: (dir: string) => string[];
    hashContent?: (content: string) => string;
    serializeMetadata?: (data: any) => string;
    computeCacheKey?: (input: any) => string;
}
export declare function loadRustNativeBackend(): RustNativeBackend | null;
export declare function isRustAccelerationActive(): boolean;
//# sourceMappingURL=loader.d.ts.map