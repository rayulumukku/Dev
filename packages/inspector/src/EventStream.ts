import { EventBus } from '@ray/observability';
import { WSMessage } from './types.js';

export class EventStream {
  private static subscribers: Array<(msg: WSMessage) => void> = [];

  static subscribe(cb: (msg: WSMessage) => void): void {
    this.subscribers.push(cb);
  }

  static broadcast(type: string, data: any): void {
    const msg: WSMessage = { type, data };
    for (const sub of this.subscribers) {
      sub(msg);
    }
  }

  static connectObservability(): void {
    EventBus.on('cli:startup', (evt) => this.broadcast('telemetry', evt));
    EventBus.on('transform:file', (evt) => this.broadcast('telemetry', evt));
  }
}
