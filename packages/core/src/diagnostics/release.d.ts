interface ReleaseOptions {
    version: string;
    dryRun?: boolean;
    skipPerf?: boolean;
}
export declare function runRelease(projectRoot: string, options: ReleaseOptions): Promise<void>;
export {};
//# sourceMappingURL=release.d.ts.map