import http from 'http';
import { InspectorServerOptions } from './types.js';
import { GraphSerializer } from './GraphSerializer.js';
import { EventStream } from './EventStream.js';

export class GraphInspectorServer {
  private server?: http.Server;
  private serializer = new GraphSerializer();
  private eventStream = new EventStream();
  private options: InspectorServerOptions;

  constructor(options: InspectorServerOptions = {}) {
    this.options = {
      port: options.port || 4000,
      host: options.host || 'localhost',
      open: options.open ?? false,
    };
  }

  getSerializer(): GraphSerializer {
    return this.serializer;
  }

  getEventStream(): EventStream {
    return this.eventStream;
  }

  async start(): Promise<void> {
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

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
