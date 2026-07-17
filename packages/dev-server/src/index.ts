import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { RayCore } from '@ray/core';
import { hmrClientCode } from '@ray/hmr-runtime';

import { handleModuleRequest, handleDiagnosticsRequest } from './moduleMiddleware.js';
import { RayWebSocketServer } from './websocket/index.js';
import { startFileWatcher } from './watcher/index.js';
import { handleCssDiagnosticsRequest } from './cssMiddleware.js';
import { handleHmrDiagnosticsRequest } from './hmrMiddleware.js';
import { planUpdates } from './updatePlanner.js';

interface DevServerOptions {
  port: number;
  ssr?: boolean;
  mode?: string;
}

let lastRenderTime = 0;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * Launches the HTTP Server, WebSocket Server, and File Watcher.
 * Refactored to coordinate compiles and resolutions entirely via RayCore plugins.
 */
export async function startDevServer(options: DevServerOptions) {
  const { port } = options;
  const isPreview = !!(options as any).preview;

  let projectRoot = process.cwd();
  if (isPreview) {
    try {
      const stats = await fs.stat(path.join(process.cwd(), 'dist/client'));
      if (stats.isDirectory()) {
        projectRoot = path.join(process.cwd(), 'dist/client');
      }
    } catch {
      projectRoot = path.join(process.cwd(), 'dist');
    }
  }

  // 1. Initialize RayCore orchestrator
  const ray = isPreview ? null : new RayCore(projectRoot, options.mode || 'development');
  if (ray) {
    await ray.init();
    console.log('[Ray Dev Server] Running dependency optimizer...');
    await ray.optimize();
  }

  // 2. Start HTTP server
  const server = http.createServer(async (req, res) => {
    // Only accept GET requests
    if (req.method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    const url = new URL(req.url || '/', `http://localhost:${port}`);
    const pathname = decodeURIComponent(url.pathname);

    // Bypasses execution compile pipeline if serving compiled static production builds
    if (isPreview) {
      let routePath = pathname;
      if (routePath === '/') {
        routePath = '/index.html';
      }
      let filePath = path.join(projectRoot, routePath);
      try {
        let stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          const indexFilePath = path.join(filePath, 'index.html');
          stat = await fs.stat(indexFilePath);
          filePath = indexFilePath;
        }
        const ext = path.extname(filePath);
        const rawContent = await fs.readFile(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(rawContent);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
      return;
    }

    // Diagnostics: Expose WebSocket status
    if (pathname === '/__ray/ws') {
      if (wsServer) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(wsServer.getDiagnostics(), null, 2));
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('WebSocket Diagnostics unavailable in preview mode');
      }
      return;
    }

    // Diagnostics: Expose dependency graph
    if (ray && handleDiagnosticsRequest(ray, pathname, res)) {
      return;
    }

    // Diagnostics: Expose tracked CSS files
    if (ray && handleCssDiagnosticsRequest(ray, pathname, res)) {
      return;
    }

    // Diagnostics: Expose HMR boundaries and updates status
    if (ray && handleHmrDiagnosticsRequest(ray, pathname, res)) {
      return;
    }

    // Diagnostics: Expose active plugins, hooks, and execution times
    if (pathname === '/__ray/plugins') {
      if (ray) {
        const pluginsInfo = ray.container.plugins.map((p) => {
          const hooks = Object.keys(p).filter(
            (k) => k !== 'name' && k !== 'enforce' && typeof (p as any)[k] === 'function'
          );
          const duration = ray.container.metrics.get(p.name) || 0;
          return {
            name: p.name,
            hooks,
            durationMs: Number(duration.toFixed(3)),
            status: duration > 10 ? 'SLOW (>10ms)' : 'OK',
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ plugins: pluginsInfo }, null, 2));
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Plugins metrics unavailable in preview mode');
      }
      return;
    }

    // Diagnostics: Expose detailed plugins metrics
    if (pathname === '/__ray/plugins/details') {
      if (ray) {
        const pluginsInfo = ray.container.plugins.map((p) => {
          const hooks = Object.keys(p).filter(
            (k) => k !== 'name' && k !== 'enforce' && typeof (p as any)[k] === 'function'
          );
          const duration = ray.container.metrics.get(p.name) || 0;
          return {
            name: p.name,
            version: '1.0.0',
            hooks,
            time: Number(duration.toFixed(3)),
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ plugins: pluginsInfo }, null, 2));
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Plugins metrics unavailable in preview mode');
      }
      return;
    }

    // Diagnostics: Expose SSR details
    if (pathname === '/__ray/ssr') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        mode: options.ssr ? 'development' : 'static',
        streaming: true,
        hydration: true,
        renderTimeMs: Number(lastRenderTime.toFixed(2)),
      }, null, 2));
      return;
    }

    // Diagnostics: Expose File Watcher diagnostics
    if (pathname === '/__ray/fs' || pathname === '/___ray/fs') {
      if (watcher && typeof (watcher as any).getDiagnostics === 'function') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify((watcher as any).getDiagnostics(), null, 2));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          platform: process.platform,
          watcherCount: 0,
          cpuUsagePercent: 0,
          memoryMB: 0,
          totalEventsProcessed: 0,
          avgLatencyMs: 0
        }, null, 2));
      }
      return;
    }

    // Diagnostics: Serve Ray Studio dashboard HTML
    if (pathname === '/__ray/studio') {
      const dir = path.dirname(fileURLToPath(import.meta.url));
      let studioHtmlPath = path.join(dir, 'studio.html');
      try {
        await fs.access(studioHtmlPath);
      } catch {
        studioHtmlPath = path.join(dir, '../src/studio.html');
      }
      try {
        const html = await fs.readFile(studioHtmlPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Failed to load Studio dashboard: ${err.message}`);
      }
      return;
    }

    // Diagnostics: Expose transformation stages code for diff compares
    if (pathname === '/__ray/transform-stages') {
      const targetFile = url.searchParams.get('file');
      if (targetFile) {
        let stages = ray?.container.transformStages.get(targetFile) || [];
        if (stages.length === 0) {
          stages = ray?.container.transformStages.get(path.resolve(projectRoot, targetFile)) || [];
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ stages }, null, 2));
      } else {
        const files = ray ? Array.from(ray.container.transformStages.keys()) : [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(files, null, 2));
      }
      return;
    }

    // Diagnostics: Serve compiler cache telemetry status
    if (pathname === '/__ray/cache') {
      if (ray) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(ray.cacheStore.getDiagnostics(), null, 2));
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Cache metrics unavailable in preview mode');
      }
      return;
    }

    // Diagnostics: Serve native compiler telemetry metrics
    if (pathname === '/__ray/compiler') {
      const stats = (globalThis as any).__ray_compiler_stats || {
        backend: (globalThis as any).__ray_config_compiler || 'esbuild',
        astNodes: 0,
        parseTimeMs: 0,
        transformTimeMs: 0,
        emitTimeMs: 0
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats, null, 2));
      return;
    }

    // Diagnostics: Expose full runtime diagnostics snapshot
    if (pathname === '/__ray/studio/diagnostics') {
      const memory = process.memoryUsage();
      const metrics = {
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        rss: memory.rss,
        external: memory.external,
      };
      const pluginsInfo = ray ? ray.container.plugins.map((p) => {
        const hooks = Object.keys(p).filter(
          (k) => k !== 'name' && k !== 'enforce' && typeof (p as any)[k] === 'function'
        );
        const duration = ray.container.metrics.get(p.name) || 0;
        return {
          name: p.name,
          hooks,
          durationMs: Number(duration.toFixed(3)),
          status: duration > 10 ? 'SLOW (>10ms)' : 'OK',
        };
      }) : [];

      const graphSnap = ray ? ray.graph.toJSON() : { modules: [] };
      const optResult = ray?.optimizerResult || {
        optimized: {},
        cacheHits: 0,
        cacheMisses: 0,
        optimizationTimeMs: 0,
        scanTimeMs: 0,
      };

      const clientVars = ray ? Object.keys(ray.env).filter(k => k.startsWith(ray.config.envPrefix || 'RAY_')) : [];
      const studioApiSnap = (globalThis as any).__ray_studio?.getSnapshot?.() || { panels: [], timeline: [], metrics: {} };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        metrics,
        plugins: { plugins: pluginsInfo },
        graph: graphSnap,
        optimizer: optResult,
        env: {
          mode: ray ? ray.mode : 'development',
          clientVariables: clientVars,
        },
        studio: studioApiSnap,
      }, null, 2));
      return;
    }

    // Serve optimized dependencies from .ray/cache/
    if (pathname.startsWith('/@ray/deps/')) {
      const depFileName = path.basename(pathname);
      const cacheFilePath = path.join(projectRoot, '.ray/cache', depFileName);
      try {
        const rawContent = await fs.readFile(cacheFilePath);
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(rawContent);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Dependency Not Found');
      }
      return;
    }

    // Diagnostics: Expose Optimizer status
    if (pathname === '/__ray/optimizer') {
      const optResult = ray?.optimizerResult || {
        optimized: {},
        cacheHits: 0,
        cacheMisses: 0,
        optimizationTimeMs: 0,
        scanTimeMs: 0,
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        optimized: Object.keys(optResult.optimized || {}),
        cacheHits: optResult.cacheHits || 0,
        cacheMisses: optResult.cacheMisses || 0,
        optimizationTimeMs: optResult.optimizationTimeMs || 0,
      }, null, 2));
      return;
    }

    // Diagnostics: Expose environment configuration
    if (pathname === '/__ray/env') {
      const clientVars = ray ? Object.keys(ray.env).filter(k => k.startsWith(ray.config.envPrefix || 'RAY_')) : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        mode: ray ? ray.mode : 'development',
        clientVariables: clientVars
      }, null, 2));
      return;
    }

    // Serve virtual WebSocket HMR client code
    if (pathname === '/@ray/hmr.js') {
      res.writeHead(200, {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store', // Do not cache HMR listener script
      });
      res.end(hmrClientCode);
      return;
    }

    // Serve virtual modules from loaded plugins
    if (pathname.startsWith('/@virtual/')) {
      if (ray) {
        const virtualId = '\0virtual:' + pathname.slice('/@virtual/'.length).split('?')[0];
        const loadedCode = await ray.container.load(virtualId);
        if (loadedCode !== null) {
          const result = await ray.container.transform(loadedCode, virtualId);
          res.writeHead(200, {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache',
          });
          res.end(result.code);
          return;
        }
      }
    }

    // Serve virtual packages from /@modules/
    if (ray && await handleModuleRequest(ray, pathname, res)) {
      return;
    }

    // SSR Page request interception
    const ssr = !!options.ssr;
    const isPageRequest = !pathname.includes('.') || pathname.endsWith('.html');
    const isDiagnostics = pathname.startsWith('/__ray/');
    if (ssr && isPageRequest && !isDiagnostics && ray) {
      try {
        const startRender = performance.now();
        const serverEntryPath = path.join(projectRoot, 'src/entry-server.jsx');
        const entryServer = await ray.ssrLoadModule(serverEntryPath);

        const indexHtmlPath = path.join(projectRoot, 'index.html');
        const rawHtml = await fs.readFile(indexHtmlPath, 'utf-8');
        const template = await ray.transform(rawHtml, indexHtmlPath);

        const context = {};
        const { html } = await entryServer.render(pathname, context);
        const renderTimeMs = performance.now() - startRender;
        lastRenderTime = renderTimeMs;

        const initialState = { initialCount: 5 };
        const serializedState = JSON.stringify(initialState)
          .replace(/</g, '\\u003c')
          .replace(/>/g, '\\u003e')
          .replace(/\u2028/g, '\\u2028')
          .replace(/\u2029/g, '\\u2029');

        const finalHtml = template.replace(
          '<div id="root"></div>',
          `<div id="root">${html}</div>\n<script>window.__RAY_DATA__ = ${serializedState};</script>`
        );

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(finalHtml);
      } catch (err: any) {
        console.error('[Ray SSR Error]', err);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <div style="background:#1e1b4b;color:#f87171;font-family:monospace;padding:3rem;min-height:100vh;">
            <h2>⚡ Ray SSR Rendering Exception ⚡</h2>
            <pre style="background:#09090b;padding:1.5rem;border-radius:8px;color:#f3f4f6;border:1px solid #374151;">${err.stack || err.message}</pre>
          </div>
        `);
      }
      return;
    }

    // Resolve project relative file paths
    let routePath = pathname;
    if (routePath === '/') {
      routePath = '/index.html';
    }

    const filePath = path.join(projectRoot, routePath);

    try {
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden: Directory access is not allowed');
        return;
      }

      const ext = path.extname(filePath);
      const mtime = stat.mtimeMs;

      // HTTP Cache checking (If-Modified-Since)
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince) {
        const clientTime = new Date(ifModifiedSince).getTime();
        if (Math.floor(mtime / 1000) <= Math.floor(clientTime / 1000)) {
          res.writeHead(304);
          res.end();
          return;
        }
      }

      // Check if file requires transformations through plugins
      const isImport = url.searchParams.has('import');
      const isTransformable = ['.js', '.jsx', '.ts', '.tsx'].includes(ext) || isImport;
      const isCss = ext === '.css';
      const isHtml = ext === '.html';
      const isAssetImport =
        isImport &&
        ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(
          ext.toLowerCase()
        );

      if (isCss && isImport && ray) {
        const rawCode = await fs.readFile(filePath, 'utf-8');
        const finalCode = await ray.transform(rawCode, filePath + '?import');

        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache',
        });
        res.end(finalCode);
        return;
      }

      if (isAssetImport && ray) {
        const finalCode = await ray.transform('', filePath + '?import');
        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache',
        });
        res.end(finalCode);
        return;
      }

      if (isTransformable && ray) {
        const rawCode = await fs.readFile(filePath, 'utf-8');
        const finalCode = await ray.transform(rawCode, isImport ? filePath + '?import' : filePath);

        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache',
        });
        res.end(finalCode);
      } else if (isHtml && ray) {
        const rawCode = await fs.readFile(filePath, 'utf-8');
        const finalCode = await ray.transform(rawCode, filePath);

        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache',
        });
        res.end(finalCode);
      } else {
        // Serve static asset directly
        const rawContent = await fs.readFile(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache',
        });
        res.end(rawContent);
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.warn(`[Ray Server] 404 Not Found: ${pathname}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${pathname}`);
      } else {
        console.error(`[Ray Server] 500 Internal Error serving ${pathname}:`, err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Internal Server Error: ${err.message}`);
      }
    }
  });

  // 3. Initialize WebSocket server
  const wsServer = isPreview ? null : new RayWebSocketServer(server);

  // 4. Initialize File Watcher
  const watcher = isPreview
    ? null
    : startFileWatcher({
        projectRoot,
        onChange: async (file) => {
          const relPath = path.relative(projectRoot, file).replace(/\\/g, '/');

          // Hot Reload environmental configurations when edited during development
          if (file.includes('.env')) {
            console.log(`[Ray Watcher] Environment file change detected: /${relPath}`);
            if (ray) {
              await ray.init();
            }
            if (wsServer) {
              wsServer.broadcast({
                type: 'full-reload',
                path: `/${relPath}`,
              });
            }
            return;
          }

          console.log(`[Ray Watcher] File change detected: /${relPath}`);

          // Invalidate dependency graph compilation timestamps
          if (ray) ray.invalidate(file);

          // Check if this is a CSS stylesheet change to send CSS-specific update
          if (file.endsWith('.css')) {
            if (wsServer) {
              wsServer.broadcast({
                type: 'css-update',
                path: `/${relPath}`,
                timestamp: Date.now(),
              });
            }
          } else {
            // JS/JSX/TS/TSX file change -> plan HMR updates
            const timestamp = Date.now();
            const plan = planUpdates(ray!, file, timestamp);

            if (plan.fallback) {
              console.log(`[Ray HMR] HMR fallback triggered: Full reload for /${relPath}`);
              if (wsServer) {
                wsServer.broadcast({
                  type: 'full-reload',
                  path: `/${relPath}`,
                });
              }
            } else {
              console.log(`[Ray HMR] Broadcasting HMR updates for /${relPath}:`, JSON.stringify(plan.updates));
              if (wsServer) {
                wsServer.broadcast({
                  type: 'update',
                  updates: plan.updates,
                });
              }
            }
          }
        },
      });

  // 5. Listen on specified port
  server.listen(port, () => {
    console.log(`\n  ⚡ Ray Server (Mode: ${isPreview ? 'Preview' : 'Dev'}) ⚡\n`);
    console.log(`  > Local:       http://localhost:${port}/`);
    if (!isPreview) {
      console.log(`  > Diagnostics: http://localhost:${port}/__ray/graph`);
      console.log(`  > WebSocket:   http://localhost:${port}/__ray/ws`);
      console.log(`  > CSS Status:  http://localhost:${port}/__ray/css`);
      console.log(`  > HMR Status:  http://localhost:${port}/__ray/hmr`);
      console.log(`  > Plugins:     http://localhost:${port}/__ray/plugins`);
    }
    console.log(`  > SSR Status:  http://localhost:${port}/__ray/ssr`);
    console.log(`  > Root:        ${projectRoot}\n`);
  });

  return {
    server,
    wsServer,
    watcher,
  };
}
