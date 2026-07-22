# Tailwind CSS Support (`@ray/plugin-css`)

Ray provides automatic, first-class Tailwind CSS v3 and v4 support on top of `@ray/plugin-css`.

## Automatic Detection

Ray automatically detects Tailwind CSS configurations:

- **Tailwind v3**: Detects `tailwind.config.js`, `.cjs`, `.mjs`, or `.ts`.
- **Tailwind v4**: Detects `@import "tailwindcss"` or `@tailwind` directives in CSS files.

No Ray-specific configuration is required in `ray.config.ts`.

## Execution Lifecycle

```
CSS Input (@tailwind / @import "tailwindcss")
                      ↓
           Tailwind Detector (v3 / v4)
                      ↓
          Content Scanner (.jsx, .vue)
                      ↓
      PostCSS Pipeline & Style Tag HMR
```

## Performance & Fast Path

Projects without Tailwind installed or referenced run on a zero-overhead fast-path. Generated utility CSS is cached by content hash to ensure fast incremental updates.
