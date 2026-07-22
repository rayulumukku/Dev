export class EventStream {
  constructor() {
    this.clients = new Set();
  }

  subscribe(client) {
    this.clients.add(client);
  }

  unsubscribe(client) {
    this.clients.delete(client);
  }

  broadcast(event, payload) {
    const message = JSON.stringify({ event, payload, timestamp: Date.now() });
    for (const client of this.clients) {
      client(message);
    }
  }
}
