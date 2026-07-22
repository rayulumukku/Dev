export class ResponseContext {
  static createResponse(body?: BodyInit | null, init: ResponseInit = {}): Response {
    return new Response(body, init);
  }
}
