export class AssetCollector {
  constructor() {
    this.assets = new Set();
  }

  addAsset(assetPath) {
    this.assets.add(assetPath);
  }

  getAssets() {
    return Array.from(this.assets);
  }
}
