# Official Ray Angular Plugin (`@ray/plugin-angular`)

The `@ray/plugin-angular` package provides first-class Angular compilation support for Ray applications, featuring AOT template compilation, workspace integration (`angular.json`), HMR, CSS processing, and SSR/SSG static prerendering.

## Features

- **AOT Template Compilation**: Compiles inline and external Angular HTML templates into Ivy component definitions (`ɵcmp`).
- **Workspace Support (`angular.json`)**: Automatically parses `angular.json` project definitions, standalone components, and library targets.
- **State-Preserving HMR**: Fast HMR updates for component templates, styles, and component logic.
- **CSS Integration**: Integrates directly with Ray's PostCSS, Tailwind CSS, SASS, and CSS Modules pipeline.
- **SSR & SSG**: Compiles server-side rendering modules (`renderApplication` / `render`) for SSG prerendering and Node.js SSR endpoints.
- **Dependency Graph & Cache**: Integrates cleanly with Ray's `DependencyGraph`, persistent cache (`this.cache`), and incremental build engine (`@ray/incremental-build`).

## Installation

```bash
npm install @ray/plugin-angular @angular/compiler @angular/compiler-cli --save-dev
```

## Configuration

Configure the plugin in `ray.config.ts`:

```typescript
import { defineConfig } from '@ray/core';
import { angular } from '@ray/plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      aot: true,
      optimization: true,
      strictTemplates: true,
    }),
  ],
});
```

## Workspace Integration

Ray automatically detects `angular.json` workspaces:

```json
{
  "version": 1,
  "projects": {
    "my-angular-app": {
      "root": "",
      "sourceRoot": "src",
      "projectType": "application"
    }
  }
}
```

## Troubleshooting

1. **Standalone Components**: Ensure `standalone: true` is included in `@Component({})` metadata decorators when using standalone Angular APIs.
2. **Tailwind CSS Styling**: Process Tailwind utility classes by importing your global styles or configuring component `styleUrls`.
