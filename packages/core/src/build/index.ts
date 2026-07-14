import { build, context } from 'esbuild';
import fs from 'fs';
import path from 'path';

interface BuildOptions {
  outDir: string;
  minify: boolean;
  sourcemap: string | boolean;
  watch: boolean;
  analyze: boolean;
}

/**
 * Executes a production-optimized build of the Ray project.
 * Bundles code using esbuild, applies tree shaking, minification, code splitting,
 * extracts CSS, hashes assets, injects hashed bundles into index.html,
 * and outputs build manifests and reports.
 */
export async function buildProject(options: BuildOptions) {
  const startTime = Date.now();
  const projectRoot = process.cwd();
  const outDir = path.resolve(projectRoot, options.outDir);

  console.log(`\n[Ray Build] Initiating production build...`);
  console.log(`  > Source Root: ${projectRoot}`);
  console.log(`  > Output Dir:  ${outDir}`);

  // 1. Locate and parse index.html for entry scripts
  const htmlPath = path.join(projectRoot, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Entry HTML file "index.html" not found at project root: ${projectRoot}`);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const scriptRegex = /<script\s+[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  let entryScript = 'src/main.jsx'; // fallback

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    let src = match[1];
    // Strip leading slash if present to resolve relative to root
    if (src.startsWith('/')) {
      src = src.slice(1);
    }
    entryScript = src;
    break; // Use the first module script found as entry point
  }

  const entryFilePath = path.resolve(projectRoot, entryScript);
  if (!fs.existsSync(entryFilePath)) {
    throw new Error(`Entry script file not found: ${entryFilePath}`);
  }

  console.log(`  > Entry Point: ${entryFilePath}`);

  // 2. Configure esbuild compilation
  const sourcemapOption =
    options.sourcemap === 'true' || options.sourcemap === true
      ? true
      : options.sourcemap === 'false' || options.sourcemap === false
      ? false
      : (options.sourcemap as any);

  const esbuildConfig: any = {
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
    outdir: path.join(outDir, 'assets'),
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

  // 3. Run Watch or Standard build mode
  if (options.watch) {
    const ctx = await context(esbuildConfig);
    await ctx.watch();
    console.log(`\n[Ray Build] watch mode active. Watching files for changes...\n`);
    return;
  }

  const result = await build(esbuildConfig);
  const duration = Date.now() - startTime;

  if (!result.metafile) {
    throw new Error('Build metafile generation failed.');
  }

  // 4. Generate build manifest.json
  const manifest: Record<string, any> = {};
  const outputs = result.metafile.outputs;

  for (const [outputKey, outputMeta] of Object.entries(outputs)) {
    if (outputMeta.entryPoint) {
      // Convert path relative to project root
      const srcFile = path.relative(projectRoot, outputMeta.entryPoint).replace(/\\/g, '/');
      const destFile = path.relative(outDir, outputKey).replace(/\\/g, '/');

      manifest[srcFile] = {
        file: destFile,
        css: [],
        imports: (outputMeta.imports || [])
          .filter((imp) => imp.path.endsWith('.js'))
          .map((imp) => path.relative(outDir, imp.path).replace(/\\/g, '/')),
      };
    }
  }

  // Associate extracted CSS styles back to the manifest entry point chunks
  for (const [outputKey] of Object.entries(outputs)) {
    if (outputKey.endsWith('.css')) {
      const destCss = path.relative(outDir, outputKey).replace(/\\/g, '/');
      const cssBase = path.basename(outputKey, '.css').split('.')[0];

      for (const [srcFile, manifestItem] of Object.entries(manifest)) {
        const jsBase = path.basename(manifestItem.file, '.js').split('.')[0];
        if (cssBase === jsBase) {
          manifestItem.css.push(destCss);
        }
      }
    }
  }

  // Write manifest.json
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 5. Generate build-report.json
  let moduleCount = 0;
  let chunkCount = 0;
  const assetSizes: Record<string, number> = {};
  const compressionEstimates: Record<string, string> = {};

  if (result.metafile.inputs) {
    moduleCount = Object.keys(result.metafile.inputs).length;
  }

  for (const [outputKey, outputMeta] of Object.entries(outputs)) {
    chunkCount++;
    const size = outputMeta.bytes;
    const destFile = path.relative(outDir, outputKey).replace(/\\/g, '/');
    assetSizes[destFile] = size;

    // Estimate Gzip compression (approx 30% of raw bundle size)
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

  fs.writeFileSync(path.join(outDir, 'build-report.json'), JSON.stringify(report, null, 2));

  // 6. Static HTML Generation
  let cleanHtml = htmlContent;

  // Remove development script injections
  cleanHtml = cleanHtml.replace(/<script\s+[^>]*src=["']\/@ray\/hmr\.js["'][^>]*><\/script>/gi, '');

  const mainAsset = manifest[entryScript.replace(/\\/g, '/')];
  if (mainAsset) {
    // Replace development scripts with hashed production script tag
    cleanHtml = cleanHtml.replace(
      new RegExp(`<script\\s+[^>]*type=["']module["'][^>]*src=["']\\/?${entryScript}["'][^>]*><\\/script>`, 'gi'),
      `<script type="module" src="/${mainAsset.file}"></script>`
    );

    // Inject extracted hashed stylesheets
    if (mainAsset.css && mainAsset.css.length > 0) {
      const cssLink = mainAsset.css.map((cssFile: string) => `<link rel="stylesheet" href="/${cssFile}">`).join('\n');
      if (cleanHtml.includes('</head>')) {
        cleanHtml = cleanHtml.replace('</head>', `${cssLink}\n</head>`);
      } else {
        cleanHtml = cssLink + '\n' + cleanHtml;
      }
    }
  }

  fs.writeFileSync(path.join(outDir, 'index.html'), cleanHtml);

  console.log(`\n⚡ Ray Build Succeeded in ${duration}ms! ⚡`);
  console.log(`  > Built Directory: ${outDir}`);
  console.log(`  > Modules Count:   ${moduleCount}`);
  console.log(`  > Assets Count:    ${chunkCount}`);

  // 7. Bundle Analyzer CLI output
  if (options.analyze) {
    console.log('\n📊 Ray Bundle Analysis Report 📊');
    console.log('=========================================================');
    console.log(`Largest Source Modules:`);
    const inputs = result.metafile.inputs;
    const inputList = Object.entries(inputs)
      .map(([key, value]) => ({ path: key, size: value.bytes }))
      .sort((a, b) => b.size - a.size);

    for (const input of inputList.slice(0, 10)) {
      console.log(`  - ${input.path}: ${(input.size / 1024).toFixed(2)} KB`);
    }

    console.log('\nProduced Chunk Sizes:');
    for (const [outputKey, outputMeta] of Object.entries(outputs)) {
      const destFile = path.relative(outDir, outputKey).replace(/\\/g, '/');
      console.log(`  - ${destFile}: ${(outputMeta.bytes / 1024).toFixed(2)} KB`);
    }
    console.log('=========================================================\n');
  }
}
