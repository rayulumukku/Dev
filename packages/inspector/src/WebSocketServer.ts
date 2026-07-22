import { EventStream } from './EventStream.js';
import { WSMessage } from './types.js';

export class InspectorWebSocketServer {
  private activeClients = new Set<(msg: WSMessage) => void>();

  constructor() {
    EventStream.subscribe((msg) => this.broadcast(msg));
  }

  addClient(clientCb: (msg: WSMessage) => void): void {
    this.activeClients.add(clientCb);
  }

  removeClient(clientCb: (msg: WSMessage) => void): void {
    this.activeClients.delete(clientCb);
  }

  broadcast(msg: WSMessage): void {
    for (const client of this.activeClients) {
      client(msg);
    }
  }

  getClientCount(): number {
    return this.activeClients.size;
  }
}
