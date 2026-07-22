import path from 'path';
/**
 * Official Ray plugin for SVG files.
 * Supports loading SVGs as React components, asset URLs, raw markup strings, or inline base64 data URIs.
 */
export function svgPlugin() {
    return {
        name: '@ray/plugin-svg',
        async transform(code, id) {
            if (!id.includes('.svg'))
                return null;
            const hasUrl = id.includes('?url') || id.includes('&url');
            const hasRaw = id.includes('?raw') || id.includes('&raw');
            const hasInline = id.includes('?inline') || id.includes('&inline');
            const cleanId = id.split('?')[0];
            const relPath = '/' + path.relative(this.projectRoot, cleanId).replace(/\\/g, '/');
            // 1. ?url format: returns asset relative URL path
            if (hasUrl) {
                return { code: `export default ${JSON.stringify(relPath)};` };
            }
            // 2. ?raw format: returns raw SVG string
            if (hasRaw) {
                return { code: `export default ${JSON.stringify(code)};` };
            }
            // 3. ?inline format: returns Base64 data-URI
            if (hasInline) {
                const base64 = Buffer.from(code).toString('base64');
                const dataUri = `data:image/svg+xml;base64,${base64}`;
                return { code: `export default ${JSON.stringify(dataUri)};` };
            }
            // 4. Default: returns React SVG wrapper component
            const svgTagOpen = code.indexOf('<svg');
            const svgTagClose = code.indexOf('>', svgTagOpen);
            const innerSvg = code.slice(svgTagClose + 1, code.lastIndexOf('</svg>'));
            const componentCode = `
import React from 'react';
export default function SvgComponent(props) {
  return React.createElement('svg', {
    ...props,
    dangerouslySetInnerHTML: { __html: ${JSON.stringify(innerSvg)} }
  });
}
`;
            return { code: componentCode };
        },
    };
}
//# sourceMappingURL=svg.js.map