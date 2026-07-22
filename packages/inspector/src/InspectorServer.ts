import http from 'http';
import { InspectorConfig } from './types.js';
import { StateStore } from './StateStore.js';
import { InspectorWebSocketServer } from './WebSocketServer.js';

export class InspectorServer {
  private server?: http.Server;
  private wsServer = new InspectorWebSocketServer();
  private host: string;
  private port: number;

  constructor(config: InspectorConfig = {}) {
    this.host = config.host || '127.0.0.1';
    this.port = config.port || 4050;
  }

  async start(): Promise<{ url: string; port: number }> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // Enforce localhost binding security check
        const clientIp = req.socket.remoteAddress || '';
        if (this.host === '127.0.0.1' && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1') && !clientIp.includes('::ffff:127.0.0.1')) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Forbidden: Remote access denied');
          return;
        }

        if (req.url === '/api/state') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(StateStore.getState()));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html><html><head><title>Ray Inspector</title></head><body><h1>Ray Developer Inspector</h1></body></html>`);
      });

      this.server.listen(this.port, this.host, () => {
        const url = `http://${this.host}:${this.port}`;
        console.log(`⚡ Ray Developer Inspector running at ${url}`);
        resolve({ url, port: this.port });
      });

      this.server.on('error', reject);
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

  getWSServer(): InspectorWebSocketServer {
    return this.wsServer;
  }
}
