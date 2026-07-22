import { parseFrontmatter } from './Frontmatter.js';
import { formatFrontmatterExports } from './Exports.js';
import { extractMDXDependencies } from './DependencyScanner.js';
import { injectMDXHMRCode } from './HMR.js';

export async function compileMDX(rawContent, options = {}) {
  const { data: frontmatterData, content: mdxBody } = parseFrontmatter(rawContent);
  const dependencies = extractMDXDependencies(rawContent);

  let jsxCode = `import React from 'react';\n`;
  jsxCode += formatFrontmatterExports(frontmatterData);
  jsxCode += `\nexport default function MDXContent() {\n  return (\n    <div className="mdx-content">\n      <div>${mdxBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>\n    </div>\n  );\n}\n`;

  jsxCode = injectMDXHMRCode(jsxCode);

  return {
    code: jsxCode,
    frontmatter: frontmatterData,
    dependencies,
  };
}
