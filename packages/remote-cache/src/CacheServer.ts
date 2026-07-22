import http from 'http';
import { RemoteCacheArtifact } from './types.js';

export class CacheServer {
  private server?: http.Server;
  private artifacts = new Map<string, RemoteCacheArtifact>();
  private port: number;

  constructor(port: number = 3099) {
    this.port = port;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        const key = req.url?.replace(/^\//, '') || '';

        if (req.method === 'GET') {
          const artifact = this.artifacts.get(key);
          if (artifact) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(artifact));
          } else {
            res.writeHead(404);
            res.end();
          }
        } else if (req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const artifact = JSON.parse(body);
              this.artifacts.set(key, artifact);
              res.writeHead(200);
              res.end('OK');
            } catch {
              res.writeHead(400);
              res.end('Invalid JSON');
            }
          });
        } else if (req.method === 'HEAD') {
          if (this.artifacts.has(key)) {
            res.writeHead(200);
          } else {
            res.writeHead(404);
          }
          res.end();
        } else {
          res.writeHead(405);
          res.end();
        }
      });

      this.server.listen(this.port, () => resolve());
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
