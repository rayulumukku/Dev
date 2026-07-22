/**
 * loadConfig
 *
 * Dynamically transpiles and evaluates the ray.config.ts / ray.config.js
 * configuration file using Ray's own compiler — no esbuild dependency.
 *
 * Strategy:
 *  1. Read source with fs
 *  2a. If it is a .js file: write directly as .mjs temp file (already valid ESM)
 *  2b. If it is a .ts file: apply lightweight TypeScript stripping (remove type
 *      annotations, interface blocks) and write as .mjs temp file
 *  3. dynamic import() the temp file
 *  4. Clean up the temp file
 *
 * This avoids feeding config files through Ray's full AST→codegen pipeline which
 * can produce malformed output for complex object literals.
 */
export declare function loadConfig(projectRoot: string): Promise<any>;
//# sourceMappingURL=config.d.ts.map