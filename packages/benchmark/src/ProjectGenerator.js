import { generateSyntheticProject as genProject } from './generator/ProjectGenerator.js';

export function generateSyntheticProject(targetDir, scale = 'small', seed = 42) {
  genProject({
    projectName: 'synthetic-benchmark-project',
    targetDir,
    scale,
    seed,
  });
}

export * from './generator/ProjectGenerator.js';
