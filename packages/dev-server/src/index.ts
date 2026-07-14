import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { RayCore } from '@ray/core';
import { hmrClientCode } from '@ray/hmr-runtime';

import { transformProjectFile, invalidateProjectFile } from './transformPipeline.js';
import { handleModuleRequest, handleDiagnosticsRequest } from './moduleMiddleware.js';
import { RayWebSocketServer } from './websocket/index.js';
import { startFileWatcher } from './watcher/index.js';
import { injectHmrClient } from './htmlTransform.js';

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
 * Automatically injects client-side hot reload code into HTML files.
 */
export function startDevServer(options: DevServerOptions) {
  const { port } = options;
  const projectRoot = process.cwd();

  // 1. Initialize RayCore orchestrator
  const ray = new RayCore(projectRoot);

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

    // Serve virtual WebSocket HMR client code
    if (pathname === '/@ray/hmr.js') {
      res.writeHead(200, {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store', // Do not cache HMR listener script
      });
      res.end(hmrClientCode);
      return;
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

      // Check if file requires specifier rewriting & JSX transform
      const isTransformable = ['.js', '.jsx', '.ts', '.tsx'].includes(ext);

      if (isTransformable) {
        const rawCode = await fs.readFile(filePath, 'utf-8');
        const compiledCode = await transformProjectFile(ray, filePath, rawCode, mtime);

        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache',
        });
        res.end(compiledCode);
      } else {
        // Serve static asset directly
        let rawContent = await fs.readFile(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // Automatically inject the WS listener script into HTML files
        if (contentType === 'text/html') {
          const html = rawContent.toString('utf-8');
          const injectedHtml = injectHmrClient(html);
          rawContent = Buffer.from(injectedHtml, 'utf-8');
        }

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
        console.error(`[Ray Server] Error serving ${pathname}:`, err);
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

      // Invalidate dev-server memory cache
      invalidateProjectFile(file);
      // Invalidate dependency graph compilation timestamps
      ray.invalidate(file);

      // Broadcast full reload command via WS
      wsServer.broadcast({
        type: 'full-reload',
        path: `/${relPath}`,
      });
    },
  });

  // 5. Listen on specified port
  server.listen(port, () => {
    console.log('\n  ⚡ Ray Dev Server (Milestone 3) ⚡\n');
    console.log(`  > Local:       http://localhost:${port}/`);
    console.log(`  > Diagnostics: http://localhost:${port}/__ray/graph`);
    console.log(`  > WebSocket:   http://localhost:${port}/__ray/ws`);
    console.log(`  > Root:        ${projectRoot}\n`);
  });

  return {
    server,
    wsServer,
    watcher,
  };
}
