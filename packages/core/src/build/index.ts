import { build, context } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { RayCore } from '../index.js';

interface BuildOptions {
  outDir: string;
  minify: boolean;
  sourcemap: string | boolean;
  watch: boolean;
  analyze: boolean;
  ssr?: boolean;
  ssg?: boolean;
}

/**
 * Executes a production-optimized build of the Ray project.
 * Supports splitting into client browser builds, target Node.js server bundles,
 * and SSG static HTML page compilation.
 */
export async function buildProject(options: BuildOptions) {
  const startTime = Date.now();
  const projectRoot = process.cwd();
  const baseOutDir = path.resolve(projectRoot, options.outDir);

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

  // Initialize RayCore to access the dynamic plugins container
  const core = new RayCore(projectRoot);
  await core.init();

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

  const sourcemapOption =
    options.sourcemap === 'true' || options.sourcemap === true
      ? true
      : options.sourcemap === 'false' || options.sourcemap === false
      ? false
      : (options.sourcemap as any);

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
