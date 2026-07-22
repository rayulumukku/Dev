import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../../packages/plugin-mdx/src/Frontmatter.js';
import { compileMDX } from '../../packages/plugin-mdx/src/MDXCompiler.js';
import { extractMDXDependencies } from '../../packages/plugin-mdx/src/DependencyScanner.js';
import { mdx } from '../../packages/plugin-mdx/src/MDXPlugin.js';

describe('Official @ray/plugin-mdx Package (PR-30)', () => {
  it('should parse YAML frontmatter and separate document content', () => {
    const raw = `---\ntitle: Ray MDX\ntags:\n  - mdx\n  - docs\n---\n\n# Header Content`;
    const res = parseFrontmatter(raw);

    expect(res.data.title).toBe('Ray MDX');
    expect(res.data.tags).toEqual(['mdx', 'docs']);
    expect(res.content.trim()).toBe('# Header Content');
  });

  it('should compile MDX to React JSX and export frontmatter metadata', async () => {
    const raw = `---\ntitle: Overview\n---\n\n<div>Body text</div>`;
    const res = await compileMDX(raw);

    expect(res.code).toContain('export const frontmatter = {\n  "title": "Overview"\n};');
    expect(res.code).toContain('export default function MDXContent()');
    expect(res.code).toContain('import.meta.hot.accept');
  });

  it('should scan imported components and embedded images from MDX', () => {
    const content = `import Header from './Header.tsx';\n\n![Logo](./logo.png)`;
    const deps = extractMDXDependencies(content);

    expect(deps).toContain('./Header.tsx');
    expect(deps).toContain('./logo.png');
  });

  it('should run plugin transform hook on .mdx files', async () => {
    const plugin = mdx();
    const raw = `---\ntitle: Plugin Test\n---\n# Title`;

    const nonMdx = await plugin.transform(raw, 'doc.ts');
    expect(nonMdx).toBeNull();

    const mdxRes = await plugin.transform(raw, 'doc.mdx');
    expect(mdxRes).toBeDefined();
    expect(mdxRes.code).toContain('export const frontmatter');
  });
});
