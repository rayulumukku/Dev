import { RayCore } from '../index.js';
export interface RemoteBuildSummary {
    durationMs: number;
    totalFiles: number;
    cacheHits: number;
    workerCount: number;
    uploadedCount: number;
}
export declare class DistributedBuildExecutor {
    private ray;
    private cloudClient;
    private workerCount;
    constructor(ray: RayCore, workerCount?: number);
    runRemoteBuild(files: string[]): Promise<RemoteBuildSummary>;
    private tryReadLockfile;
}
//# sourceMappingURL=remoteExecutor.d.ts.map