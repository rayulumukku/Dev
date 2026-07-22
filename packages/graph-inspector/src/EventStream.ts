export class EventStream {
  private clients = new Set<(data: string) => void>();

  subscribe(client: (data: string) => void): void {
    this.clients.add(client);
  }

  unsubscribe(client: (data: string) => void): void {
    this.clients.delete(client);
  }

  broadcast(event: string, payload: any): void {
    const message = JSON.stringify({ event, payload, timestamp: Date.now() });
    for (const client of this.clients) {
      client(message);
    }
  }
}
