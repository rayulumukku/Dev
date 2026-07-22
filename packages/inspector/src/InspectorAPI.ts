import { StateStore } from './StateStore.js';
import { InspectorPanel } from './types.js';

export class InspectorAPI {
  static registerInspectorPanel(panel: InspectorPanel): void {
    StateStore.registerPanel(panel);
  }

  static publishInspectorData(key: string, data: any): void {
    StateStore.updateState({ [key]: data } as any);
  }

  static getStateSnapshot(): string {
    return JSON.stringify(StateStore.getState(), null, 2);
  }
}
