import { BuildManifest } from './types.js';
import fs from 'fs';
import path from 'path';

export class ArtifactStore {
  private baseDir: string;

  constructor(projectRoot: string, cacheDirName = '.ray/incremental') {
    this.baseDir = path.resolve(projectRoot, cacheDirName);
  }

  getManifestPath(): string {
    return path.join(this.baseDir, 'manifest.json');
  }

  loadManifest(): BuildManifest | null {
    const manifestPath = this.getManifestPath();
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    try {
      const text = fs.readFileSync(manifestPath, 'utf-8');
      return JSON.parse(text) as BuildManifest;
    } catch {
      return null;
    }
  }

  saveManifest(manifest: BuildManifest): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    fs.writeFileSync(this.getManifestPath(), JSON.stringify(manifest, null, 2), 'utf-8');
  }

  saveArtifact(fileName: string, content: string | Buffer): void {
    const artifactsDir = path.join(this.baseDir, 'artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(artifactsDir, fileName), content);
  }

  getArtifact(fileName: string): Buffer | null {
    const filePath = path.join(this.baseDir, 'artifacts', fileName);
    if (!fs.existsSync(filePath)) return null;
    try {
      return fs.readFileSync(filePath);
    } catch {
      return null;
    }
  }

  clear(): void {
    if (fs.existsSync(this.baseDir)) {
      fs.rmSync(this.baseDir, { recursive: true, force: true });
    }
  }
}
