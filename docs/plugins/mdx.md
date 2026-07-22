# Official Ray MDX Plugin (`@ray/plugin-mdx`)

The `@ray/plugin-mdx` package adds native MDX support to Ray projects.

## Installation & Setup

Add to `ray.config.ts`:

```typescript
import { mdx } from '@ray/plugin-mdx';

export default {
  plugins: [
    mdx({
      remarkPlugins: [],
      rehypePlugins: [],
    }),
  ],
};
```

## Frontmatter Support

YAML frontmatter is automatically parsed and exported as a `frontmatter` named export:

```mdx
---
title: Getting Started
author: Ray Team
---

# Hello MDX!
```

Import in React components:

```tsx
import Content, { frontmatter } from './doc.mdx';

console.log(frontmatter.title); // "Getting Started"
```
