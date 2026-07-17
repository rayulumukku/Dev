import { RayCore } from '@ray/core';

// In-memory cache for compiled bare packages to avoid re-bundling
const barePackageCache = new Map<string, string>();

/**
 * Intercepts and serves virtual module requests starting with /@modules/.
 * Resolves packages to their entry files, bundles them to ESM on-the-fly,
 * and caches them with aggressive cache headers.
 */
export async function handleModuleRequest(
  ray: RayCore,
  urlPath: string,
  res: any
): Promise<boolean> {
  if (!urlPath.startsWith('/@modules/')) {
    return false;
  }

  const specifier = urlPath.slice('/@modules/'.length);

  const getPackageName = (spec: string): string => {
    const parts = spec.split('/');
    if (spec.startsWith('@')) {
      return `${parts[0]}/${parts[1]}`;
    }
    return parts[0];
  };

  // Check if this bare specifier (or its resolved file) was optimized
  if (ray.optimizerResult) {
    const packageName = getPackageName(specifier);
    if (ray.optimizerResult.optimized[packageName]) {
      try {
        const resolvedPackage = ray.resolve(packageName, ray.projectRoot);
        const resolvedSpecifier = ray.resolve('/@modules/' + specifier, ray.projectRoot);
        if (resolvedPackage === resolvedSpecifier) {
          const redirectUrl = ray.optimizerResult.optimized[packageName];
          res.writeHead(302, { 'Location': redirectUrl });
          res.end();
          return true;
        }
      } catch {
        // Ignore resolution failures
      }
    }
  }

  try {
    let code = barePackageCache.get(specifier);
    if (!code) {
      console.log(`[Ray Compiler] Resolving and bundling package: ${specifier}`);
      code = await ray.bundleBarePackage(specifier, ray.projectRoot);
      barePackageCache.set(specifier, code);
    }

    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache',
    });
    res.end(code);
    return true;
  } catch (err: any) {
    console.error(`[Ray Server] Error serving bare module "${specifier}":`, err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Failed to resolve package "${specifier}": ${err.message}`);
    return true;
  }
}

/**
 * Serves the /__ray/graph debug diagnostic endpoint returning the dependency graph.
 */
export function handleDiagnosticsRequest(ray: RayCore, urlPath: string, res: any): boolean {
  if (urlPath === '/__ray/graph') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(ray.graph.toJSON(), null, 2));
    return true;
  }
  return false;
}
