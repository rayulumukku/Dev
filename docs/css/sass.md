# Sass and SCSS Support (`@ray/plugin-css`)

Ray provides first-class support for Sass and SCSS files (`.scss`, `.sass`, `.module.scss`, `.module.sass`) via `@ray/plugin-css`.

## Supported Formats

- `.scss`: Standard SCSS curly-brace syntax with variables, mixins, nesting, `@use`, `@forward`, `@import`.
- `.sass`: Indented Sass syntax.
- `.module.scss` / `.module.sass`: Combined Sass compilation and CSS Modules scoping.

## Pipeline Integration

```
SCSS / Sass Input
        ↓
   Sass Compiler (variables, mixins, imports)
        ↓
   CSS Modules (if *.module.*)
        ↓
   Tailwind CSS (if configured)
        ↓
   PostCSS Pipeline & In-Place HMR
```

## Performance & Fast Path

Projects not using Sass incur zero additional overhead. Imported partials (`_variables.scss`) are tracked in `@ray/plugin-css` dependency graph so updating a partial invalidates dependent stylesheets without full page reloads.
