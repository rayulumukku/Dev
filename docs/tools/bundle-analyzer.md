# Official Ray Bundle Analyzer (`@ray/plugin-analyzer`)

The `@ray/plugin-analyzer` package provides interactive, visual bundle size analysis for Ray applications. It helps developers inspect bundle breakdown, module contributions, chunk relationships, duplicate dependencies, tree-shaking efficiency, and automated performance recommendations.

## Features

- **Interactive Treemap**: Visual representation of modules sized proportionally by transformed byte output.
- **Chunk & Asset Breakdown**: Detailed metrics for JS chunks, CSS stylesheets, images, and fonts with estimated Gzip and Brotli compression sizes.
- **Tree-Shaking Efficiency**: Quantifies dead code byte savings and tree-shaken export percentages.
- **Duplicate Package Detector**: Automatically flags duplicate third-party dependencies bundled across multiple versions or chunks.
- **Automated Recommendations**: Actionable insights pointing out oversized assets, heavy dependencies, and chunk splitting optimization opportunities.
- **Self-Contained Offline UI**: Generates a zero-dependency HTML dashboard viewable offline.

## Installation & Setup

Add to `ray.config.ts`:

```typescript
import { analyzer } from '@ray/plugin-analyzer';

export default {
  plugins: [
    analyzer({
      open: true,
      outDir: 'dist/analyzer',
    }),
  ],
};
```

## CLI Usage

You can run production bundle analysis directly from the command line:

```bash
# Build project and launch interactive report in default browser
ray analyze --open

# Output custom JSON and HTML report files to a specific directory
ray analyze --output ./reports --json --html

# Trigger analyzer during production build
ray build --analyze
```

### CLI Options

| Flag | Description | Default |
| --- | --- | --- |
| `--open` | Automatically open the interactive HTML report in browser | `false` |
| `--json` | Generate structured `bundle-analyzer.json` report | `true` |
| `--html` | Generate interactive `bundle-analyzer.html` report | `true` |
| `--output <dir>` | Specify destination directory for report files | `dist/analyzer` |

## Interpreting Reports

The generated HTML dashboard includes 4 primary views:

1. **Treemap**: Hierarchical visual boxes representing individual modules. Larger boxes highlight candidate modules for optimization.
2. **Modules Table**: Searchable and filterable list showing raw vs transformed module sizes, node_modules origin, and tree-shaking status.
3. **Assets & Chunks**: Overview of generated build artifacts, file extensions, and estimated compressed sizes.
4. **Recommendations**: Automated performance alerts with explanations of why issues matter and concrete steps to resolve them.

## Optimization Recommendations

The recommendation engine checks for:

- **Duplicate Packages**: Multiple versions of packages like `lodash` or `react-router` bundled together.
- **Oversized Assets**: Images or static files > 250 KB that should be compressed or converted to WebP/AVIF.
- **Large Dependencies**: Third-party packages > 150 KB that could be replaced by smaller libraries or lazy-loaded.
- **Chunk Splitting**: Excessive chunk generation (> 15 tiny chunks) or single massive monolithic bundles.

## Troubleshooting

### Report is empty or not generated
Ensure your build produces output and that the analyzer plugin is registered in your `plugins` array in `ray.config.ts` or executed via `ray analyze`.

### Report fails to open automatically
When running in headless or SSH environments, the `--open` browser launch may be skipped. Open `dist/analyzer/bundle-analyzer.html` directly in your browser.
