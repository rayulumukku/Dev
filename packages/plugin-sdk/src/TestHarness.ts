import { SDKPluginContext } from './types.js';
import { createPluginContext } from './PluginContext.js';
import { RayPluginDefinition } from './Plugin.js';

export function createMockPluginContext(
  pluginName = 'test-plugin',
  options: { projectRoot?: string; buildMode?: 'development' | 'production' } = {}
): SDKPluginContext {
  return createPluginContext(pluginName, options.projectRoot, options.buildMode);
}

export async function testTransformHook(
  plugin: RayPluginDefinition,
  code: string,
  id: string,
  mockContext?: SDKPluginContext
): Promise<{ code: string; map?: any } | string | null> {
  if (typeof plugin.transform !== 'function') {
    return null;
  }
  const ctx = mockContext || createMockPluginContext(plugin.name);
  return plugin.transform.call(ctx, code, id);
}

export async function testResolveHook(
  plugin: RayPluginDefinition,
  id: string,
  importer?: string,
  mockContext?: SDKPluginContext
): Promise<string | null> {
  if (typeof plugin.resolveId !== 'function') {
    return null;
  }
  const ctx = mockContext || createMockPluginContext(plugin.name);
  return plugin.resolveId.call(ctx, id, importer);
}
