import { ActionRegistry } from './ActionRegistry.js';
import { ServerActionsManifest } from './types.js';

export class ActionManifestGenerator {
  static generateManifest(): ServerActionsManifest {
    const manifest: ServerActionsManifest = {};
    for (const action of ActionRegistry.getAll()) {
      manifest[action.id] = {
        id: action.id,
        name: action.name,
        filepath: action.filepath,
      };
    }
    return manifest;
  }

  static toJSON(): string {
    return JSON.stringify(this.generateManifest(), null, 2);
  }
}
