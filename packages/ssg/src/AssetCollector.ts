export class AssetCollector {
  private assets = new Set<string>();

  addAsset(assetPath: string): void {
    this.assets.add(assetPath);
  }

  getAssets(): string[] {
    return Array.from(this.assets);
  }
}
