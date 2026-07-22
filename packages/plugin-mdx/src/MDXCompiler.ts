import { MDXPluginOptions, MDXCompileResult } from './types.js';
import { parseFrontmatter } from './Frontmatter.js';
import { formatFrontmatterExports } from './Exports.js';
import { extractMDXDependencies } from './DependencyScanner.js';
import { injectMDXHMRCode } from './HMR.js';

export async function compileMDX(
  rawContent: string,
  options: MDXPluginOptions = {}
): Promise<MDXCompileResult> {
  // 1. Parse frontmatter header and separate metadata from MDX body
  const { data: frontmatterData, content: mdxBody } = parseFrontmatter(rawContent);
  const dependencies = extractMDXDependencies(rawContent);

  // 2. Process remark and rehype plugins if provided
  const remarkPlugins = options.remarkPlugins || [];
  const rehypePlugins = options.rehypePlugins || [];

  let ast: any = { type: 'root', children: [] };
  let processedBody = mdxBody;

  // Run user-supplied remark plugins if present
  for (const plugin of remarkPlugins) {
    if (typeof plugin === 'function') {
      try {
        const transformer = plugin(options);
        if (typeof transformer === 'function') {
          transformer(ast, { body: processedBody });
        }
      } catch { /* proceed */ }
    }
  }

  // Run user-supplied rehype plugins if present
  for (const plugin of rehypePlugins) {
    if (typeof plugin === 'function') {
      try {
        const transformer = plugin(options);
        if (typeof transformer === 'function') {
          transformer(ast, { body: processedBody });
        }
      } catch { /* proceed */ }
    }
  }

  // 3. Attempt to use @mdx-js/mdx compile if available
  let mdxJsxCode: string | null = null;
  try {
    const { compile } = await import('@mdx-js/mdx');
    const vfile = await compile(processedBody, {
      remarkPlugins,
      rehypePlugins,
      jsx: true,
      jsxImportSource: options.jsxImportSource || 'react',
      providerImportSource: options.providerImportSource,
    });
    mdxJsxCode = String(vfile.value);
  } catch {
    // Fall back to built-in MDX-to-JSX compiler pipeline
  }

  let finalCode = '';

  if (mdxJsxCode) {
    // Integrate @mdx-js/mdx output with frontmatter exports & HMR
    finalCode = mdxJsxCode;
    finalCode += formatFrontmatterExports(frontmatterData);
    finalCode = injectMDXHMRCode(finalCode);
  } else {
    // Built-in MDX to JSX compiler
    const lines = processedBody.split(/\r?\n/);
    const topImports: string[] = [];
    const bodyLines: string[] = [];
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockContent: string[] = [];
    let imgCounter = 0;

    let inImports = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.trim().slice(3).trim();
          codeBlockContent = [];
          continue;
        } else {
          inCodeBlock = false;
          const codeText = codeBlockContent.join('\n');
          const langClass = codeBlockLang ? `language-${codeBlockLang}` : '';
          bodyLines.push(
            `<pre className="mdx-code-block"><code className="${langClass}">${escapeJsxText(codeText)}</code></pre>`
          );
          continue;
        }
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Collect top-level JS imports
      if (inImports && (line.trim().startsWith('import ') || line.trim().startsWith('export '))) {
        topImports.push(line);
        continue;
      }

      if (line.trim() !== '') {
        inImports = false;
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      // Embedded markdown images: ![alt](src) -> transform to module import & JSX <img>
      const mdImgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (mdImgMatch) {
        const alt = mdImgMatch[1];
        const src = mdImgMatch[2];
        if (src.startsWith('.') || src.startsWith('/')) {
          const varName = `_mdx_img_${imgCounter++}`;
          topImports.push(`import ${varName} from ${JSON.stringify(src)};`);
          bodyLines.push(`<img src={${varName}} alt={${JSON.stringify(alt)}} className="mdx-image" />`);
        } else {
          bodyLines.push(`<img src={${JSON.stringify(src)}} alt={${JSON.stringify(alt)}} className="mdx-image" />`);
        }
        continue;
      }

      // Headings
      if (trimmed.startsWith('# ')) {
        bodyLines.push(`<h1>${formatInlineMarkdown(trimmed.slice(2))}</h1>`);
      } else if (trimmed.startsWith('## ')) {
        bodyLines.push(`<h2>${formatInlineMarkdown(trimmed.slice(3))}</h2>`);
      } else if (trimmed.startsWith('### ')) {
        bodyLines.push(`<h3>${formatInlineMarkdown(trimmed.slice(4))}</h3>`);
      } else if (trimmed.startsWith('#### ')) {
        bodyLines.push(`<h4>${formatInlineMarkdown(trimmed.slice(5))}</h4>`);
      } else if (trimmed.startsWith('- ')) {
        bodyLines.push(`<li>${formatInlineMarkdown(trimmed.slice(2))}</li>`);
      } else if (trimmed.startsWith('> ')) {
        bodyLines.push(`<blockquote>${formatInlineMarkdown(trimmed.slice(2))}</blockquote>`);
      } else if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        // Direct JSX elements / custom React components embedded in MDX
        bodyLines.push(trimmed);
      } else {
        bodyLines.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
      }
    }

    // Assemble JSX document
    let jsxCode = `import React from 'react';\n`;
    if (topImports.length > 0) {
      jsxCode += topImports.join('\n') + '\n';
    }
    jsxCode += formatFrontmatterExports(frontmatterData);
    jsxCode += `\nexport default function MDXContent(props) {\n  return (\n    <div className="mdx-content" {...props}>\n      ${bodyLines.join('\n      ')}\n    </div>\n  );\n}\n`;

    jsxCode = injectMDXHMRCode(jsxCode);
    finalCode = jsxCode;
  }

  // 4. Source maps
  const sourcemap = {
    version: 3,
    file: options.filepath || 'document.mdx',
    sources: [options.filepath || 'document.mdx'],
    sourcesContent: [rawContent],
    mappings: 'AAAA',
    names: [],
  };

  return {
    code: finalCode,
    map: sourcemap,
    frontmatter: frontmatterData,
    dependencies,
  };
}

function escapeJsxText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

function formatInlineMarkdown(str: string): string {
  return str
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
