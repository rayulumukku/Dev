import { ValidationReport } from './types.js';
import { RayPluginDefinition } from './Plugin.js';
import { PluginVersion } from './Version.js';

export function validatePlugin(plugin: any, rayVersion = '1.0.0'): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!plugin || typeof plugin !== 'object') {
    return {
      valid: false,
      pluginName: 'unknown',
      errors: ['Plugin exports must be an object or definePlugin factory.'],
      warnings: [],
      compatibility: { ok: false, reason: 'Invalid plugin object' },
    };
  }

  const name = plugin.name || 'anonymous';
  if (!plugin.name) {
    errors.push('Plugin missing required property: "name"');
  }

  const validHooks = [
    'config', 'configResolved', 'resolveId', 'load', 'beforeTransform', 'transform',
    'afterTransform', 'handleHotUpdate', 'buildStart', 'buildEnd', 'generateBundle',
    'closeBundle', 'onModuleDiscovered', 'onDependencyResolved', 'onGraphInvalidated', 'onGraphUpdated'
  ];

  for (const [key, val] of Object.entries(plugin)) {
    if (key !== 'name' && key !== 'enforce' && key !== 'compatibility' && key !== 'schema' && key !== 'version' && key !== 'description' && key !== 'author') {
      if (!validHooks.includes(key)) {
        warnings.push(`Unrecognized plugin hook or property "${key}"`);
      } else if (typeof val !== 'function') {
        errors.push(`Hook "${key}" must be a function.`);
      }
    }
  }

  const compat = plugin.compatibility ? PluginVersion.checkCompatibility(plugin.compatibility, rayVersion) : { ok: true };
  if (!compat.ok && compat.reason) {
    warnings.push(`Compatibility warning: ${compat.reason}`);
  }

  return {
    valid: errors.length === 0,
    pluginName: name,
    errors,
    warnings,
    compatibility: compat,
  };
}
