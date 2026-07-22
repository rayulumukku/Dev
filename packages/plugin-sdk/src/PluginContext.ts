import { SDKPluginContext, SDKLogger } from './types.js';
import { createLogger } from './Logger.js';

export function createPluginContext(pluginName: string, projectRoot = process.cwd(), buildMode: 'development' | 'production' = 'production'): SDKPluginContext {
  const logger = createLogger(pluginName);
  const cacheMap = new Map<string, any>();

  return {
    projectRoot,
    buildMode,
    logger,
    emitFile: (name: string, content: string | Buffer) => {
      logger.info(`Emitted file: ${name}`);
    },
    addWatchFile: (file: string) => {
      logger.debug(`Watch file added: ${file}`);
    },
    resolveId: async (id: string, importer?: string) => {
      return id;
    },
    load: async (id: string) => {
      return null;
    },
    cache: {
      get: (key: string) => cacheMap.get(key),
      set: (key: string, val: any) => cacheMap.set(key, val),
      invalidate: (key: string) => cacheMap.delete(key),
    },
  };
}
