# Server-Side Rendering (SSR)

Build SSR-capable frontends with Ray.

Use `ray dev --ssr` to launch dev-server with server rendering capabilities, and load modules dynamically via `ssrLoadModule`.

```typescript
const render = (await core.ssrLoadModule('src/entry-server.jsx')).render;
const { html } = await render(url);
```
