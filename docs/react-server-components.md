# Experimental React Server Components (RSC) Support

Ray provides experimental opt-in support for React Server Components (RSC) on top of Ray's SSR architecture, Flight protocol transport, boundary resolver, client reference manifest generator, and build pipeline.

## Architecture

The RSC pipeline operates through `@ray/react-server`:

1. **BoundaryResolver**: Scans components for `"use client"` and `"use server"` directives, enforcing boundary constraints.
2. **ClientReferenceManifest**: Generates `dist/client-reference-manifest.json` mapping Client Component reference proxies to bundled browser chunks.
3. **FlightProtocol & FlightRenderer**: Serializes Server Component JSX trees into Flight payload streams.
4. **ServerModuleGraph**: Tracks server component boundaries and client reference dependencies in Ray's `DependencyGraph`.

## Directives

### `"use client"`
Marks a module and its transitive imports as Client Components rendered on the client browser.

```javascript
"use client";
import React, { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### `"use server"`
Marks a function or module as a Server Component / server endpoint.

## Development & CLI Flags

Enable RSC in `ray.config.ts`:

```typescript
import { defineConfig, react } from '@ray/core';

export default defineConfig({
  plugins: [
    react({
      rsc: {
        enabled: true,
        experimental: true,
      },
    }),
  ],
});
```

Run development server or production build with `--rsc`:

```bash
ray dev --ssr --rsc
ray build --ssr --rsc
```

## Limitations & Diagnostics

- Client components cannot directly import Server components; pass Server components as `children` or JSX slot props.
- Server Actions and file-system routing are reserved for subsequent milestones.
