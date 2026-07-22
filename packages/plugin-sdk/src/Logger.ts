import { SDKLogger } from './types.js';

export class ScopedLogger implements SDKLogger {
  private pluginName: string;

  constructor(pluginName: string) {
    this.pluginName = pluginName;
  }

  info(msg: string): void {
    console.log(`[Plugin: ${this.pluginName}] ℹ️  ${msg}`);
  }

  warn(msg: string): void {
    console.warn(`[Plugin: ${this.pluginName}] ⚠️  ${msg}`);
  }

  error(msg: string): void {
    console.error(`[Plugin: ${this.pluginName}] ❌ ${msg}`);
  }

  debug(msg: string): void {
    if (process.env.DEBUG) {
      console.log(`[Plugin: ${this.pluginName}] 🐛 ${msg}`);
    }
  }
}

export function createLogger(pluginName: string): SDKLogger {
  return new ScopedLogger(pluginName);
}
