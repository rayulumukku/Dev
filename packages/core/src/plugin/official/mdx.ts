import { RayPlugin } from '../index.js';

/**
 * Official Ray plugin for MDX and Markdown files.
 * Parses frontmatter YAML parameters and translates headings, paragraphs, and list elements into JSX React tags.
 */
export function mdxPlugin(): RayPlugin {
  return {
    name: '@ray/plugin-mdx',

    async transform(code, id) {
      if (!id.includes('.mdx') && !id.includes('.md')) return null;

      let md = code;
      const frontmatter: Record<string, string> = {};

      // Parse YAML Frontmatter blocks bounded by ---
      if (md.startsWith('---')) {
        const nextDashes = md.indexOf('---', 3);
        if (nextDashes !== -1) {
          const yaml = md.slice(3, nextDashes);
          md = md.slice(nextDashes + 3);

          const lines = yaml.split('\n');
          for (const line of lines) {
            const idx = line.indexOf(':');
            if (idx !== -1) {
              const k = line.slice(0, idx).trim();
              const v = line.slice(idx + 1).trim();
              frontmatter[k] = v.replace(/^["']|["']$/g, '');
            }
          }
        }
      }

      // Convert simple markdown headings and lists into static React elements
      const lines = md.split('\n');
      const childrenElements: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('# ')) {
          childrenElements.push(`React.createElement('h1', { style: { fontSize: '2.5rem', color: '#6366f1', margin: '1.5rem 0' } }, ${JSON.stringify(trimmed.slice(2))})`);
        } else if (trimmed.startsWith('## ')) {
          childrenElements.push(`React.createElement('h2', { style: { fontSize: '1.8rem', color: '#a5b4fc', margin: '1.2rem 0' } }, ${JSON.stringify(trimmed.slice(3))})`);
        } else if (trimmed.startsWith('### ')) {
          childrenElements.push(`React.createElement('h3', { style: { fontSize: '1.4rem', color: '#f1f1f5', margin: '1rem 0' } }, ${JSON.stringify(trimmed.slice(4))})`);
        } else if (trimmed.startsWith('- ')) {
          childrenElements.push(`React.createElement('li', { style: { color: '#9ca3af', margin: '0.5rem 0' } }, ${JSON.stringify(trimmed.slice(2))})`);
        } else {
          childrenElements.push(`React.createElement('p', { style: { color: '#d1d5db', lineHeight: '1.6', margin: '0.8rem 0' } }, ${JSON.stringify(trimmed)})`);
        }
      }

      const componentCode = `
import React from 'react';

export const frontmatter = ${JSON.stringify(frontmatter, null, 2)};

export default function MDXContent(props) {
  return React.createElement('div', { ...props, className: 'mdx-body', style: { padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' } },
    ${childrenElements.length > 0 ? childrenElements.join(',\n    ') : `React.createElement('div', null)`}
  );
}
`;
      return { code: componentCode };
    },
  };
}
