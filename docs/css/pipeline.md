# Plugin-Based CSS Pipeline (`@ray/plugin-css`)

Ray uses an extensible, plugin-based architecture for CSS processing provided by the official `@ray/plugin-css` package.

## Pipeline Architecture

```
CSS File (.css)
      ↓
1. load (read CSS source)
      ↓
2. cache & dependency tracking (extract @import statements)
      ↓
3. transform (generate JS module with style element injection)
      ↓
4. in-place HMR update (update style element innerHTML without JS reload)
```

## Features

- **Nested @import Tracking**: Tracks `@import` declarations to propagate invalidation to parent CSS modules.
- **In-Memory Caching**: `CSSCache` maintains module metadata, timestamp invalidation, and hash comparisons.
- **In-Place CSS HMR**: Updates dynamic `<style data-ray-css="...">` tags in real time without triggering full JavaScript reloads or resetting component state.
- **Zero Core Footprint**: Ray core packages remain completely agnostic of CSS processing implementation details.
