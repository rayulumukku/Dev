import { RayConfig } from '../types.js';

/**
 * Serializes the normalized internal RayConfig into a clean JavaScript configuration string.
 */
export function generateRayConfigString(config: RayConfig): string {
  const lines: string[] = [];
  lines.push("import { defineConfig } from '@ray/core';");
  lines.push("");
  lines.push("export default defineConfig(" + formatValue(config, 0) + ");");
  lines.push("");
  return lines.join('\n');
}

function formatValue(val: any, indentLevel: number): string {
  const indent = '  '.repeat(indentLevel);
  const nextIndent = '  '.repeat(indentLevel + 1);

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';

  if (typeof val === 'string') {
    return JSON.stringify(val);
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    const items = val.map(item => formatValue(item, indentLevel + 1));
    return `[\n${nextIndent}${items.join(`,\n${nextIndent}`)}\n${indent}]`;
  }

  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) return '{}';

    const properties = keys.map(key => {
      const propVal = val[key];
      const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);

      // Handle plugins: output empty array as no conversion is done yet
      if (key === 'plugins') {
        return `${formattedKey}: []`;
      }

      return `${formattedKey}: ${formatValue(propVal, indentLevel + 1)}`;
    });

    return `{\n${nextIndent}${properties.join(`,\n${nextIndent}`)}\n${indent}}`;
  }

  return String(val);
}
