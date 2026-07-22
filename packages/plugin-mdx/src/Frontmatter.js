export function parseFrontmatter(rawContent) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
  const match = rawContent.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content: rawContent };
  }

  const rawYaml = match[1];
  const content = rawContent.slice(match[0].length);
  const data = {};

  const lines = rawYaml.split(/\r?\n/);
  let currentKey = '';

  for (const line of lines) {
    if (line.trim().startsWith('- ') && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      data[currentKey].push(line.trim().slice(2).trim());
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      currentKey = key;
      if (val === '') {
        data[key] = [];
      } else {
        data[key] = val.replace(/^["']|["']$/g, '');
      }
    }
  }

  return { data, content };
}
