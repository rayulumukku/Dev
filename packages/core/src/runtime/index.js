/**
 * RuntimeAdapter
 *
 * Detects the current JavaScript runtime (Node, Bun, Deno, Edge) and
 * provides a unified interface for launching HTTP servers and querying
 * runtime capabilities.
 *
 * Satisfies: Framework-agnostic · Replaceable · Zero Global State
 */
export class RuntimeAdapter {
    static _detected = null;
    /**
     * Detect the current runtime environment once and cache the result.
     */
    static detect() {
        if (this._detected)
            return this._detected;
        if (typeof globalThis.Bun !== 'undefined') {
            this._detected = 'bun';
        }
        else if (typeof globalThis.Deno !== 'undefined') {
            this._detected = 'deno';
        }
        else if (typeof globalThis.EdgeRuntime !== 'undefined' ||
            typeof globalThis.caches !== 'undefined' && typeof process === 'undefined') {
            this._detected = 'edge';
        }
        else if (typeof process !== 'undefined' && process.versions?.node) {
            this._detected = 'node';
        }
        else {
            this._detected = 'unknown';
        }
        return this._detected;
    }
    /**
     * Returns a capabilities map for the detected runtime.
     */
    static capabilities() {
        const runtime = this.detect();
        const caps = {
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
    static async serve(options) {
        const runtime = this.detect();
        const port = options.port ?? 3000;
        const hostname = options.hostname ?? '0.0.0.0';
        if (runtime === 'bun') {
            const server = globalThis.Bun.serve({
                port,
                hostname,
                fetch: options.handler,
            });
            console.log(`[Ray Runtime] Bun server listening on http://${hostname}:${port}`);
            return async () => server.stop();
        }
        if (runtime === 'deno') {
            const ac = new AbortController();
            globalThis.Deno.serve({ port, hostname, signal: ac.signal }, options.handler);
            console.log(`[Ray Runtime] Deno server listening on http://${hostname}:${port}`);
            return async () => ac.abort();
        }
        // Node.js (default)
        const { createServer } = await import('http');
        const server = createServer(async (req, res) => {
            const url = `http://${req.headers.host ?? hostname}${req.url}`;
            const request = new Request(url, {
                method: req.method,
                headers: req.headers,
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
                    await new Promise((r) => server.close(() => r()));
                });
            });
        });
    }
}
export default RuntimeAdapter;
//# sourceMappingURL=index.js.map