import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { RayCore } from '@ray/core';
import { transformProjectFile } from './transformPipeline.js';
import { handleModuleRequest, handleDiagnosticsRequest } from './moduleMiddleware.js';

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
 * Starts the Ray Development Server.
 * Serves static assets, routes /@modules/ requests to the bare packager,
 * exposes the /__ray/graph debug route, and transforms JSX/JS imports dynamically.
 */
export function startDevServer(options: DevServerOptions) {
  const { port } = options;
  const projectRoot = process.cwd();

  // Initialize RayCore orchestrator
  const ray = new RayCore(projectRoot);

  const server = http.createServer(async (req, res) => {
    // Only handle GET requests
    if (req.method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    const url = new URL(req.url || '/', `http://localhost:${port}`);
    const pathname = decodeURIComponent(url.pathname);

    // 1. Serve dependency graph diagnostics
    if (handleDiagnosticsRequest(ray, pathname, res)) {
      return;
    }

    // 2. Serve virtual package modules (/@modules/)
    if (await handleModuleRequest(ray, pathname, res)) {
      return;
    }

    // 3. Resolve project files
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

      // HTTP Cache Validation (If-Modified-Since)
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince) {
        const clientTime = new Date(ifModifiedSince).getTime();
        // Match timestamps to nearest second
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
          'Cache-Control': 'no-cache', // Force client revalidation
        });
        res.end(compiledCode);
      } else {
        // Serve static asset directly
        const rawContent = await fs.readFile(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache', // Force client revalidation
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

  server.listen(port, () => {
    console.log('\n  ⚡ Ray Dev Server (Milestone 2) ⚡\n');
    console.log(`  > Local:       http://localhost:${port}/`);
    console.log(`  > Diagnostics: http://localhost:${port}/__ray/graph`);
    console.log(`  > Root:        ${projectRoot}\n`);
  });

  return server;
}
