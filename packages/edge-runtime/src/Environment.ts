export class Environment {
  private static vars = new Map<string, string>();

  static set(key: string, value: string): void {
    this.vars.set(key, value);
  }

  static get(key: string): string | undefined {
    return this.vars.get(key) || process.env[key];
  }

  static isEdge(): boolean {
    return process.env.RAY_RUNTIME_TARGET === 'edge';
  }
}
