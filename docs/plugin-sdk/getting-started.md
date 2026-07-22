# Official Ray Plugin SDK (`@ray/plugin-sdk`)

The `@ray/plugin-sdk` package provides a stable, versioned toolkit for authoring, testing, validating, and publishing Ray plugins.

## Features

- **`definePlugin()` Helper**: Type-safe plugin factory function.
- **Scaffolding CLI (`create-ray-plugin`)**: Generate plugin templates (`basic`, `transform`, `resolver`, `asset`, `analyzer`).
- **Version Negotiation**: `PluginVersion` bounds checking (`minRayVersion`, `maxRayVersion`).
- **Testing Harness**: Lightweight testing utilities (`createMockPluginContext`, `testTransformHook`, `testResolveHook`).
- **Validation & Docs**: Automated plugin validation (`ray plugin validate`) and Markdown documentation generation (`ray plugin docs`).
- **Config Schemas**: Schema validation for user plugin options.

## Getting Started

### 1. Scaffolding a New Plugin

```bash
npx create-ray-plugin my-plugin --template transform
```

### 2. Authoring a Plugin

```typescript
import { definePlugin } from '@ray/plugin-sdk';

export interface MyPluginOptions {
  header?: string;
}

export const myPlugin = definePlugin<MyPluginOptions>((options = {}) => {
  return {
    name: 'ray-plugin-custom',
    version: '1.0.0',
    description: 'Custom Ray build transform plugin.',
    compatibility: {
      minRayVersion: '1.0.0',
    },
    async transform(code, id) {
      if (!id.endsWith('.custom')) return null;
      return { code: `// ${options.header || 'Generated'}\n${code}` };
    },
  };
});
```

### 3. Validating & Documenting Plugins

```bash
# Validate active plugins
ray plugin validate

# Generate API documentation
ray plugin docs
```

### 4. Testing Plugins

```typescript
import { describe, it, expect } from 'vitest';
import { testTransformHook } from '@ray/plugin-sdk';
import { myPlugin } from './index.js';

describe('myPlugin', () => {
  it('should transform .custom files', async () => {
    const plugin = myPlugin({ header: 'Header' });
    const result = await testTransformHook(plugin, 'const a = 1;', 'doc.custom');
    expect(result.code).toContain('Header');
  });
});
```
