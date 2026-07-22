import crypto from 'crypto';
import fs from 'fs';

export class ChangeDetector {
  computeFileHash(filePath: string, content?: string): string {
    const hasher = crypto.createHash('sha256');
    hasher.update(filePath);

    if (content !== undefined) {
      hasher.update(content);
    } else if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      hasher.update(fileBuffer);
    }

    return hasher.digest('hex');
  }

  computeContentHash(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  computeConfigHash(config: any): string {
    const hasher = crypto.createHash('sha256');
    hasher.update(JSON.stringify(config || {}));
    return hasher.digest('hex');
  }

  computeEnvHash(env: Record<string, string>): string {
    const hasher = crypto.createHash('sha256');
    hasher.update(JSON.stringify(env || {}));
    return hasher.digest('hex');
  }

  computePluginsHash(plugins: any[]): string {
    const hasher = crypto.createHash('sha256');
    const pluginNames = (plugins || []).map(p => p.name || 'anonymous');
    hasher.update(JSON.stringify(pluginNames));
    return hasher.digest('hex');
  }
}
