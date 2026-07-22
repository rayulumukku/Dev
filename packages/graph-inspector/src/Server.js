import http from 'http';
import { GraphSerializer } from './GraphSerializer.js';
import { EventStream } from './EventStream.js';

export class GraphInspectorServer {
  constructor(options = {}) {
    this.options = {
      port: options.port || 4000,
      host: options.host || 'localhost',
      open: options.open ?? false,
    };
    this.serializer = new GraphSerializer();
    this.eventStream = new EventStream();
  }

  getSerializer() {
    return this.serializer;
  }

  getEventStream() {
    return this.eventStream;
  }

  async start() {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        if (req.url === '/api/graph') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(this.serializer.toJSON());
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Ray Dependency Graph Inspector UI</h1>');
        }
      });

      this.server.listen(this.options.port, this.options.host, () => {
        console.log(`⚡ Ray Graph Inspector running at http://${this.options.host}:${this.options.port}`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
