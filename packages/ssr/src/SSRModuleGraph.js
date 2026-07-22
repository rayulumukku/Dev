export class SSRModuleGraph {
  constructor() {
    this.invalidations = new Set();
  }

  invalidateModule(moduleId) {
    this.invalidations.add(moduleId);
  }

  isInvalidated(moduleId) {
    return this.invalidations.has(moduleId);
  }

  clear() {
    this.invalidations.clear();
  }
}
