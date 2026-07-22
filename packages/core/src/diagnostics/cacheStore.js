import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
export class CompilerCacheStore {
    projectRoot;
    cacheFilePath;
    cacheData;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.cacheFilePath = path.join(projectRoot, '.ray/cache/compiler.json');
        this.reset();
    }
    reset() {
        this.cacheData = {
            globalHash: '',
            entriesCount: 0,
            hitCount: 0,
            missCount: 0,
            invalidationCount: 0,
            reusedCount: 0,
            files: {},
            pluginCache: {}
        };
    }
    computeHash(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    computeGlobalHash(envMode, config) {
        const hash = crypto.createHash('sha256');
        hash.update(envMode);
        // Hash package.json dependencies
        const pkgJsonPath = path.join(this.projectRoot, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
            hash.update(fs.readFileSync(pkgJsonPath));
        }
        // Hash tsconfig.json / ray.config.ts
        const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
        if (fs.existsSync(tsconfigPath)) {
            hash.update(fs.readFileSync(tsconfigPath));
        }
        const rayConfigPath = path.join(this.projectRoot, 'ray.config.ts');
        if (fs.existsSync(rayConfigPath)) {
            hash.update(fs.readFileSync(rayConfigPath));
        }
        hash.update(JSON.stringify(config.define || {}));
        return hash.digest('hex');
    }
    load(globalHash) {
        if (!fs.existsSync(this.cacheFilePath)) {
            this.reset();
            this.cacheData.globalHash = globalHash;
            return;
        }
        try {
            const raw = fs.readFileSync(this.cacheFilePath, 'utf-8');
            if (!raw || raw.trim() === '') {
                throw new Error('Cache file is empty.');
            }
            const data = JSON.parse(raw);
            if (data.globalHash !== globalHash) {
                console.log('[Ray Cache] Global configurations mismatch. Invalidating old cache.');
                this.reset();
                this.cacheData.globalHash = globalHash;
                this.cacheData.invalidationCount += 1;
            }
            else {
                this.cacheData = data;
                console.log(`[Ray Cache] Loaded compiler cache: ${Object.keys(data.files).length} files recovered.`);
            }
        }
        catch (err) {
            console.warn(`[Ray Cache Warning] Persistent cache corrupted, discarding safely: ${err.message}`);
            this.reset();
            this.cacheData.globalHash = globalHash;
        }
    }
    save() {
        try {
            const dir = path.dirname(this.cacheFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            this.cacheData.entriesCount = Object.keys(this.cacheData.files).length;
            fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.cacheData, null, 2) + '\n');
        }
        catch (err) {
            console.error('[Ray Cache Error] Failed to serialize persistent cache:', err.message);
        }
    }
    get(file, contentHash) {
        const entry = this.cacheData.files[file];
        if (entry && entry.hash === contentHash) {
            this.cacheData.hitCount += 1;
            this.cacheData.reusedCount += 1;
            return entry;
        }
        this.cacheData.missCount += 1;
        return null;
    }
    set(file, contentHash, data) {
        this.cacheData.files[file] = {
            hash: contentHash,
            code: data.code,
            map: data.map,
            ast: data.ast,
            deps: data.deps,
            importers: data.importers,
            isSelfAccepting: data.isSelfAccepting
        };
    }
    getPluginCache(pluginName) {
        if (!this.cacheData.pluginCache[pluginName]) {
            this.cacheData.pluginCache[pluginName] = {};
        }
        return this.cacheData.pluginCache[pluginName];
    }
    clear() {
        this.reset();
        if (fs.existsSync(this.cacheFilePath)) {
            try {
                fs.unlinkSync(this.cacheFilePath);
            }
            catch { }
        }
    }
    verify() {
        if (!fs.existsSync(this.cacheFilePath))
            return true;
        try {
            const raw = fs.readFileSync(this.cacheFilePath, 'utf-8');
            JSON.parse(raw);
            return true;
        }
        catch {
            return false;
        }
    }
    getDiagnostics() {
        let sizeMB = 0;
        try {
            if (fs.existsSync(this.cacheFilePath)) {
                sizeMB = Number((fs.statSync(this.cacheFilePath).size / (1024 * 1024)).toFixed(2));
            }
        }
        catch { }
        const totalRequests = this.cacheData.hitCount + this.cacheData.missCount;
        const hitRate = totalRequests > 0 ? Number(((this.cacheData.hitCount / totalRequests) * 100).toFixed(1)) : 100.0;
        return {
            entries: Object.keys(this.cacheData.files).length,
            sizeMB,
            hitRate,
            invalidations: this.cacheData.invalidationCount,
            reusedTransforms: this.cacheData.reusedCount
        };
    }
}
//# sourceMappingURL=cacheStore.js.map