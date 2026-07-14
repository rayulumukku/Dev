# Ray Environment Configuration Documentation

This document explains the design, precedence guidelines, compilation transforms, and security model of Ray's environment variable system.

---

## 1. File Precedence Rules

Ray automatically loads and merges environment files inside the project root matching the following priority structure (highest priority overrides lowest):

1. `.env.[mode].local` (Mode-specific local configuration, e.g., `.env.development.local`)
2. `.env.[mode]` (Mode-specific base configuration, e.g., `.env.development`)
3. `.env.local` (Universal local overrides, skipped when mode is `test`)
4. `.env` (Default base configuration)

### Priority Hierarchy Diagram
```
  .env.[mode].local (Highest Override)
         ↓
     .env.[mode]
         ↓
     .env.local
         ↓
        .env        (Lowest Default)
```

---

## 2. Modes

Ray exposes the active execution mode globally. Default commands map to the following:
- `ray dev` $\rightarrow$ mode: `development`
- `ray build` $\rightarrow$ mode: `production`

You can customize the mode using the `--mode` CLI override:
```bash
# Triggers staging configurations compilation
ray build --mode staging
```

---

## 3. Client vs. Server Separation & Security Model

To prevent sensitive server-side variables (e.g. `DATABASE_URL`, `JWT_SECRET`, database credentials, private API keys) from leaking into the browser client bundles, Ray applies prefix-filtering rules:

- Only environment variables prefixed with **`RAY_`** (or a custom prefix configured via the `envPrefix` option inside `ray.config.ts`) are exposed to client-side code via `import.meta.env.*`.
- Any reference to unexposed environment variables (such as `import.meta.env.SECRET_KEY`) is replaced with `undefined` during compile-time transforms.
- Server-side Node code (including SSR engines) has access to all environmental keys via `process.env`.

---

## 4. Compile-Time Substitutions

Ray compiles environment variables into bundles at compile-time:

### Source Code
```javascript
const api = import.meta.env.RAY_API_URL;
if (import.meta.env.DEV) {
  console.log("Running in development!");
}
```

### Transformed Output
```javascript
const api = "http://dev-local-api.com";
if (true) {
  console.log("Running in development!");
}
```
*Note: Dead code branches are automatically tree-shaken and eliminated by esbuild during production builds.*

---

## 5. Advanced Config Overrides (`define`)

You can define custom global constants in `ray.config.ts`:
```typescript
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify("1.0.0"),
    __BUILD_TIME__: String(Date.now())
  }
});
```
Ray's transform engine substitutes these variables programmatically across all application modules.
