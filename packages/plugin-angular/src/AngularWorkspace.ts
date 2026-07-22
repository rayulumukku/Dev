import fs from 'fs';
import path from 'path';
import { AngularWorkspaceConfig } from './types.js';

export class AngularWorkspace {
  static parseWorkspace(projectRoot: string): AngularWorkspaceConfig | null {
    const configPath = path.join(projectRoot, 'angular.json');
    if (!fs.existsSync(configPath)) return null;

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content) as AngularWorkspaceConfig;
    } catch {
      return null;
    }
  }
}
