import { FrontmatterResult } from './types.js';

export function parseFrontmatter(rawContent: string): FrontmatterResult {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
  const match = rawContent.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content: rawContent };
  }

  const rawYaml = match[1];
  const content = rawContent.slice(match[0].length);
  const data: Record<string, any> = {};

  const lines = rawYaml.split(/\r?\n/);
  let currentKey = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- ') && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      const itemVal = parseYamlValue(trimmed.slice(2).trim());
      data[currentKey].push(itemVal);
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      const valStr = line.slice(colonIdx + 1).trim();
      currentKey = key;
      if (valStr === '') {
        data[key] = [];
      } else {
        data[key] = parseYamlValue(valStr);
      }
    }
  }

  return { data, content };
}

function parseYamlValue(valStr: string): any {
  if (valStr === 'true') return true;
  if (valStr === 'false') return false;
  if (valStr === 'null') return null;
  if (!isNaN(Number(valStr)) && valStr !== '') return Number(valStr);
  return valStr.replace(/^["']|["']$/g, '');
}
