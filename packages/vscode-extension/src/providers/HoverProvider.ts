import { RAY_CONFIG_SCHEMA } from '../config/schema.js';

export function getHoverDoc(key: string): string | null {
  const opt = RAY_CONFIG_SCHEMA.find((o) => o.key === key || o.key.endsWith(`.${key}`));
  if (!opt) return null;

  return `**Ray Config:** \`${opt.key}\`\n\n${opt.description}\n\n- **Type:** \`${opt.type}\`\n- **Default:** \`${opt.default}\``;
}
