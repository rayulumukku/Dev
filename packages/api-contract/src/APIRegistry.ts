import { APIManifest } from './types.js';

export class APIRegistry {
  private static manifests = new Map<string, APIManifest>();

  static register(manifest: APIManifest): void {
    this.manifests.set(manifest.packageName, manifest);
  }

  static get(packageName: string): APIManifest | undefined {
    return this.manifests.get(packageName);
  }

  static getAll(): APIManifest[] {
    return Array.from(this.manifests.values());
  }

  static clear(): void {
    this.manifests.clear();
  }
}
