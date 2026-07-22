import fs from 'fs';
import path from 'path';

export class ProjectManager {
  findRayProjects(root: string): string[] {
    const projects: string[] = [];
    if (!fs.existsSync(root)) return projects;

    const scan = (dir: string) => {
      const files = fs.readdirSync(dir);
      if (files.includes('ray.config.ts') || files.includes('ray.config.js') || files.includes('package.json')) {
        projects.push(dir);
      }
      for (const f of files) {
        if (f === 'node_modules' || f === 'dist' || f.startsWith('.')) continue;
        const fp = path.join(dir, f);
        try {
          if (fs.statSync(fp).isDirectory()) {
            scan(fp);
          }
        } catch {}
      }
    };

    scan(root);
    return projects;
  }
}
