import { FlightProtocol } from './FlightProtocol.js';

export class FlightRenderer {
  static async renderToFlightStream(rootElement: any): Promise<string> {
    let stream = '';

    // Render Flight stream chunks
    const chunk0 = FlightProtocol.encodePayload({
      id: '0',
      type: 'component',
      data: ['$', 'div', null, { children: 'RSC Stream Payload' }],
    });

    stream += chunk0;
    return stream;
  }
}
