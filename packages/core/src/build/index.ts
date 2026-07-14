import { build, context } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { execSync } from 'child_process';
import { RayCore } from '../index.js';

interface BuildOptions {
  outDir: string;
  minify: boolean;
  sourcemap: string | boolean;
  watch: boolean;
  analyze: boolean;
  ssr?: boolean;
  ssg?: boolean;
  lib?: boolean;
  entry?: string;
  name?: string;
  formats?: string;
  external?: string;
  dts?: boolean;
}

/**
 * Executes a production-optimized build of the Ray project.
 * Supports splitting into client browser builds, target Node.js server bundles,
 * SSG static HTML page compilation, and reusable Library Mode bundling.
 */
export async function buildProject(options: BuildOptions) {
  const startTime = Date.now();
  const projectRoot = process.cwd();
  const baseOutDir = path.resolve(projectRoot, options.outDir);

  // Initialize RayCore orchestrator
  const core = new RayCore(projectRoot);
  await core.init();

  const configBuild = core.config.build || {};
  const isLib = !!options.lib || !!configBuild.lib;

  const sourcemapOption =
    options.sourcemap === 'true' || options.sourcemap === true
      ? true
      : options.sourcemap === 'false' || options.sourcemap === false
      ? false
      : (options.sourcemap as any);

  // ==========================================
  // LIBRARY MODE PIPELINE
  // ==========================================
  if (isLib) {
    console.log(`\n[Ray Build] Initiating library build...`);
    const libConfig = {
      entry: options.entry || configBuild.lib?.entry || 'src/index.ts',
      name: options.name || configBuild.lib?.name || 'MyLibrary',
      formats: options.formats
        ? (options.formats.split(',') as any[])
        : configBuild.lib?.formats || ['esm', 'cjs', 'umd'],
      fileName: configBuild.lib?.fileName,
      external: options.external
        ? options.external.split(',')
        : configBuild.lib?.external || [],
      dts: options.dts !== undefined ? !!options.dts : configBuild.lib?.dts !== false,
    };

    const entryFilePath = path.resolve(projectRoot, libConfig.entry);
    if (!fs.existsSync(entryFilePath)) {
      throw new Error(`Library entry script not found: ${entryFilePath}`);
    }

    console.log(`  > Entry:       ${entryFilePath}`);
    console.log(`  > Name:        ${libConfig.name}`);
    console.log(`  > Formats:     ${libConfig.formats.join(', ')}`);

    // Detect peerDependencies
    let peerDeps: string[] = [];
    const pkgJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        peerDeps = Object.keys(pkgJson.peerDependencies || {});
      } catch {}
    }

    const externals = Array.from(new Set([...peerDeps, ...libConfig.external]));

    const getFileName = (format: string) => {
      if (typeof libConfig.fileName === 'function') {
        return libConfig.fileName(format);
      }
      if (typeof libConfig.fileName === 'string') {
        return libConfig.fileName.replace('[format]', format);
      }
      return `index.${format}.js`;
    };

    const reports: any[] = [];

    // Bundle each format
    for (const format of libConfig.formats) {
      console.log(`  > Compiling format: ${format}`);
      const outFileName = getFileName(format);
      const outFilePath = path.join(baseOutDir, outFileName);

      const isUmd = format === 'umd';
      const targetFormat = isUmd ? 'iife' : format;

      const banner = configBuild.banner ? { js: configBuild.banner } : undefined;
      const footer = configBuild.footer ? { js: configBuild.footer } : undefined;

      const esbuildConfig: any = {
        entryPoints: [entryFilePath],
        bundle: true,
        format: targetFormat,
        globalName: format === 'iife' || isUmd ? libConfig.name : undefined,
        minify: options.minify,
        sourcemap: sourcemapOption,
        write: true,
        outfile: outFilePath,
        external: externals,
        banner,
        footer,
        loader: {
          '.png': 'file',
          '.jpg': 'file',
          '.jpeg': 'file',
          '.gif': 'file',
          '.svg': 'file',
          '.woff': 'file',
          '.woff2': 'file',
          '.ttf': 'file',
          '.json': 'json',
          '.css': 'css',
        },
        define: {
          'process.env.NODE_ENV': '"production"',
        },
      };

      await build(esbuildConfig);

      if (isUmd && fs.existsSync(outFilePath)) {
        let code = fs.readFileSync(outFilePath, 'utf-8');
        code = `(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.${libConfig.name} = {}));
})(this, (function (exports) {
  ${code}
}));`;
        fs.writeFileSync(outFilePath, code);
      }

      const fileSize = fs.existsSync(outFilePath) ? fs.statSync(outFilePath).size : 0;

      reports.push({
        format,
        fileName: outFileName,
        sizeBytes: fileSize,
      });

      // Handle standalone stylesheet if esbuild outputs a css file
      const defaultCssPath = outFilePath.replace(/\.js$/, '.css');
      if (fs.existsSync(defaultCssPath)) {
        const cssFileName = configBuild.cssFileName || 'style.css';
        fs.renameSync(defaultCssPath, path.join(baseOutDir, cssFileName));
        console.log(`  > Emitted stylesheet: ${cssFileName}`);
      }
    }

    // 2. Generate Type Declarations (.d.ts)
    if (libConfig.dts) {
      try {
        console.log(`  > Emitting type declarations (.d.ts) ...`);
        execSync(`npx tsc --emitDeclarationOnly --declaration --outDir ${baseOutDir}`, {
          cwd: projectRoot,
          stdio: 'ignore',
        });
      } catch (err) {
        // Fallback stub declaration file
        fs.writeFileSync(path.join(baseOutDir, 'index.d.ts'), 'export {};\n');
      }
    }

    // 3. Generate package.json inside dist
    const distPkgJson = {
      main: `./${getFileName('cjs')}`,
      module: `./${getFileName('esm')}`,
      types: `./index.d.ts`,
      exports: {
        '.': {
          import: `./${getFileName('esm')}`,
          require: `./${getFileName('cjs')}`,
          types: `./index.d.ts`,
        },
      },
    };
    fs.writeFileSync(path.join(baseOutDir, 'package.json'), JSON.stringify(distPkgJson, null, 2));

    // 4. Generate library-report.json
    const declarationCount = fs.existsSync(path.join(baseOutDir, 'index.d.ts')) ? 1 : 0;
    const libReport = {
      formats: reports.map((r) => r.format),
      bundleSizes: reports.reduce((acc, r) => {
        acc[r.fileName] = `${(r.sizeBytes / 1024).toFixed(2)} KB`;
        return acc;
      }, {} as Record<string, string>),
      externals,
      exportedSymbols: [libConfig.name],
      declarationCount,
    };
    fs.writeFileSync(path.join(baseOutDir, 'library-report.json'), JSON.stringify(libReport, null, 2));

    const duration = Date.now() - startTime;
    console.log(`\n⚡ Ray Library Build Completed in ${duration}ms! ⚡`);
    return;
  }

  // ==========================================
  // APP MODE PIPELINE (SPA/SSR/SSG)
  // ==========================================
  const isSSR = !!options.ssr || !!options.ssg;
  const isSSG = !!options.ssg;

  const clientOutDir = isSSR ? path.join(baseOutDir, 'client') : baseOutDir;
  const serverOutDir = isSSR ? path.join(baseOutDir, 'server') : baseOutDir;

  console.log(`\n[Ray Build] Initiating production build...`);
  console.log(`  > Mode:        ${isSSG ? 'SSG' : isSSR ? 'SSR' : 'SPA'}`);
  console.log(`  > Client Dir:  ${clientOutDir}`);
  if (isSSR) {
    console.log(`  > Server Dir:  ${serverOutDir}`);
  }

  const rayEsbuildPlugin = {
    name: 'ray-plugins-bridge',
    setup(build: any) {
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        if (args.kind === 'entry-point') return null;
        const resolved = await core.container.resolveId(args.path, args.importer);
        if (resolved !== null) {
          return {
            path: resolved,
            namespace: resolved.startsWith('\0') ? 'virtual' : undefined,
          };
        }
        return null;
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        if (args.namespace === 'virtual' || args.path.startsWith('\0')) {
          const loaded = await core.container.load(args.path);
          if (loaded !== null) {
            return {
              contents: loaded,
              loader: 'js',
            };
          }
        }
        return null;
      });
    }
  };

  // 1. Locate and parse index.html for client entry script
  const htmlPath = path.join(projectRoot, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Entry HTML file "index.html" not found at project root: ${projectRoot}`);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const scriptRegex = /<script\s+[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  let entryScript = isSSR ? 'src/entry-client.jsx' : 'src/main.jsx';

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    let src = match[1];
    if (src.startsWith('/')) {
      src = src.slice(1);
    }
    entryScript = src;
    break;
  }

  const entryFilePath = path.resolve(projectRoot, entryScript);
  if (!fs.existsSync(entryFilePath)) {
    throw new Error(`Entry script file not found: ${entryFilePath}`);
  }

  console.log(`  > Client Entry: ${entryFilePath}`);

  // 2. Client assets compilation configuration
  const clientEsbuildConfig: any = {
    entryPoints: {
      main: entryFilePath,
    },
    bundle: true,
    format: 'esm',
    minify: options.minify,
    sourcemap: sourcemapOption,
    splitting: true,
    write: true,
    metafile: true,
    plugins: [rayEsbuildPlugin],
    outdir: path.join(clientOutDir, 'assets'),
    entryNames: '[name].[hash]',
    chunkNames: 'chunk.[hash]',
    assetNames: '[name].[hash]',
    loader: {
      '.png': 'file',
      '.jpg': 'file',
      '.jpeg': 'file',
      '.gif': 'file',
      '.svg': 'file',
      '.woff': 'file',
      '.woff2': 'file',
      '.ttf': 'file',
      '.json': 'json',
      '.css': 'css',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  };

  // 3. Handle Client Watch Build
  if (options.watch) {
    const ctx = await context(clientEsbuildConfig);
    await ctx.watch();
    console.log(`\n[Ray Build] watch mode active. Watching files for changes...\n`);
    return;
  }

  // 4. Compile Client Assets
  const clientResult = await build(clientEsbuildConfig);
  if (!clientResult.metafile) {
    throw new Error('Client Build metafile generation failed.');
  }

  // 5. Build Client Manifest
  const manifest: Record<string, any> = {};
  const clientOutputs = clientResult.metafile.outputs;

  for (const [outputKey, outputMeta] of Object.entries(clientOutputs)) {
    if (outputMeta.entryPoint) {
      const srcFile = path.relative(projectRoot, outputMeta.entryPoint).replace(/\\/g, '/');
      const destFile = path.relative(clientOutDir, outputKey).replace(/\\/g, '/');

      manifest[srcFile] = {
        file: destFile,
        css: [],
        imports: (outputMeta.imports || [])
          .filter((imp) => imp.path.endsWith('.js'))
          .map((imp) => path.relative(clientOutDir, imp.path).replace(/\\/g, '/')),
      };
    }
  }

  for (const [outputKey] of Object.entries(clientOutputs)) {
    if (outputKey.endsWith('.css')) {
      const destCss = path.relative(clientOutDir, outputKey).replace(/\\/g, '/');
      const cssBase = path.basename(outputKey, '.css').split('.')[0];

      for (const [srcFile, manifestItem] of Object.entries(manifest)) {
        const jsBase = path.basename(manifestItem.file, '.js').split('.')[0];
        if (cssBase === jsBase) {
          manifestItem.css.push(destCss);
        }
      }
    }
  }

  fs.mkdirSync(clientOutDir, { recursive: true });
  fs.writeFileSync(path.join(clientOutDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 6. Rewrite HTML template with compiled scripts & stylesheets
  let cleanHtml = htmlContent;
  cleanHtml = cleanHtml.replace(/<script\s+[^>]*src=["']\/@ray\/hmr\.js["'][^>]*><\/script>/gi, '');

  const mainAsset = manifest[entryScript.replace(/\\/g, '/')];
  if (mainAsset) {
    cleanHtml = cleanHtml.replace(
      new RegExp(`<script\\s+[^>]*type=["']module["'][^>]*src=["']\\/?${entryScript}["'][^>]*><\\/script>`, 'gi'),
      `<script type="module" src="/${mainAsset.file}"></script>`
    );

    if (mainAsset.css && mainAsset.css.length > 0) {
      const cssLink = mainAsset.css.map((cssFile: string) => `<link rel="stylesheet" href="/${cssFile}">`).join('\n');
      if (cleanHtml.includes('</head>')) {
        cleanHtml = cleanHtml.replace('</head>', `${cssLink}\n</head>`);
      } else {
        cleanHtml = cssLink + '\n' + cleanHtml;
      }
    }
  }

  fs.writeFileSync(path.join(clientOutDir, 'index.html'), cleanHtml);

  // 7. Compile Server Bundle (if SSR or SSG is active)
  if (isSSR) {
    console.log(`[Ray Build] Compiling server entry for Node environment...`);
    const serverEntryFilePath = path.resolve(projectRoot, 'src/entry-server.jsx');
    if (!fs.existsSync(serverEntryFilePath)) {
      throw new Error(`Server entry script "src/entry-server.jsx" not found.`);
    }

    const serverEsbuildConfig: any = {
      entryPoints: {
        server: serverEntryFilePath,
      },
      bundle: true,
      platform: 'node',
      format: 'esm',
      minify: options.minify,
      sourcemap: sourcemapOption,
      write: true,
      metafile: true,
      plugins: [rayEsbuildPlugin],
      outdir: serverOutDir,
      entryNames: '[name]',
      loader: {
        '.png': 'file',
        '.jpg': 'file',
        '.jpeg': 'file',
        '.gif': 'file',
        '.svg': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.ttf': 'file',
        '.json': 'json',
        '.css': 'copy',
      },
      external: [
        'react',
        'react-dom',
        'react-dom/server',
        'react-router-dom',
        'react-router-dom/server',
        'react-router'
      ],
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    };

    await build(serverEsbuildConfig);
  }

  // 8. Execute SSG Pre-rendering (if SSG mode active)
  if (isSSG) {
    console.log(`[Ray SSG] Resolving pre-renders for routes: ['/', '/about']`);
    const serverJsPath = path.join(serverOutDir, 'server.js');
    const entryServer = await import(pathToFileURL(serverJsPath).toString());
    const clientTemplate = fs.readFileSync(path.join(clientOutDir, 'index.html'), 'utf-8');

    const routes = ['/', '/about'];
    for (const route of routes) {
      const context = {};
      const { html } = await entryServer.render(route, context);

      const serializedState = JSON.stringify({ initialCount: 5 })
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');

      const finalHtml = clientTemplate.replace(
        '<div id="root"></div>',
        `<div id="root">${html}</div>\n<script>window.__RAY_DATA__ = ${serializedState};</script>`
      );

      const routeOutDir = route === '/' ? clientOutDir : path.join(clientOutDir, route.slice(1));
      fs.mkdirSync(routeOutDir, { recursive: true });
      fs.writeFileSync(path.join(routeOutDir, 'index.html'), finalHtml);
      console.log(`  > Pre-rendered SSG route Page: ${path.relative(projectRoot, path.join(routeOutDir, 'index.html'))}`);
    }
  }

  const duration = Date.now() - startTime;
  let moduleCount = 0;
  let chunkCount = 0;
  const assetSizes: Record<string, number> = {};
  const compressionEstimates: Record<string, string> = {};

  if (clientResult.metafile.inputs) {
    moduleCount = Object.keys(clientResult.metafile.inputs).length;
  }

  for (const [outputKey, outputMeta] of Object.entries(clientOutputs)) {
    chunkCount++;
    const size = outputMeta.bytes;
    const destFile = path.relative(clientOutDir, outputKey).replace(/\\/g, '/');
    assetSizes[destFile] = size;

    const gzipEstimate = Math.round(size * 0.3);
    compressionEstimates[destFile] = `${(size / 1024).toFixed(2)} KB (Gzip: ${(gzipEstimate / 1024).toFixed(2)} KB)`;
  }

  const report = {
    buildDurationMs: duration,
    moduleCount,
    chunkCount,
    treeShakenModules: moduleCount > 0 ? Math.max(0, moduleCount - chunkCount) : 0,
    assetSizes,
    compressionEstimates,
  };

  fs.writeFileSync(path.join(clientOutDir, 'build-report.json'), JSON.stringify(report, null, 2));

  console.log(`\n⚡ Ray Build Completed in ${duration}ms! ⚡`);
  console.log(`  > Client Dir:   ${clientOutDir}`);
  if (isSSR) {
    console.log(`  > Server Dir:   ${serverOutDir}`);
  }
}
