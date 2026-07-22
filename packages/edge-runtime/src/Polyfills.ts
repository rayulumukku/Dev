export class Polyfills {
  static applyPolyfills(): void {
    if (typeof globalThis.fetch === 'undefined') {
      // Basic fetch mock / polyfill hook for edge environments
      (globalThis as any).fetch = async (url: string) => new Response(`Edge fetch fallback: ${url}`);
    }
  }
}
