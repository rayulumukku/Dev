/**
 * Mock Rollup/Vite PluginContext adapter that delegates to Ray's own PluginContext.
 */
export class VitePluginContext {
  root: string;
  command: 'serve' | 'build';
  mode: string;
  
  private rayContext: any;

  constructor(rayContext: any, command: 'serve' | 'build') {
    this.rayContext = rayContext;
    this.root = rayContext.projectRoot;
    this.command = command;
    this.mode = rayContext.buildMode === 'production' ? 'production' : 'development';
  }

  // Exposed APIs

  async resolve(source: string, importer?: string, options?: any) {
    if (typeof this.rayContext.resolveId === 'function') {
      const res = await this.rayContext.resolveId(source, importer);
      if (!res) return null;
      return { id: res };
    }
    return null;
  }

  addWatchFile(file: string) {
    if (typeof this.rayContext.addWatchFile === 'function') {
      this.rayContext.addWatchFile(file);
    }
  }

  warn(message: string | Error, pos?: any) {
    const text = message instanceof Error ? message.message : String(message);
    if (this.rayContext.logger && typeof this.rayContext.logger.warn === 'function') {
      this.rayContext.logger.warn(`[Warning] ${text}`);
    } else {
      console.warn(`[Warning] ${text}`);
    }
  }

  error(message: string | Error, pos?: any): never {
    const err = message instanceof Error ? message : new Error(String(message));
    if (this.rayContext.logger && typeof this.rayContext.logger.error === 'function') {
      this.rayContext.logger.error(`[Error] ${err.message}`);
    } else {
      console.error(`[Error] ${err.message}`);
    }
    throw err;
  }

  // Not Yet Implemented stubs for standard Rollup/Vite context APIs

  parse(code: string, opts?: any) {
    throw new Error('parse is Not Yet Implemented');
  }

  emitFile(file: any) {
    throw new Error('emitFile is Not Yet Implemented');
  }

  getFileName(referenceId: string) {
    throw new Error('getFileName is Not Yet Implemented');
  }

  getModuleInfo(moduleId: string) {
    throw new Error('getModuleInfo is Not Yet Implemented');
  }

  getModuleIds() {
    throw new Error('getModuleIds is Not Yet Implemented');
  }

  load(options: any) {
    throw new Error('load is Not Yet Implemented');
  }
}
