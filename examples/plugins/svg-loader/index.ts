import { definePlugin } from '@ray/plugin-sdk';

export const svgLoaderPlugin = definePlugin(() => ({
  name: 'ray-plugin-svg-loader',
  description: 'Loads inline .svg assets as React JSX component functions.',
  async transform(code, id) {
    if (!id.endsWith('.svg')) return null;
    const jsx = `import React from 'react';\nexport default function SVGComponent(props) { return <svg {...props} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(code)} }} />; }`;
    return { code: jsx };
  },
}));
