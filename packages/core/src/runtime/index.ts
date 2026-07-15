/**
 * RuntimeAdapter
 *
 * Detects the current JavaScript runtime (Node, Bun, Deno, Edge) and
 * provides a unified interface for launching HTTP servers and querying
 * runtime capabilities.
 *
 * Satisfies: Framework-agnostic · Replaceable · Zero Global State
 */

export type RuntimeName = 'node' | 'bun' | 'deno' | 'edge' | 'unknown';

export interface RuntimeCapabilities {
  runtime: RuntimeName;
  workers: boolean;
  streams: boolean;
  crypto: boolean;
  fs: boolean;
  fetch: boolean;
  webSocket: boolean;
}

export interface ServeOptions {
  port?: number;
  hostname?: string;
  handler: (request: Request) => Response | Promise<Response>;
}

export class RuntimeAdapter {
  private static _detected: RuntimeName | null = null;

  /**
   * Detect the current runtime environment once and cache the result.
   */
  static detect(): RuntimeName {
    if (this._detected) return this._detected;

    if (typeof (globalThis as any).Bun !== 'undefined') {
      this._detected = 'bun';
    } else if (typeof (globalThis as any).Deno !== 'undefined') {
      this._detected = 'deno';
    } else if (
      typeof (globalThis as any).EdgeRuntime !== 'undefined' ||
      typeof (globalThis as any).caches !== 'undefined' && typeof process === 'undefined'
    ) {
      this._detected = 'edge';
    } else if (typeof process !== 'undefined' && process.versions?.node) {
      this._detected = 'node';
    } else {
      this._detected = 'unknown';
    }

    return this._detected;
  }

  /**
   * Returns a capabilities map for the detected runtime.
   */
  static capabilities(): RuntimeCapabilities {
    const runtime = this.detect();

    const caps: Record<RuntimeName, RuntimeCapabilities> = {
      node: {
        runtime: 'node',
        workers: true,
        streams: true,
        crypto: true,
        fs: true,
        fetch: parseInt(process.versions?.node ?? '0') >= 18,
        webSocket: false, // needs ws package
      },
      bun: {
        runtime: 'bun',
        workers: true,
        streams: true,
        crypto: true,
        fs: true,
        fetch: true,
        webSocket: true,
      },
      deno: {
        runtime: 'deno',
        workers: true,
        streams: true,
        crypto: true,
        fs: true,
        fetch: true,
        webSocket: true,
      },
      edge: {
        runtime: 'edge',
        workers: false,
        streams: true,
        crypto: true,
        fs: false,
        fetch: true,
        webSocket: false,
      },
      unknown: {
        runtime: 'unknown',
        workers: false,
        streams: false,
        crypto: false,
        fs: false,
        fetch: false,
        webSocket: false,
      },
    };

    return caps[runtime];
  }

  /**
   * Launch an HTTP server appropriate for the detected runtime.
   * Returns a teardown function.
   */
  static async serve(options: ServeOptions): Promise<() => Promise<void>> {
    const runtime = this.detect();
    const port = options.port ?? 3000;
    const hostname = options.hostname ?? '0.0.0.0';

    if (runtime === 'bun') {
      const server = (globalThis as any).Bun.serve({
        port,
        hostname,
        fetch: options.handler,
      });
      console.log(`[Ray Runtime] Bun server listening on http://${hostname}:${port}`);
      return async () => server.stop();
    }

    if (runtime === 'deno') {
      const ac = new AbortController();
      (globalThis as any).Deno.serve({ port, hostname, signal: ac.signal }, options.handler);
      console.log(`[Ray Runtime] Deno server listening on http://${hostname}:${port}`);
      return async () => ac.abort();
    }

    // Node.js (default)
    const { createServer } = await import('http');
    const server = createServer(async (req, res) => {
      const url = `http://${req.headers.host ?? hostname}${req.url}`;
      const request = new Request(url, {
        method: req.method,
        headers: req.headers as any,
      });
      const response = await options.handler(request);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const body = response.body ? Buffer.from(await response.arrayBuffer()) : null;
      res.end(body);
    });

    return new Promise((resolve) => {
      server.listen(port, hostname, () => {
        console.log(`[Ray Runtime] Node.js server listening on http://${hostname}:${port}`);
        resolve(async () => {
          await new Promise<void>((r) => server.close(() => r()));
        });
      });
    });
  }
}

export default RuntimeAdapter;
