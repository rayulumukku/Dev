# Official Ray Project Templates (`create-ray`)

Ray provides official starter templates preconfigured for maximum developer productivity.

## Available Templates

- `react-ts`: React 18 SPA template with TypeScript.
- `react-tailwind`: React 18 + Tailwind CSS + TypeScript starter with `@ray/plugin-css`.
- `vue-ts`: Vue 3 Single File Component starter with `@ray/plugin-vue` & TypeScript.
- `minimal`: Minimal HTML/JS/CSS starter with zero dependencies.

## Usage

```bash
npm create ray@latest my-app --template react-ts
npm create ray@latest my-app --template react-tailwind
npm create ray@latest my-app --template vue-ts
npm create ray@latest my-app --template minimal
```

## Template Layout Conventions

Each template includes standard development scripts (`dev`, `build`, `preview`), a `ray.config.ts` or `ray.config.js`, source files in `src/`, static assets in `public/`, and `.gitignore`.
