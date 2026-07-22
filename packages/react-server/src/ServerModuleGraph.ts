import { ModuleBoundaryType } from './types.js';

export class ServerModuleGraph {
  private moduleBoundaries = new Map<string, ModuleBoundaryType>();

  registerModuleBoundary(id: string, boundary: ModuleBoundaryType): void {
    this.moduleBoundaries.set(id, boundary);
  }

  getModuleBoundary(id: string): ModuleBoundaryType {
    return this.moduleBoundaries.get(id) || 'shared';
  }
}
