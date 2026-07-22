import { InspectorPanel, InspectorState } from './types.js';

export class StateStore {
  private static customPanels = new Map<string, InspectorPanel>();
  private static state: InspectorState = {
    session: 'live-session',
    moduleGraph: { nodes: [], edges: [] },
    plugins: [],
    cache: { hits: 0, misses: 0, hitRate: 1.0 },
    tasks: [],
    diagnostics: [],
    customPanels: {},
  };

  static registerPanel(panel: InspectorPanel): void {
    this.customPanels.set(panel.id, panel);
    this.state.customPanels[panel.id] = panel;
  }

  static getPanel(id: string): InspectorPanel | undefined {
    return this.customPanels.get(id);
  }

  static getState(): InspectorState {
    return this.state;
  }

  static updateState(partial: Partial<InspectorState>): void {
    this.state = { ...this.state, ...partial };
  }

  static clear(): void {
    this.customPanels.clear();
    this.state = {
      session: 'live-session',
      moduleGraph: { nodes: [], edges: [] },
      plugins: [],
      cache: { hits: 0, misses: 0, hitRate: 1.0 },
      tasks: [],
      diagnostics: [],
      customPanels: {},
    };
  }
}
