import { RAY_CONFIG_SCHEMA } from '../config/schema.js';

export function validateConfigText(configText) {
  const diagnostics = [];
  const lines = configText.split('\n');

  const ignoreKeys = ['export', 'import', 'default', 'defineConfig', 'server', 'build', 'resolve'];

  lines.forEach((line, idx) => {
    const keyMatch = line.match(/([a-zA-Z0-9_\.]+)\s*:/);
    if (keyMatch) {
      const rawKey = keyMatch[1];
      const valid = RAY_CONFIG_SCHEMA.some(
        (opt) => opt.key === rawKey || opt.key.endsWith(`.${rawKey}`) || opt.key.startsWith(`${rawKey}.`)
      );
      if (!valid && !ignoreKeys.includes(rawKey)) {
        diagnostics.push({
          line: idx + 1,
          column: line.indexOf(rawKey) + 1,
          message: `Unknown Ray configuration key: '${rawKey}'`,
          severity: 'error',
        });
      }
    }
  });

  return diagnostics;
}
