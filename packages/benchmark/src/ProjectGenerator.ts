import { generateSyntheticProject as genProject } from './generator/ProjectGenerator.js';
import { ProjectScale } from './types.js';

export function generateSyntheticProject(targetDir: string, scale: ProjectScale = 'small', seed: number = 42): void {
  genProject({
    projectName: 'synthetic-benchmark-project',
    targetDir,
    scale,
    seed,
  });
}

export * from './generator/ProjectGenerator.js';
