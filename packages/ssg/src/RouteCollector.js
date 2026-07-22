import path from 'path';

export function collectSSGRoutes(routesConfig, outDir = 'dist') {
  const routes = [];

  for (const rawRoute of routesConfig) {
    const norm = rawRoute.startsWith('/') ? rawRoute : `/${rawRoute}`;
    let outputPath;

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
