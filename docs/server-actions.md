# Experimental Server Actions Support (`@ray/server-actions`)

The `@ray/server-actions` package provides a generic, framework-agnostic Server Actions infrastructure for Ray, enabling server-side mutations, form submissions, security validation, and Flight/HTTP endpoint dispatches.

## Features

- **Action Discovery & Compilation**: Automatically registers `"use server"` functions and exports into bound action references.
- **Security Protections**: CSRF token verification (`validateCSRF`), configurable payload size enforcement (`validatePayloadSize`), and action ID validation.
- **Manifest Generation**: Generates `dist/server-actions-manifest.json` mapping action identifiers to module filepaths and function names.
- **Action Serialization & Dispatcher**: Handles argument serialization/deserialization (`FormData`, primitives) and error propagation.
- **Plugin Integration**: Integrates directly with `@ray/plugin-react` and experimental RSC support.

## Configuration

Configure Server Actions in `ray.config.ts`:

```typescript
import { defineConfig, react } from '@ray/core';

export default defineConfig({
  plugins: [
    react({
      rsc: { enabled: true, experimental: true },
      serverActions: {
        enabled: true,
        experimental: true,
        maxPayloadSize: '2mb',
        csrfProtection: true,
      },
    }),
  ],
});
```

## Creating a Server Action

Declare actions using the `"use server"` directive:

```javascript
"use server";

export async function submitForm(formData) {
  const name = formData.get('name');
  console.log(`Processing action on server for: ${name}`);
  return { success: true, name };
}
```

## Security Considerations

1. **CSRF Tokens**: Pass CSRF headers on action requests when `csrfProtection` is enabled.
2. **Payload Size**: Configure `maxPayloadSize` (e.g. `'2mb'`, `'500kb'`) to prevent denial-of-service payload overflow.
