# Server-Side Rendering (SSR) Architecture (`@ray/ssr`)

Ray provides opt-in, framework-agnostic Server-Side Rendering (SSR) support for React, Vue, and vanilla HTML applications.

## Configuration

Enable in `ray.config.ts`:

```typescript
export default {
  ssr: {
    enabled: true,
    entry: './src/entry-server.ts',
    clientEntry: './src/main.tsx',
    streaming: true,
  },
};
```

## Production Build Output

```
dist/
  ├── client/             # Hydration client bundles
  ├── server/             # SSR Node/server entry bundles
  ├── manifest.json       # Production asset manifest
  └── ssr-manifest.json   # SSR module-to-client bundle mapping
```
