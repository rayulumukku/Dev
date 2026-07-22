# PostCSS Integration (`@ray/plugin-css`)

Ray supports standard PostCSS workflows automatically through `@ray/plugin-css`.

## Configuration Discovery

`@ray/plugin-css` automatically searches upward from the project root for any of the following config files:

- `postcss.config.js`
- `postcss.config.cjs`
- `postcss.config.mjs`
- `postcss.config.ts`
- `.postcssrc`
- `.postcssrc.json`
- `.postcssrc.yaml`
- `package.json` (`postcss` field)

## Processing Lifecycle

```
CSS Input
    ↓
Check for PostCSS config
    ├── No config → Fast path (direct style injection)
    └── Has config → Run PostCSS plugins → In-place HMR / Production Bundle
```

## Performance & Fast Path

Projects without a PostCSS configuration run on a zero-overhead fast path. Configurations, processor pipelines, and transform results are cached in memory for instant incremental rebuilds.
