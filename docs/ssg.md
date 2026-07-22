# Static Site Generation (`@ray/ssg`)

Ray includes first-class Static Site Generation (SSG) built on top of its Server-Side Rendering (SSR) pipeline.

## Configuration

Enable in `ray.config.ts`:

```typescript
export default {
  ssg: {
    enabled: true,
    routes: ['/', '/about', '/docs'],
    sitemap: true,
    robots: true,
    minifyHTML: true,
  },
};
```

## CLI Command

Execute an SSG build:

```bash
npx ray build --ssg
```

## Output Structure

```
dist/
  ├── index.html          # "/"
  ├── about/index.html    # "/about"
  ├── docs/index.html     # "/docs"
  ├── sitemap.xml
  ├── robots.txt
  └── manifest.json
```
