import fs from 'fs';
import path from 'path';
import { GeneratorOptions } from '../types.js';
import { PROFILES, SeededPRNG } from './Config.js';
import { generateAssets } from './AssetGenerator.js';
import { generateUtils } from './DependencyGenerator.js';
import { generateRoutes } from './RouteGenerator.js';
import { generateReactComponents } from './ReactGenerator.js';

export function generateSyntheticProject(options: GeneratorOptions): void {
  const { projectName, targetDir, scale, seed = 42 } = options;
  const profile = PROFILES[scale] || PROFILES['small'];
  const prng = new SeededPRNG(seed);

  fs.mkdirSync(targetDir, { recursive: true });
  const srcDir = path.join(targetDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  // 1. Assets
  generateAssets(path.join(srcDir, 'assets'), profile.assetsCount, prng);

  // 2. Utils
  generateUtils(path.join(srcDir, 'utils'), Math.round(profile.componentsCount / 5));

  // 3. Routes
  generateRoutes(path.join(srcDir, 'routes'), profile.routesCount);

  // 4. Components
  generateReactComponents(path.join(srcDir, 'components'), profile.componentsCount);

  // 5. Main entry & index.html
  const mainTsx = `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport Component${profile.componentsCount - 1} from './components/Component${profile.componentsCount - 1}';\n\nReactDOM.createRoot(document.getElementById('app')!).render(<Component${profile.componentsCount - 1} />);\n`;
  fs.writeFileSync(path.join(srcDir, 'main.tsx'), mainTsx);

  const html = `<!DOCTYPE html><html><head><title>${projectName}</title></head><body><div id="app"></div><script type="module" src="/src/main.tsx"></script></body></html>`;
  fs.writeFileSync(path.join(targetDir, 'index.html'), html);

  // 6. package.json & .env
  const pkgJson = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    scripts: { build: 'ray build', dev: 'ray dev' },
    dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
    devDependencies: { '@ray/cli': '^1.0.0', typescript: '^5.3.3' }
  };
  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2) + '\n');
  fs.writeFileSync(path.join(targetDir, '.env'), `VITE_BENCHMARK_SEED=${seed}\n`);
}

export * from './Config.js';
export * from './AssetGenerator.js';
export * from './DependencyGenerator.js';
export * from './RouteGenerator.js';
export * from './ReactGenerator.js';
