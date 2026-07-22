export class ClientManifestBuilder {
  constructor() {
    this.manifest = {};
  }

  addModuleMapping(moduleId, chunkPaths) {
    this.manifest[moduleId] = chunkPaths;
  }

  getManifest() {
    return this.manifest;
  }

  toJSON() {
    return JSON.stringify(this.manifest, null, 2);
  }
}
