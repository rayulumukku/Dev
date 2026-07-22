/**
 * Transforms a CommonJS format module string to ESM.
 * Wraps CJS module code inside a function closure (IIFE) to isolate variable scopes
 * and prevent duplicate declaration errors under ESM.
 */
export declare function transformCjsToEsm(code: string): string;
//# sourceMappingURL=cjsTransform.d.ts.map