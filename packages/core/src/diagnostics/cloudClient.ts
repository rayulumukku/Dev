import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface AuthConfig {
  token: string | null;
  org: string | null;
  project: string | null;
  email: string | null;
}

export class RayCloudClient {
  private projectRoot: string;
  private authPath: string;
  private syncQueuePath: string;
  private remoteStoragePath: string;
  private authState: AuthConfig;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.authPath = path.join(projectRoot, '.ray/config/auth.json');
    this.syncQueuePath = path.join(projectRoot, '.ray/cloud/sync-queue.json');
    this.remoteStoragePath = path.join(projectRoot, '.ray/remote-cloud-storage');
    this.authState = this.loadAuth();
  }

  private loadAuth(): AuthConfig {
    if (fs.existsSync(this.authPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.authPath, 'utf-8'));
      } catch {
        // Ignore
      }
    }
    return { token: null, org: null, project: null, email: null };
  }

  saveAuth(auth: Partial<AuthConfig>) {
    this.authState = { ...this.authState, ...auth };
    const dir = path.dirname(this.authPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.authPath, JSON.stringify(this.authState, null, 2) + '\n');
  }

  clearAuth() {
    this.authState = { token: null, org: null, project: null, email: null };
    if (fs.existsSync(this.authPath)) {
      try {
        fs.unlinkSync(this.authPath);
      } catch {}
    }
  }

  getAuth(): AuthConfig {
    return this.authState;
  }

  computeCASKey(source: string, config: any, lockfile: string, pluginVersions: string[]): string {
    const hash = crypto.createHash('sha256');
    hash.update(source);
    hash.update(JSON.stringify(config || {}));
    hash.update(lockfile || '');
    hash.update(pluginVersions.join(','));
    return hash.digest('hex');
  }

  /**
   * Sanitizes environment secrets from metadata files before upload
   */
  sanitizeMetadata(data: Record<string, any>): Record<string, any> {
    const serialized = JSON.stringify(data);
    const secretKeys = ['key', 'secret', 'password', 'token', 'apikey', 'auth'];
    
    // Recursive key sanitization
    const sanitizeObj = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeObj);

      const res: Record<string, any> = {};
      for (const k of Object.keys(obj)) {
        const lowerK = k.toLowerCase();
        if (secretKeys.some(s => lowerK.includes(s))) {
          res[k] = '[REDACTED_SECRET]';
        } else {
          res[k] = sanitizeObj(obj[k]);
        }
      }
      return res;
    };

    return sanitizeObj(data);
  }

  isOnline(): boolean {
    // Simulated connectivity status flag
    if ((globalThis as any).__ray_cloud_offline === true) {
      return false;
    }
    return true;
  }

  uploadArtifact(key: string, content: string | Buffer): boolean {
    if (!this.authState.token) {
      throw new Error('Not authenticated. Please run "ray login" first.');
    }

    if (!this.isOnline()) {
      console.log(`[Ray Cloud] Offline mode. Queuing upload for key: ${key}`);
      this.queueSyncTask({ key, content: content.toString(), type: 'upload' });
      return false;
    }

    // Write to mock remote CAS store
    try {
      const dest = path.join(this.remoteStoragePath, key);
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dest, content);
      return true;
    } catch (err: any) {
      console.error(`[Ray Cloud Upload Error] ${err.message}`);
      return false;
    }
  }

  downloadArtifact(key: string): string | null {
    if (!this.authState.token) {
      throw new Error('Not authenticated. Please run "ray login" first.');
    }

    if (!this.isOnline()) {
      console.log(`[Ray Cloud] Offline mode. Cannot fetch key: ${key}`);
      return null;
    }

    const src = path.join(this.remoteStoragePath, key);
    if (fs.existsSync(src)) {
      return fs.readFileSync(src, 'utf-8');
    }
    return null;
  }

  private queueSyncTask(task: { key: string; content: string; type: 'upload' }) {
    let queue: any[] = [];
    if (fs.existsSync(this.syncQueuePath)) {
      try {
        queue = JSON.parse(fs.readFileSync(this.syncQueuePath, 'utf-8'));
      } catch {}
    }
    queue.push(task);
    const dir = path.dirname(this.syncQueuePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.syncQueuePath, JSON.stringify(queue, null, 2) + '\n');
  }

  syncOfflineQueue(): number {
    if (!this.isOnline() || !fs.existsSync(this.syncQueuePath)) return 0;
    try {
      const queue: any[] = JSON.parse(fs.readFileSync(this.syncQueuePath, 'utf-8'));
      let syncedCount = 0;

      for (const task of queue) {
        if (task.type === 'upload') {
          const success = this.uploadArtifact(task.key, task.content);
          if (success) syncedCount++;
        }
      }

      fs.unlinkSync(this.syncQueuePath);
      return syncedCount;
    } catch {
      return 0;
    }
  }

  purgeRemoteCache() {
    if (fs.existsSync(this.remoteStoragePath)) {
      fs.rmSync(this.remoteStoragePath, { recursive: true, force: true });
    }
  }

  verifyRemoteCache(): { validCount: number; corruptedCount: number } {
    let validCount = 0;
    let corruptedCount = 0;
    if (fs.existsSync(this.remoteStoragePath)) {
      const files = fs.readdirSync(this.remoteStoragePath);
      for (const file of files) {
        const fullPath = path.join(this.remoteStoragePath, file);
        if (fs.statSync(fullPath).isFile()) {
          // Check if file name matches key format (SHA256 hex length)
          if (file.length === 64) {
            validCount++;
          } else {
            corruptedCount++;
          }
        }
      }
    }
    return { validCount, corruptedCount };
  }
}
