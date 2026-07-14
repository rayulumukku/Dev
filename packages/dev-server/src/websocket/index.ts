import { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export class RayWebSocketServer {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  constructor(server: any) {
    this.wss = new WebSocketServer({ noServer: true });

    // Handle standard upgrade from HTTP to WS on the special path /__ray_ws
    server.on('upgrade', (req: IncomingMessage, socket: any, head: any) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      if (url.pathname === '/__ray_ws') {
        this.wss.handleUpgrade(req, socket, head, (ws) => {
          this.wss.emit('connection', ws, req);
        });
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`[Ray WS] Client connected (Active tabs: ${this.clients.size})`);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[Ray WS] Client disconnected (Active tabs: ${this.clients.size})`);
      });

      ws.on('error', (err) => {
        console.error('[Ray WS] Connection error:', err);
        this.clients.delete(ws);
      });
    });
  }

  /**
   * Sends a message to all connected clients.
   */
  broadcast(payload: object) {
    const raw = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  /**
   * Returns current websocket metrics.
   */
  getDiagnostics() {
    return {
      clients: this.clients.size,
      connected: true,
    };
  }

  /**
   * Terminate all active clients and shutdown server.
   */
  close() {
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    this.wss.close();
  }
}
