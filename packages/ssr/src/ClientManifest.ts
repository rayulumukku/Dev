import { SSRManifest } from './types.js';

export class ClientManifestBuilder {
  private manifest: SSRManifest = {};

  addModuleMapping(moduleId: string, chunkPaths: string[]): void {
    this.manifest[moduleId] = chunkPaths;
  }

  getManifest(): SSRManifest {
    return this.manifest;
  }

  toJSON(): string {
    return JSON.stringify(this.manifest, null, 2);
  }
}
