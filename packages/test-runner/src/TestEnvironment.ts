export class TestEnvironment {
  static setupEnvironment(type = 'node'): void {
    if (type === 'browser') {
      (globalThis as any).window = globalThis;
      (globalThis as any).document = {};
    }
  }
}
