/**
 * LiveASTViewer
 *
 * WebSocket-based live AST explorer that broadcasts the compiled AST for
 * any module to connected Ray Studio clients after each HMR compile cycle.
 *
 * Dev-server integration: registers `/__ray/ast?file=...` HTTP endpoint.
 *
 * Satisfies: Observable · Plugin-driven · Incremental · Zero Global State
 */
export interface ASTSnapshot {
    file: string;
    timestamp: number;
    nodeCount: number;
    ast: object;
}
export declare class LiveASTViewer {
    /** In-memory store: latest AST snapshot per file */
    private snapshots;
    /** Connected WebSocket clients */
    private clients;
    /**
     * Record a new AST snapshot for a compiled file and broadcast to clients.
     */
    update(file: string, ast: object): void;
    /**
     * Return the latest AST snapshot for a file, or null if not available.
     */
    get(file: string): ASTSnapshot | null;
    /**
     * Return a summary of all tracked files (file path + node count only).
     */
    summary(): Array<{
        file: string;
        nodeCount: number;
        timestamp: number;
    }>;
    /**
     * Register a WebSocket client. Called by the dev-server when a Studio
     * client connects and sends { type: 'subscribe-ast' }.
     */
    addClient(ws: any): void;
    private broadcast;
    /**
     * Returns a Node.js-compatible HTTP handler for the /__ray/ast route.
     * Usage: `server.addRoute('/__ray/ast', astViewer.httpHandler())`
     */
    httpHandler(): (req: any, res: any) => void;
    private countNodes;
}
export declare const liveASTViewer: LiveASTViewer;
export default liveASTViewer;
//# sourceMappingURL=astViewer.d.ts.map