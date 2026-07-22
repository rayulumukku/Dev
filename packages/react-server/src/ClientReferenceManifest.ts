import { ClientReference, ClientReferenceManifest } from './types.js';

export class ClientReferenceManifestManager {
  private manifest: ClientReferenceManifest = {};

  registerClientReference(moduleId: string, exportName: string, chunkId: string): ClientReference {
    if (!this.manifest[moduleId]) {
      this.manifest[moduleId] = {};
    }

    const ref: ClientReference = {
      id: `${moduleId}#${exportName}`,
      name: exportName,
      chunks: [chunkId],
      async: true,
    };

    this.manifest[moduleId][exportName] = ref;
    return ref;
  }

  getManifest(): ClientReferenceManifest {
    return this.manifest;
  }

  toJSON(): string {
    return JSON.stringify(this.manifest, null, 2);
  }
}
