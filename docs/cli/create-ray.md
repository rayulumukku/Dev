# `create-ray` CLI (`npm create ray@latest`)

The `create-ray` executable package allows developers to scaffold new Ray projects instantly.

## Quickstart

```bash
# Interactive setup
npm create ray@latest

# Specify project name and template
npm create ray@latest my-app --template react-ts
```

## Available Templates

- `react` / `react-ts`: React 18 SPA template (JS / TS)
- `vue` / `vue-ts`: Vue 3 SFC template with `@ray/plugin-vue`
- `svelte` / `svelte-ts`: Svelte 4 template
- `solid` / `solid-ts`: SolidJS template
- `vanilla` / `vanilla-ts`: Lightweight HTML/JS/TS template
- `library`: Ray library compilation template (`ray build --lib`)

## Output Files

`create-ray` generates a production-ready file structure including `package.json`, `ray.config.ts` (or `.js`), `index.html`, source code inside `src/`, `.gitignore`, and `tsconfig.json`.
