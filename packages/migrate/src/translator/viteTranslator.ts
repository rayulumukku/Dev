import { RayConfig } from '../types.js';

export interface TranslationResult {
  rayConfig: RayConfig;
  ignoredFields: string[];
  supportedFields: string[];
}

/**
 * Translates a Vite configuration object to a normalized RayConfig structure,
 * tracking successfully mapped and ignored fields.
 */
export function translateViteConfig(viteConfig: Record<string, any>): TranslationResult {
  const rayConfig: RayConfig = {};
  const ignoredFields: string[] = [];
  const supportedFields: string[] = [];

  const topLevelKeys = Object.keys(viteConfig);

  for (const key of topLevelKeys) {
    if (key === 'root') {
      rayConfig.root = viteConfig.root;
      supportedFields.push('root');
    } else if (key === 'base') {
      rayConfig.base = viteConfig.base;
      supportedFields.push('base');
    } else if (key === 'publicDir') {
      rayConfig.publicDir = viteConfig.publicDir;
      supportedFields.push('publicDir');
    } else if (key === 'define') {
      rayConfig.define = viteConfig.define;
      supportedFields.push('define');
    } else if (key === 'envPrefix') {
      rayConfig.envPrefix = viteConfig.envPrefix;
      supportedFields.push('envPrefix');
    } else if (key === 'plugins') {
      rayConfig.plugins = viteConfig.plugins;
      supportedFields.push('plugins');
    } else if (key === 'resolve') {
      const resolveObj = viteConfig.resolve;
      if (resolveObj && typeof resolveObj === 'object') {
        const resolveConfig: any = {};
        for (const rKey of Object.keys(resolveObj)) {
          if (rKey === 'alias') {
            resolveConfig.alias = resolveObj.alias;
            supportedFields.push('resolve.alias');
          } else {
            ignoredFields.push(`resolve.${rKey}`);
          }
        }
        if (Object.keys(resolveConfig).length > 0) {
          rayConfig.resolve = resolveConfig;
        }
      } else {
        ignoredFields.push('resolve');
      }
    } else if (key === 'server') {
      const serverObj = viteConfig.server;
      if (serverObj && typeof serverObj === 'object') {
        const serverConfig: any = {};
        for (const sKey of Object.keys(serverObj)) {
          if (sKey === 'host') {
            serverConfig.host = serverObj.host;
            supportedFields.push('server.host');
          } else if (sKey === 'port') {
            serverConfig.port = serverObj.port;
            supportedFields.push('server.port');
          } else if (sKey === 'open') {
            serverConfig.open = serverObj.open;
            supportedFields.push('server.open');
          } else {
            ignoredFields.push(`server.${sKey}`);
          }
        }
        if (Object.keys(serverConfig).length > 0) {
          rayConfig.server = serverConfig;
        }
      } else {
        ignoredFields.push('server');
      }
    } else if (key === 'build') {
      const buildObj = viteConfig.build;
      if (buildObj && typeof buildObj === 'object') {
        const buildConfig: any = {};
        for (const bKey of Object.keys(buildObj)) {
          if (bKey === 'outDir') {
            buildConfig.outDir = buildObj.outDir;
            supportedFields.push('build.outDir');
          } else if (bKey === 'assetsDir') {
            buildConfig.assetsDir = buildObj.assetsDir;
            supportedFields.push('build.assetsDir');
          } else if (bKey === 'sourcemap') {
            buildConfig.sourcemap = buildObj.sourcemap;
            supportedFields.push('build.sourcemap');
          } else if (bKey === 'minify') {
            buildConfig.minify = buildObj.minify;
            supportedFields.push('build.minify');
          } else {
            ignoredFields.push(`build.${bKey}`);
          }
        }
        if (Object.keys(buildConfig).length > 0) {
          rayConfig.build = buildConfig;
        }
      } else {
        ignoredFields.push('build');
      }
    } else {
      ignoredFields.push(key);
    }
  }

  return { rayConfig, ignoredFields, supportedFields };
}
