export function extractMDXDependencies(content: string): string[] {
  const deps = new Set<string>();

  // 1. ES import statements
  const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    deps.add(match[1]);
  }

  // Side-effect imports: import './style.css';
  const sideEffectRegex = /import\s+['"]([^'"]+)['"]/g;
  while ((match = sideEffectRegex.exec(content)) !== null) {
    deps.add(match[1]);
  }

  // 2. Markdown images: ![alt](url)
  const imgRegex = /!\[.*?\]\((.*?)\)/g;
  while ((match = imgRegex.exec(content)) !== null) {
    deps.add(match[1]);
  }

  // 3. JSX img tags: <img src="url" ... />
  const jsxImgRegex = /<img\s+[^>]*src=['"]([^'"]+)['"]/g;
  while ((match = jsxImgRegex.exec(content)) !== null) {
    deps.add(match[1]);
  }

  return Array.from(deps);
}
