import { RayCore } from '@ray/core';

// In-memory cache for transformed project files
interface CachedModule {
  code: string;
  mtime: number;
}
const projectFileCache = new Map<string, CachedModule>();

/**
 * Compiles/transforms a project file by calling RayCore, matching cache based on mtime.
 */
export async function transformProjectFile(
  ray: RayCore,
  filePath: string,
  rawCode: string,
  mtime: number
): Promise<string> {
  const cached = projectFileCache.get(filePath);
  if (cached && cached.mtime === mtime) {
    return cached.code;
  }

  const transformed = await ray.transform(rawCode, filePath);
  projectFileCache.set(filePath, { code: transformed, mtime });
  return transformed;
}

/**
 * Invalidates a compiled file from the dev-server memory cache.
 */
export function invalidateProjectFile(filePath: string) {
  projectFileCache.delete(filePath);
}
