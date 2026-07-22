import { ResponseContext } from './ResponseContext.js';
import { Streaming } from './Streaming.js';

export class EdgeAdapter {
  static async handleRequest(req: Request, handler: (req: Request) => Promise<string>): Promise<Response> {
    const content = await handler(req);
    return ResponseContext.createResponse(content, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  static handleStream(chunks: string[]): Response {
    const stream = Streaming.createTextStream(chunks);
    return new Response(stream, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
