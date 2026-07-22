import fs from 'fs';
import path from 'path';
export class DistributedBuildExecutor {
    ray;
    cloudClient;
    workerCount;
    constructor(ray, workerCount = 4) {
        this.ray = ray;
        this.cloudClient = ray.cloudClient;
        this.workerCount = workerCount;
    }
    async runRemoteBuild(files) {
        const start = performance.now();
        let cacheHits = 0;
        let uploadedCount = 0;
        console.log(`[Ray Cloud] Starting distributed remote build across ${this.workerCount} virtual workers...`);
        // Fingerprint configs
        const configHash = this.ray.cacheStore.computeGlobalHash(this.ray.mode, this.ray.config);
        const lockfileContent = this.tryReadLockfile();
        const compileTasks = files.map(async (file) => {
            if (!fs.existsSync(file))
                return;
            const content = fs.readFileSync(file, 'utf-8');
            // Compute CAS Key
            const key = this.cloudClient.computeCASKey(content, this.ray.config, lockfileContent, ['1.0.0']);
            // Check remote cache
            let outputCode = null;
            try {
                outputCode = this.cloudClient.downloadArtifact(key);
            }
            catch {
                // Ignore auth error in preview/uncertified runs
            }
            if (outputCode !== null) {
                // Cache Hit!
                cacheHits++;
                const node = this.ray.graph.registerModule(file, file, '/' + path.relative(this.ray.projectRoot, file).replace(/\\/g, '/'));
                node.status = 'clean';
                node.hash = this.ray.cacheStore.computeHash(content);
                node.cachedOutput = { code: outputCode };
                return;
            }
            // Cache Miss: Run compilation task
            const compiled = await this.ray.transform(content, file);
            // Upload task result to remote CAS
            try {
                const uploadSuccess = this.cloudClient.uploadArtifact(key, compiled);
                if (uploadSuccess)
                    uploadedCount++;
            }
            catch {
                // Ignore if unauthenticated
            }
        });
        // Execute in parallel
        await Promise.all(compileTasks);
        const durationMs = Number((performance.now() - start).toFixed(2));
        console.log(`[Ray Cloud] Distributed remote build finished. Compiled ${files.length} files. Hits: ${cacheHits}. Uploads: ${uploadedCount}.`);
        return {
            durationMs,
            totalFiles: files.length,
            cacheHits,
            workerCount: this.workerCount,
            uploadedCount
        };
    }
    tryReadLockfile() {
        const lockPaths = [
            path.join(this.ray.projectRoot, 'package-lock.json'),
            path.join(this.ray.projectRoot, 'yarn.lock'),
            path.join(this.ray.projectRoot, 'pnpm-lock.yaml')
        ];
        for (const p of lockPaths) {
            if (fs.existsSync(p)) {
                try {
                    return fs.readFileSync(p, 'utf-8');
                }
                catch { }
            }
        }
        return '';
    }
}
//# sourceMappingURL=remoteExecutor.js.map