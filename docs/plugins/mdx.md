# Official Ray MDX Plugin (`@ray/plugin-mdx`)

The `@ray/plugin-mdx` package adds native, first-class MDX support to Ray bundler applications without modifying Ray's core engine.

## Features

- **Full MDX Compilation**: Compile `.mdx` files into standard React JSX components.
- **YAML Frontmatter**: Parse YAML frontmatter metadata and export it via `export const frontmatter = { ... }`.
- **Dependency Graph Integration**: Automatic discovery of imported React components, imported assets, and embedded markdown images (`![alt](./path)`).
- **HMR Support**: Granular HMR recompilation of individual MDX documents preserving application state.
- **SSR & SSG Compatibility**: Natural integration with Ray's server-side rendering and static-site generation pipelines.
- **Remark & Rehype Extensibility**: Custom plugin support configured in `ray.config.ts`.

## Installation

```bash
npm install @ray/plugin-mdx @mdx-js/mdx remark rehype
```

## Configuration

Add the plugin to your `ray.config.ts`:

```typescript
import { mdx } from '@ray/plugin-mdx';
import remarkGfm from 'remark-gfm';

export default {
  plugins: [
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [],
      jsxImportSource: 'react',
    }),
  ],
};
```

## Frontmatter Support

YAML frontmatter headers enclosed by `---` are automatically parsed and exposed as named exports.

```mdx
---
title: Getting Started with Ray MDX
author: Ray Core Team
tags:
  - mdx
  - docs
---

# Hello MDX!
```

Importing frontmatter in React components:

```tsx
import Content, { frontmatter } from './docs.mdx';

console.log(frontmatter.title); // "Getting Started with Ray MDX"
console.log(frontmatter.tags);  // ["mdx", "docs"]

export function Page() {
  return (
    <article>
      <h1>{frontmatter.title}</h1>
      <Content />
    </article>
  );
}
```

## Embedding Components & Assets

You can import and use React components or assets inside your MDX files:

```mdx
import { Callout } from './components/Callout.tsx';
import { Counter } from './components/Counter.tsx';

# Interactive Documentation

![Logo](./assets/logo.svg)

<Callout type="info">
  This callout is rendered by a custom React component.
</Callout>

<Counter />
```

## SSR & SSG Compatibility

Because `@ray/plugin-mdx` compiles `.mdx` documents into native React components, MDX files work out-of-the-box with Ray's SSR renderer (`@ray/ssr`) and SSG prerenderer (`@ray/ssg`):

```typescript
import { renderToString } from 'react-dom/server';
import MDXPage from './content.mdx';

const html = renderToString(<MDXPage />);
```

## Troubleshooting

### Frontmatter values are undefined
Ensure your frontmatter block starts on the very first line of the file and is enclosed by triple dashes (`---`).

### Imported components fail to render
Verify that component import specifiers point to valid file paths with relative paths (e.g. `./components/Button.tsx`).
