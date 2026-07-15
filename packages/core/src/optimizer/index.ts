import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import { Resolver } from '../resolver/index.js';
import { init, parse } from 'es-module-lexer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let workerPath = path.join(__dirname, 'worker.js');
if (!fs.existsSync(workerPath)) {
  workerPath = path.join(__dirname, '../../dist/optimizer/worker.js');
}

interface OptimizerOptions {
  force?: boolean;
  clear?: boolean;
}

interface OptimizerResult {
  optimized: Record<string, string>;
  cacheHits: number;
  cacheMisses: number;
  optimizationTimeMs: number;
  scanTimeMs: number;
  coldStart: boolean;
}

export class OptimizerGraph {
  nodes: Map<string, { status: 'clean' | 'dirty' | 'rebuilding' | 'failed'; hash: string; deps: string[] }> = new Map();

  register(dep: string, hash: string, deps: string[]) {
    this.nodes.set(dep, { status: 'clean', hash, deps });
  }

  markDirty(dep: string) {
    const node = this.nodes.get(dep);
    if (node) {
      node.status = 'dirty';
    }
  }

  getStatus(dep: string): 'clean' | 'dirty' | 'rebuilding' | 'failed' {
    return this.nodes.get(dep)?.status || 'dirty';
  }
}

/**
 * Computes a collective hash of dependency versions, lockfiles, and configuration files.
 */
function computeConfigHash(projectRoot: string, config: any): string {
  const hash = crypto.createHash('sha256');

  const pkgJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      hash.update(JSON.stringify(pkg.dependencies || {}));
      hash.update(JSON.stringify(pkg.devDependencies || {}));
      hash.update(JSON.stringify(pkg.peerDependencies || {}));
    } catch {}
  }

  const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
  for (const lock of lockfiles) {
    const lockPath = path.join(projectRoot, lock);
    if (fs.existsSync(lockPath)) {
      hash.update(fs.readFileSync(lockPath));
    }
  }

  hash.update(JSON.stringify(config.optimizeDeps || {}));
  hash.update(JSON.stringify(config.define || {}));

  return hash.digest('hex');
}

/**
 * Recursively scans entry scripts for bare module imports using es-module-lexer.
 */
export async function scanDeps(
  projectRoot: string,
  resolver: Resolver,
  include: string[] = [],
  exclude: string[] = []
): Promise<Set<string>> {
  await init;
  const deps = new Set<string>(include);
  const visited = new Set<string>();

  const htmlPath = path.join(projectRoot, 'index.html');
  const entryFiles: string[] = [];

  if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const scriptRegex = /<script\s+[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = scriptRegex.exec(htmlContent)) !== null) {
      let src = match[1];
      if (src.startsWith('/')) {
        src = src.slice(1);
      }
      entryFiles.push(path.resolve(projectRoot, src));
    }
  }

  const defaultEntries = ['src/main.jsx', 'src/main.tsx', 'src/index.js', 'src/index.ts'];
  for (const entry of defaultEntries) {
    const p = path.resolve(projectRoot, entry);
    if (fs.existsSync(p)) {
      entryFiles.push(p);
    }
  }

  async function scan(filePath: string) {
    if (visited.has(filePath)) return;
    visited.add(filePath);

    if (!fs.existsSync(filePath)) return;
    const ext = path.extname(filePath);
    if (!['.js', '.jsx', '.ts', '.tsx', '.html'].includes(ext)) return;

    const content = fs.readFileSync(filePath, 'utf-8');
    try {
      const [imports] = parse(content);
      for (const imp of imports) {
        const spec = imp.n;
        if (!spec) continue;

        if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('http://') || spec.startsWith('https://')) {
          let resolved = '';
          if (spec.startsWith('.')) {
            resolved = path.resolve(path.dirname(filePath), spec);
            if (!path.extname(resolved)) {
              for (const extName of ['.jsx', '.tsx', '.js', '.ts']) {
                if (fs.existsSync(resolved + extName)) {
                  resolved += extName;
                  break;
                }
              }
            }
          } else if (spec.startsWith('/')) {
            resolved = path.join(projectRoot, spec.slice(1));
          }
          if (resolved && fs.existsSync(resolved)) {
            await scan(resolved);
          }
        } else {
          const parts = spec.split('/');
          const baseName = spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

          if (!exclude.includes(baseName)) {
            deps.add(baseName);
          }
        }
      }
    } catch {}
  }

  for (const entry of entryFiles) {
    await scan(entry);
  }

  return deps;
}

function runWorker(payload: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, { workerData: payload });
    worker.on('message', (msg) => {
      if (msg.success) {
        resolve();
      } else {
        reject(new Error(msg.error));
      }
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

/**
 * Runs the optimization pipeline scanning, pre-bundling, and caching packages.
 */
export async function runOptimizer(
  projectRoot: string,
  config: any,
  resolver: Resolver,
  options: OptimizerOptions = {}
): Promise<OptimizerResult> {
  const startTime = Date.now();
  const cacheDir = path.join(projectRoot, '.ray/cache');

  if (options.clear) {
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
    console.log('[Ray Optimizer] Cache folder cleared successfully.');
    return {
      optimized: {},
      cacheHits: 0,
      cacheMisses: 0,
      optimizationTimeMs: 0,
      scanTimeMs: 0,
      coldStart: true,
    };
  }

  const currentHash = computeConfigHash(projectRoot, config);
  const metadataPath = path.join(cacheDir, 'metadata.json');

  const optimizeDepsConfig = config.optimizeDeps || {};
  const include = optimizeDepsConfig.include || [];
  const exclude = optimizeDepsConfig.exclude || [];

  const graph = new OptimizerGraph();

  // Check cache hit
  if (!options.force && !optimizeDepsConfig.force && fs.existsSync(metadataPath)) {
    try {
      const savedMeta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      if (savedMeta.hash === currentHash) {
        const scanTime = Date.now() - startTime;
        
        // Populate OptimizerGraph with cached records
        for (const [dep, fileUrl] of Object.entries(savedMeta.optimized || {})) {
          graph.register(dep, currentHash, []);
        }

        return {
          optimized: savedMeta.optimized || {},
          cacheHits: Object.keys(savedMeta.optimized || {}).length,
          cacheMisses: 0,
          optimizationTimeMs: 0,
          scanTimeMs: scanTime,
          coldStart: false,
        };
      }
    } catch {}
  }

  // Cache miss: Execute Scanning
  const scanStart = Date.now();
  const deps = await scanDeps(projectRoot, resolver, include, exclude);
  const scanTimeMs = Date.now() - scanStart;

  console.log(`[Ray Optimizer] Cache missed. Pre-bundling ${deps.size} dependencies in parallel...`);
  fs.mkdirSync(cacheDir, { recursive: true });

  const optimized: Record<string, string> = {};
  const optStart = Date.now();

  const workerTasks: Array<Promise<void>> = [];

  for (const dep of deps) {
    if (dep === 'react/jsx-runtime') continue;

    const resolved = resolver.resolveBarePackage(dep, projectRoot);
    if (!resolved || !fs.existsSync(resolved)) {
      console.warn(`[Ray Optimizer Warning] Could not resolve entry for dependency "${dep}". Falling back to on-demand compilation.`);
      continue;
    }

    const outFileName = `${dep.replace(/\//g, '_')}.js`;
    const outFilePath = path.join(cacheDir, outFileName);

    // Register node in optimizer graph as rebuilding
    graph.register(dep, currentHash, []);
    const node = graph.nodes.get(dep);
    if (node) node.status = 'rebuilding';

    // Queue worker compilation task
    const task = runWorker({
      resolvedPath: resolved,
      dep,
      outFilePath,
      env: config.define || {}
    }).then(() => {
      optimized[dep] = `/@ray/deps/${outFileName}`;
      if (node) node.status = 'clean';
    }).catch((err) => {
      console.error(`[Ray Optimizer Error] Pre-bundling "${dep}" failed in worker:`, err.message);
      if (node) node.status = 'failed';
    });

    workerTasks.push(task);
  }

  // Await all parallel compilation tasks concurrently
  await Promise.all(workerTasks);

  const optDuration = Date.now() - optStart;

  // Save metadata
  const metadata = {
    optimized,
    hash: currentHash,
    created: new Date().toISOString(),
    rayVersion: '1.0.0',
  };

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  return {
    optimized,
    cacheHits: 0,
    cacheMisses: deps.size,
    optimizationTimeMs: optDuration,
    scanTimeMs,
    coldStart: true,
  };
}
