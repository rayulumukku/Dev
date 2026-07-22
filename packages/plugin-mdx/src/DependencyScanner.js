export function extractMDXDependencies(content) {
  const deps = [];
  const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    deps.push(match[1]);
  }

  const imgRegex = /!\[.*?\]\((.*?)\)/g;
  while ((match = imgRegex.exec(content)) !== null) {
    deps.push(match[1]);
  }

  return deps;
}
