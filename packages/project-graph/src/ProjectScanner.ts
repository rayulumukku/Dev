import fs from 'fs';
import path from 'path';
import { ProjectNode, ProjectType } from './types.js';

export class ProjectScanner {
  static scanWorkspace(workspaceRoot: string): ProjectNode[] {
    const projects: ProjectNode[] = [];

    // Common workspace directory patterns
    const searchDirs = ['packages', 'apps', 'libs', 'examples', 'tools'];

    for (const dirName of searchDirs) {
      const fullDir = path.join(workspaceRoot, dirName);
      if (fs.existsSync(fullDir) && fs.statSync(fullDir).isDirectory()) {
        const subdirs = fs.readdirSync(fullDir);
        for (const sub of subdirs) {
          const projectPath = path.join(fullDir, sub);
          const pkgJsonPath = path.join(projectPath, 'package.json');

          if (fs.existsSync(pkgJsonPath)) {
            try {
              const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
              const name = pkgJson.name || sub;

              let type: ProjectType = 'package';
              if (dirName === 'apps') type = 'app';
              else if (dirName === 'libs') type = 'lib';
              else if (dirName === 'examples') type = 'example';
              else if (dirName === 'tools') type = 'tool';

              const deps = [
                ...Object.keys(pkgJson.dependencies || {}),
                ...Object.keys(pkgJson.devDependencies || {}),
              ];

              projects.push({
                name,
                root: projectPath,
                type,
                dependencies: deps,
              });
            } catch {
              // Ignore invalid package.json
            }
          }
        }
      }
    }

    // Also include root package.json if exists and no subprojects found
    if (projects.length === 0 && fs.existsSync(path.join(workspaceRoot, 'package.json'))) {
      try {
        const rootPkg = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf-8'));
        projects.push({
          name: rootPkg.name || 'root',
          root: workspaceRoot,
          type: 'app',
          dependencies: [],
        });
      } catch {}
    }

    return projects;
  }
}
