import { ServerAction } from './types.js';

export class ActionRegistry {
  private static actions = new Map<string, ServerAction>();

  static register(action: ServerAction): void {
    this.actions.set(action.id, action);
  }

  static get(id: string): ServerAction | undefined {
    return this.actions.get(id);
  }

  static getAll(): ServerAction[] {
    return Array.from(this.actions.values());
  }

  static clear(): void {
    this.actions.clear();
  }
}
