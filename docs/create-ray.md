# `create-ray` Scaffolding Engine

The official `create-ray` package enables project creation using standard package managers.

## Invocation

```bash
# npm
npm create ray@latest

# pnpm
pnpm create ray

# yarn
yarn create ray

# bun
bun create ray
```

## CLI Flags

- `--template <name>`: Pre-select framework and language (`react`, `react-ts`, `vue`, `vue-ts`, `minimal`)
- `--framework <name>`: Framework option (`react`, `vue`, `minimal`)
- `--lang <ts|js>`: Language choice (`ts`, `js`)
- `--styling <none|tailwind|css>`: Styling setup (`none`, `tailwind`, `css`)
- `--pm <npm|pnpm|yarn|bun>`: Package manager selection
- `--overwrite`: Overwrite target directory if non-empty

## Architecture

`create-ray` is completely decoupled from Ray runtime libraries (`@ray/core`, `@ray/dev-server`), functioning as an independent project generator.
