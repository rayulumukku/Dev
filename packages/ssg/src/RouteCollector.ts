import path from 'path';
import { SSGRoute } from './types.js';

export function collectSSGRoutes(routesConfig: string[], outDir: string = 'dist'): SSGRoute[] {
  const routes: SSGRoute[] = [];

  for (const rawRoute of routesConfig) {
    const norm = rawRoute.startsWith('/') ? rawRoute : `/${rawRoute}`;
    let outputPath: string;

    if (norm === '/') {
      outputPath = path.join(outDir, 'index.html');
    } else {
      outputPath = path.join(outDir, norm.slice(1), 'index.html');
    }

    routes.push({
      path: norm,
      outputPath,
    });
  }

  return routes;
}
