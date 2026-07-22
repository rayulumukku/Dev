export function extractMDXDependencies(content: string): string[] {
  const deps: string[] = [];
  const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;

  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    deps.push(match[1]);
  }

  const imgRegex = /!\[.*?\]\((.*?)\)/g;
  while ((match = imgRegex.exec(content)) !== null) {
    deps.push(match[1]);
  }

  return deps;
}
