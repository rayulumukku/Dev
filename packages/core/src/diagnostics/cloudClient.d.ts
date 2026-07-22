export interface AuthConfig {
    token: string | null;
    org: string | null;
    project: string | null;
    email: string | null;
}
export declare class RayCloudClient {
    private projectRoot;
    private authPath;
    private syncQueuePath;
    private remoteStoragePath;
    private authState;
    constructor(projectRoot: string);
    private loadAuth;
    saveAuth(auth: Partial<AuthConfig>): void;
    clearAuth(): void;
    getAuth(): AuthConfig;
    computeCASKey(source: string, config: any, lockfile: string, pluginVersions: string[]): string;
    /**
     * Sanitizes environment secrets from metadata files before upload
     */
    sanitizeMetadata(data: Record<string, any>): Record<string, any>;
    isOnline(): boolean;
    uploadArtifact(key: string, content: string | Buffer): boolean;
    downloadArtifact(key: string): string | null;
    private queueSyncTask;
    syncOfflineQueue(): number;
    purgeRemoteCache(): void;
    verifyRemoteCache(): {
        validCount: number;
        corruptedCount: number;
    };
}
//# sourceMappingURL=cloudClient.d.ts.map