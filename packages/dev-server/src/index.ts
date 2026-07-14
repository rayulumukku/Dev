import http from 'http';
import fs from 'fs/promises';
import path from 'path';
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
}

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
  const projectRoot = process.cwd();

  // 1. Initialize RayCore orchestrator
  const ray = new RayCore(projectRoot);
  await ray.init();

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

    // Diagnostics: Expose WebSocket status
    if (pathname === '/__ray/ws') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(wsServer.getDiagnostics(), null, 2));
      return;
    }

    // Diagnostics: Expose dependency graph
    if (handleDiagnosticsRequest(ray, pathname, res)) {
      return;
    }

    // Diagnostics: Expose tracked CSS files
    if (handleCssDiagnosticsRequest(ray, pathname, res)) {
      return;
    }

    // Diagnostics: Expose HMR boundaries and updates status
    if (handleHmrDiagnosticsRequest(ray, pathname, res)) {
      return;
    }

    // Diagnostics: Expose active plugins, hooks, and execution times
    if (pathname === '/__ray/plugins') {
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

    // Serve virtual packages from /@modules/
    if (await handleModuleRequest(ray, pathname, res)) {
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
      const isTransformable = ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
      const isCss = ext === '.css';
      const isHtml = ext === '.html';
      const isImport = url.searchParams.has('import');
      const isAssetImport =
        isImport &&
        ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(
          ext.toLowerCase()
        );

      if (isCss && isImport) {
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

      if (isAssetImport) {
        const finalCode = await ray.transform('', filePath + '?import');
        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache',
        });
        res.end(finalCode);
        return;
      }

      if (isTransformable) {
        const rawCode = await fs.readFile(filePath, 'utf-8');
        const finalCode = await ray.transform(rawCode, filePath);

        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache',
        });
        res.end(finalCode);
      } else if (isHtml) {
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
  const wsServer = new RayWebSocketServer(server);

  // 4. Initialize File Watcher
  const watcher = startFileWatcher({
    projectRoot,
    onChange: (file) => {
      const relPath = path.relative(projectRoot, file).replace(/\\/g, '/');
      console.log(`[Ray Watcher] File change detected: /${relPath}`);

      // Invalidate dependency graph compilation timestamps
      ray.invalidate(file);

      // Check if this is a CSS stylesheet change to send CSS-specific update
      if (file.endsWith('.css')) {
        wsServer.broadcast({
          type: 'css-update',
          path: `/${relPath}`,
          timestamp: Date.now(),
        });
      } else {
        // JS/JSX/TS/TSX file change -> plan HMR updates
        const timestamp = Date.now();
        const plan = planUpdates(ray, file, timestamp);

        if (plan.fallback) {
          console.log(`[Ray HMR] HMR fallback triggered: Full reload for /${relPath}`);
          wsServer.broadcast({
            type: 'full-reload',
            path: `/${relPath}`,
          });
        } else {
          console.log(`[Ray HMR] Broadcasting HMR updates for /${relPath}:`, JSON.stringify(plan.updates));
          wsServer.broadcast({
            type: 'update',
            updates: plan.updates,
          });
        }
      }
    },
  });

  // 5. Listen on specified port
  server.listen(port, () => {
    console.log('\n  ⚡ Ray Dev Server (Milestone 7) ⚡\n');
    console.log(`  > Local:       http://localhost:${port}/`);
    console.log(`  > Diagnostics: http://localhost:${port}/__ray/graph`);
    console.log(`  > WebSocket:   http://localhost:${port}/__ray/ws`);
    console.log(`  > CSS Status:  http://localhost:${port}/__ray/css`);
    console.log(`  > HMR Status:  http://localhost:${port}/__ray/hmr`);
    console.log(`  > Plugins:     http://localhost:${port}/__ray/plugins`);
    console.log(`  > Root:        ${projectRoot}\n`);
  });

  return {
    server,
    wsServer,
    watcher,
  };
}
