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

export class LiveASTViewer {
  /** In-memory store: latest AST snapshot per file */
  private snapshots: Map<string, ASTSnapshot> = new Map();
  /** Connected WebSocket clients */
  private clients: Set<any> = new Set();

  // ─────────────────────────────────────────────────────────────────────
  // Snapshot management
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Record a new AST snapshot for a compiled file and broadcast to clients.
   */
  update(file: string, ast: object): void {
    const nodeCount = this.countNodes(ast);
    const snapshot: ASTSnapshot = {
      file,
      timestamp: Date.now(),
      nodeCount,
      ast,
    };
    this.snapshots.set(file, snapshot);
    this.broadcast({ type: 'ast-update', payload: snapshot });
  }

  /**
   * Return the latest AST snapshot for a file, or null if not available.
   */
  get(file: string): ASTSnapshot | null {
    return this.snapshots.get(file) ?? null;
  }

  /**
   * Return a summary of all tracked files (file path + node count only).
   */
  summary(): Array<{ file: string; nodeCount: number; timestamp: number }> {
    return Array.from(this.snapshots.values()).map(({ file, nodeCount, timestamp }) => ({
      file,
      nodeCount,
      timestamp,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────
  // WebSocket integration
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Register a WebSocket client. Called by the dev-server when a Studio
   * client connects and sends { type: 'subscribe-ast' }.
   */
  addClient(ws: any): void {
    this.clients.add(ws);
    ws.on?.('close', () => this.clients.delete(ws));
    ws.addEventListener?.('close', () => this.clients.delete(ws));
  }

  private broadcast(message: object): void {
    const json = JSON.stringify(message);
    for (const client of this.clients) {
      try {
        if (typeof client.send === 'function' && client.readyState === 1 /* OPEN */) {
          client.send(json);
        }
      } catch {
        this.clients.delete(client);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // HTTP handler (mounted at /__ray/ast by dev-server)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Returns a Node.js-compatible HTTP handler for the /__ray/ast route.
   * Usage: `server.addRoute('/__ray/ast', astViewer.httpHandler())`
   */
  httpHandler(): (req: any, res: any) => void {
    return (req: any, res: any) => {
      const url = new URL(req.url, `http://localhost`);
      const file = url.searchParams.get('file');

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (!file) {
        // List all tracked files
        res.statusCode = 200;
        res.end(JSON.stringify({ snapshots: this.summary() }));
        return;
      }

      const snapshot = this.get(file);
      if (!snapshot) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `No AST snapshot for file: ${file}` }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify(snapshot));
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────

  private countNodes(node: any, depth = 0): number {
    if (!node || typeof node !== 'object' || depth > 50) return 0;
    let count = 1;
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) count += this.countNodes(item, depth + 1);
      } else if (child && typeof child === 'object') {
        count += this.countNodes(child, depth + 1);
      }
    }
    return count;
  }
}

export const liveASTViewer = new LiveASTViewer();
export default liveASTViewer;
