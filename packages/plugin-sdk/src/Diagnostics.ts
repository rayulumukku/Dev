import { DiagnosticItem } from './types.js';

export class PluginDiagnostics {
  private items: DiagnosticItem[] = [];

  warn(code: string, message: string, location?: DiagnosticItem['location']): void {
    this.items.push({ type: 'warning', code, message, location });
  }

  error(code: string, message: string, location?: DiagnosticItem['location']): void {
    this.items.push({ type: 'error', code, message, location });
  }

  info(code: string, message: string, location?: DiagnosticItem['location']): void {
    this.items.push({ type: 'info', code, message, location });
  }

  getDiagnostics(): DiagnosticItem[] {
    return this.items;
  }

  hasErrors(): boolean {
    return this.items.some(i => i.type === 'error');
  }

  clear(): void {
    this.items = [];
  }
}
