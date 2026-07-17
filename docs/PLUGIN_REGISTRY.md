# Ray Plugin Registry & Catalog

Discover official and community plugins for the Ray compilation engine, or register your own!

## 📦 Official Plugins

Official plugins are maintained in the monorepo core and exported directly by `@ray/core`:

| Plugin Name | Export Symbol | Purpose |
|-------------|---------------|---------|
| `@ray/plugin-react` | `react` | HMR state preservation & createRoot wrapper |
| `@ray/plugin-vue` | `vue` | Vue SFC compiling and template rendering |
| `@ray/plugin-svelte` | `svelte` | Svelte compiling and stylesheet injection |
| `@ray/plugin-solid` | `solid` | SolidJS reactive tracking and template checks |
| `@ray/plugin-mdx` | `mdx` | Markdown components integration |
| `@ray/plugin-svg` | `svg` | Inline / React wrappers for SVG graphics |
| `@ray/plugin-wasm` | `wasm` | WebAssembly modules serving |
| `@ray/plugin-tailwind`| `tailwind`| CSS directives and utilities expansion |
| `@ray/plugin-eslint` | `eslint` | Core compiler static syntax diagnostics |
| `@ray/plugin-pwa` | `pwa` | Progressive Web App registration injection |
| `@ray/plugin-image` | `image` | Optimizations and image assets metadata |

---

## 🚀 Registering a Community Plugin

To register a community plugin:
1. Scaffold your plugin workspace using `ray create plugin <name>`.
2. Publish to npm under a descriptive name (e.g. `ray-plugin-graphql`).
3. Add your package to the `Community Plugins` table in this file via a Pull Request!
