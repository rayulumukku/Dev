export class RequestContext {
  static createRequest(url: string, init: RequestInit = {}): Request {
    return new Request(url, init);
  }
}
