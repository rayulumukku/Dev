# CSS Modules Support (`@ray/plugin-css`)

Ray provides full CSS Modules support for files matching the `*.module.css` naming convention via `@ray/plugin-css`.

## Naming Conventions & Scoping Strategy

- **File Naming**: Any file ending in `*.module.css` is automatically compiled as a CSS Module.
- **Development Scoping**: Class names are rewritten into human-readable scoped names: `[filename]_[local]__[hash]` (e.g. `Button_button__abc12`).
- **Production Scoping**: Class names are minified into short, deterministic hash selectors (e.g. `_abc12`).

## ESM Import & Export Compatibility

```typescript
import styles, { primaryButton } from './Button.module.css';

// Default export provides full dictionary object
console.log(styles.container); // "Button_container__abc12"

// Named exports provide individual class name bindings
console.log(primaryButton); // "Button_primaryButton__abc12"
```

## In-Place HMR Behavior

Editing a `*.module.css` file injects updated CSS rules directly into the document head and updates exported class mappings without triggering a full page reload or disrupting React/Vue component state.
