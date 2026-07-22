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
export declare class RuntimeAdapter {
    private static _detected;
    /**
     * Detect the current runtime environment once and cache the result.
     */
    static detect(): RuntimeName;
    /**
     * Returns a capabilities map for the detected runtime.
     */
    static capabilities(): RuntimeCapabilities;
    /**
     * Launch an HTTP server appropriate for the detected runtime.
     * Returns a teardown function.
     */
    static serve(options: ServeOptions): Promise<() => Promise<void>>;
}
export default RuntimeAdapter;
//# sourceMappingURL=index.d.ts.map