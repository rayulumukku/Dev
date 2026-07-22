export interface PluginContextOptions {
  root?: string;
  command?: 'serve' | 'build';
  mode?: string;
  resolver?: (id: string, importer?: string) => Promise<string | null> | string | null;
  onWarn?: (message: string | Error) => void;
  onError?: (message: string | Error) => void;
}

export class PluginContext {
  root: string;
  command: 'serve' | 'build';
  mode: string;

  private resolverFunc?: (id: string, importer?: string) => Promise<string | null> | string | null;
  private onWarnFunc?: (message: string | Error) => void;
  private onErrorFunc?: (message: string | Error) => void;

  constructor(opts?: PluginContextOptions) {
    this.root = opts?.root || process.cwd();
    this.command = opts?.command || 'serve';
    this.mode = opts?.mode || (this.command === 'build' ? 'production' : 'development');
    this.resolverFunc = opts?.resolver;
    this.onWarnFunc = opts?.onWarn;
    this.onErrorFunc = opts?.onError;
  }

  async resolve(source: string, importer?: string): Promise<{ id: string } | null> {
    if (this.resolverFunc) {
      const res = await this.resolverFunc(source, importer);
      if (res) return { id: res };
    }
    return null;
  }

  warn(message: string | Error): void {
    const text = message instanceof Error ? message.message : String(message);
    if (this.onWarnFunc) {
      this.onWarnFunc(message);
    } else {
      console.warn(`[Warning] ${text}`);
    }
  }

  error(message: string | Error): never {
    const err = message instanceof Error ? message : new Error(String(message));
    if (this.onErrorFunc) {
      this.onErrorFunc(err);
    } else {
      console.error(`[Error] ${err.message}`);
    }
    throw err;
  }
}
