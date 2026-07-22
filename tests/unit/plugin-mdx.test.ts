import { describe, it, expect, vi } from 'vitest';
import { parseFrontmatter } from '../../packages/plugin-mdx/src/Frontmatter.js';
import { formatFrontmatterExports } from '../../packages/plugin-mdx/src/Exports.js';
import { compileMDX } from '../../packages/plugin-mdx/src/MDXCompiler.js';
import { extractMDXDependencies } from '../../packages/plugin-mdx/src/DependencyScanner.js';
import { injectMDXHMRCode } from '../../packages/plugin-mdx/src/HMR.js';
import { mdx } from '../../packages/plugin-mdx/src/MDXPlugin.js';

describe('Official @ray/plugin-mdx Package (PR-30)', () => {
  it('1. should parse YAML frontmatter and separate document content', () => {
    const raw = `---\ntitle: Ray MDX\nauthor: Ray Team\nisPublished: true\ncount: 42\ntags:\n  - mdx\n  - docs\n---\n\n# Header Content`;
    const res = parseFrontmatter(raw);

    expect(res.data.title).toBe('Ray MDX');
    expect(res.data.author).toBe('Ray Team');
    expect(res.data.isPublished).toBe(true);
    expect(res.data.count).toBe(42);
    expect(res.data.tags).toEqual(['mdx', 'docs']);
    expect(res.content.trim()).toBe('# Header Content');
  });

  it('2. should format frontmatter exports properly', () => {
    const data = { title: 'MDX Doc', author: 'Ray Team', count: 10 };
    const code = formatFrontmatterExports(data);

    expect(code).toContain('export const frontmatter = {');
    expect(code).toContain('"title": "MDX Doc"');
    expect(code).toContain('export const title = "MDX Doc";');
    expect(code).toContain('export const author = "Ray Team";');
    expect(code).toContain('export const count = 10;');
  });

  it('3. should compile MDX to React JSX and export frontmatter metadata', async () => {
    const raw = `---\ntitle: Overview\n---\n\n# Heading 1\n\n<div>Body text</div>`;
    const res = await compileMDX(raw, { filepath: 'overview.mdx' });

    expect(res.code).toContain('export const frontmatter = {\n  "title": "Overview"\n};');
    expect(res.code).toContain('export default function MDXContent(');
    expect(res.code).toContain('<h1>Heading 1</h1>');
    expect(res.code).toContain('<div>Body text</div>');
    expect(res.code).toContain('import.meta.hot.accept');
  });

  it('4. should scan imported components, side-effect imports, and embedded images', () => {
    const content = `import Header from './Header.tsx';\nimport './styles.css';\n\n![Logo](./logo.png)\n<img src="./banner.jpg" />`;
    const deps = extractMDXDependencies(content);

    expect(deps).toContain('./Header.tsx');
    expect(deps).toContain('./styles.css');
    expect(deps).toContain('./logo.png');
    expect(deps).toContain('./banner.jpg');
  });

  it('5. should inject HMR code and trigger handleHotUpdate', async () => {
    const code = 'export default function Component() {}';
    const hmrCode = injectMDXHMRCode(code);

    expect(hmrCode).toContain('import.meta.hot.accept');

    const plugin = mdx();
    const mockCache = { invalidate: vi.fn() };
    const mockGraph = { invalidate: vi.fn() };

    const ctx = {
      cache: mockCache,
      graph: mockGraph,
    };

    await plugin.handleHotUpdate.call(ctx, { file: 'doc.mdx', timestamp: Date.now() });
    expect(mockCache.invalidate).toHaveBeenCalledWith('doc.mdx');
    expect(mockGraph.invalidate).toHaveBeenCalledWith('doc.mdx');
  });

  it('6. should run plugin transform hook on .mdx files and ignore non-mdx files', async () => {
    const plugin = mdx();
    const raw = `---\ntitle: Plugin Test\n---\n# Title`;

    const nonMdx = await plugin.transform(raw, 'doc.ts');
    expect(nonMdx).toBeNull();

    const mdxRes = await plugin.transform(raw, 'doc.mdx');
    expect(mdxRes).toBeDefined();
    expect(mdxRes.code).toContain('export const frontmatter');
  });

  it('7. should support plugin configuration with remark and rehype plugins', async () => {
    let remarkCalled = false;
    let rehypeCalled = false;

    const mockRemarkPlugin = () => () => {
      remarkCalled = true;
    };
    const mockRehypePlugin = () => () => {
      rehypeCalled = true;
    };

    const res = await compileMDX('# Test Config', {
      remarkPlugins: [mockRemarkPlugin],
      rehypePlugins: [mockRehypePlugin],
    });

    expect(remarkCalled).toBe(true);
    expect(rehypeCalled).toBe(true);
    expect(res.code).toContain('MDXContent');
  });

  it('8. should generate valid source maps', async () => {
    const raw = '# Hello Source Map';
    const res = await compileMDX(raw, { filepath: 'test.mdx' });

    expect(res.map).toBeDefined();
    expect(res.map.file).toBe('test.mdx');
    expect(res.map.sources).toContain('test.mdx');
    expect(res.map.sourcesContent).toContain(raw);
  });

  it('9. should reuse cache when available in plugin context', async () => {
    const plugin = mdx();
    const cacheMap = new Map();
    const mockCache = {
      get: vi.fn((key: string) => cacheMap.get(key)),
      set: vi.fn((key: string, val: any) => cacheMap.set(key, val)),
    };

    const ctx = { cache: mockCache };
    const raw = '# Cache Test';

    const res1 = await plugin.transform.call(ctx, raw, 'test.mdx');
    expect(mockCache.set).toHaveBeenCalled();
    expect(res1).toBeDefined();

    const res2 = await plugin.transform.call(ctx, raw, 'test.mdx');
    expect(mockCache.get).toHaveBeenCalled();
    expect(res2).toEqual(res1);
  });

  it('10. should produce JSX compatible with SSR and SSG prerendering', async () => {
    const raw = `---\ntitle: SSR Page\n---\n\n# SSR Heading\n\n<p>SSR content</p>`;
    const res = await compileMDX(raw);

    // Verify SSR/SSG contract: exports default function component and frontmatter metadata
    expect(res.frontmatter.title).toBe('SSR Page');
    expect(res.code).toContain('export default function MDXContent(');
    expect(res.code).toContain('<h1>SSR Heading</h1>');
  });
});
