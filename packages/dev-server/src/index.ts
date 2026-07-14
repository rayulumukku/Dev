import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { transformJsx } from '@ray/transform';

interface DevServerOptions {
  port: number;
}

// In-memory cache for transformed modules to avoid compiling unchanged files
interface CachedModule {
  code: string;
  mtime: number;
}
const transformCache = new Map<string, CachedModule>();

// Standard MIME type mapping for static files
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
 * Starts the Node.js HTTP server that handles static files and transforms JSX on-the-fly.
 * 
 * @param options Server startup options (e.g. port)
 */
export function startDevServer(options: DevServerOptions) {
  const { port } = options;

  const server = http.createServer(async (req, res) => {
    // We only serve GET requests
    if (req.method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    // Parse the URL path, removing search params and hashing
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    let pathname = decodeURIComponent(url.pathname);

    // Default to serving index.html if requesting root directory
    if (pathname === '/') {
      pathname = '/index.html';
    }

    const filePath = path.join(process.cwd(), pathname);

    try {
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden: Directory access is not allowed');
        return;
      }

      const ext = path.extname(filePath);
      const mtime = stat.mtimeMs;

      // HTTP Cache Validation (Conditional Requests)
      // Checks If-Modified-Since header and returns 304 if file hasn't changed.
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince) {
        const clientTime = new Date(ifModifiedSince).getTime();
        // Round to nearest second since HTTP dates lose millisecond precision
        if (Math.floor(mtime / 1000) <= Math.floor(clientTime / 1000)) {
          res.writeHead(304);
          res.end();
          return;
        }
      }

      // Check if this extension needs to be compiled on the fly
      const isTransformable = ['.jsx', '.tsx', '.ts'].includes(ext);

      if (isTransformable) {
        let compiledCode = '';

        // Check our in-memory cache first
        const cached = transformCache.get(filePath);
        if (cached && cached.mtime === mtime) {
          compiledCode = cached.code;
        } else {
          // Cache miss: read, transform, and update cache
          const rawCode = await fs.readFile(filePath, 'utf-8');
          compiledCode = await transformJsx(rawCode, filePath);
          transformCache.set(filePath, { code: compiledCode, mtime });
          console.log(`[Ray Compiler] Compiled and cached: ${pathname}`);
        }

        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache', // Instruct browser to revalidate each time
        });
        res.end(compiledCode);
      } else {
        // Serve as static file
        const rawContent = await fs.readFile(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Last-Modified': new Date(mtime).toUTCString(),
          'Cache-Control': 'no-cache', // Instruct browser to revalidate each time
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
    console.log('\n  ⚡ Ray Dev Server ⚡\n');
    console.log(`  > Local:   http://localhost:${port}/`);
    console.log(`  > Mode:    Development (Milestone 1)`);
    console.log(`  > Root:    ${process.cwd()}\n`);
  });

  return server;
}
