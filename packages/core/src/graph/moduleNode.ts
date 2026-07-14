/**
 * Represents a single module in the dependency graph.
 */
export class ModuleNode {
  /** Unique module identifier (typically its absolute file path on disk) */
  id: string;
  /** Absolute file path on disk */
  file: string;
  /** Served URL path in the browser (e.g. /src/App.jsx or /@modules/react) */
  url: string;
  /** Modules that this module imports */
  dependencies = new Set<ModuleNode>();
  /** Modules that import this module */
  importers = new Set<ModuleNode>();
  /** Timestamp of the last time this module was compiled/transformed */
  lastTransformTime = 0;
  /** Tracks whether the module accepts its own updates (HMR boundary) */
  isSelfAccepting = false;

  constructor(id: string, file: string, url: string) {
    this.id = id;
    this.file = file;
    this.url = url;
  }
}
