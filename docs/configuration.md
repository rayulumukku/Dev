# Configuration

Configure Ray through a `ray.config.ts` or `ray.config.js` file in your project root.

```typescript
import { defineConfig } from '@ray/core';

export default defineConfig({
  mode: 'development',
  outDir: 'dist',
  plugins: [],
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```
