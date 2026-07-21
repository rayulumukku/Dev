import { describe, it, expect } from 'vitest';
import {
  translateViteConfig,
  generateRayConfigString,
  generateMigrationReport
} from '../../packages/migrate/src/index.js';

describe('Vite to Ray Configuration Translator Snapshot Tests', () => {
  it('should translate small Vite config correctly', () => {
    const smallConfig = {
      root: './src',
      base: '/app/',
      publicDir: 'public',
      plugins: [{ name: 'vite-plugin-react' }]
    };

    const { rayConfig, ignoredFields, supportedFields } = translateViteConfig(smallConfig);
    const configStr = generateRayConfigString(rayConfig);
    const reportStr = generateMigrationReport('Vite', supportedFields, ignoredFields);

    expect(rayConfig).toMatchSnapshot();
    expect(configStr).toMatchSnapshot();
    expect(reportStr).toMatchSnapshot();
  });

  it('should translate medium Vite config with resolver and server correctly', () => {
    const mediumConfig = {
      root: '.',
      base: '/',
      server: {
        host: '0.0.0.0',
        port: 8080,
        open: true,
        proxy: {
          '/api': 'http://localhost:5000'
        }
      },
      resolve: {
        alias: {
          '@': './src'
        },
        dedupe: ['react']
      },
      optimizeDeps: {
        include: ['lodash']
      }
    };

    const { rayConfig, ignoredFields, supportedFields } = translateViteConfig(mediumConfig);
    const configStr = generateRayConfigString(rayConfig);
    const reportStr = generateMigrationReport('Vite', supportedFields, ignoredFields);

    expect(rayConfig).toMatchSnapshot();
    expect(configStr).toMatchSnapshot();
    expect(reportStr).toMatchSnapshot();
  });

  it('should translate alias-heavy Vite config correctly', () => {
    const aliasHeavyConfig = {
      resolve: {
        alias: {
          '@components': './src/components',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@assets': './src/assets'
        }
      }
    };

    const { rayConfig, ignoredFields, supportedFields } = translateViteConfig(aliasHeavyConfig);
    const configStr = generateRayConfigString(rayConfig);
    const reportStr = generateMigrationReport('Vite', supportedFields, ignoredFields);

    expect(rayConfig).toMatchSnapshot();
    expect(configStr).toMatchSnapshot();
    expect(reportStr).toMatchSnapshot();
  });

  it('should translate build-heavy Vite config correctly', () => {
    const buildHeavyConfig = {
      build: {
        outDir: 'build-output',
        assetsDir: 'static-assets',
        sourcemap: true,
        minify: false,
        target: 'es2015',
        cssMinify: true
      },
      define: {
        __VERSION__: '"1.2.3"'
      },
      envPrefix: 'VITE_'
    };

    const { rayConfig, ignoredFields, supportedFields } = translateViteConfig(buildHeavyConfig);
    const configStr = generateRayConfigString(rayConfig);
    const reportStr = generateMigrationReport('Vite', supportedFields, ignoredFields);

    expect(rayConfig).toMatchSnapshot();
    expect(configStr).toMatchSnapshot();
    expect(reportStr).toMatchSnapshot();
  });

  it('should translate empty config correctly', () => {
    const emptyConfig = {};

    const { rayConfig, ignoredFields, supportedFields } = translateViteConfig(emptyConfig);
    const configStr = generateRayConfigString(rayConfig);
    const reportStr = generateMigrationReport('Vite', supportedFields, ignoredFields);

    expect(rayConfig).toMatchSnapshot();
    expect(configStr).toMatchSnapshot();
    expect(reportStr).toMatchSnapshot();
  });
});
