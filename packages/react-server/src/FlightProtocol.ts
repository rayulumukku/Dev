import { FlightPayload } from './types.js';

export class FlightProtocol {
  static encodePayload(payload: FlightPayload): string {
    return `${payload.id}:${payload.type === 'client-ref' ? 'I' : 'J'}:${JSON.stringify(payload.data)}\n`;
  }

  static decodePayload(line: string): FlightPayload | null {
    const parts = line.split(':');
    if (parts.length < 3) return null;

    const id = parts[0];
    const typeChar = parts[1];
    const dataRaw = parts.slice(2).join(':');

    return {
      id,
      type: typeChar === 'I' ? 'client-ref' : 'component',
      data: JSON.parse(dataRaw),
    };
  }
}
