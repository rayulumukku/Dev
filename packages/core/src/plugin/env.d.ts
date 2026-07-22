/**
 * Parses raw environment configuration file text into key-value pairs.
 */
export declare function parseEnv(content: string): Record<string, string>;
/**
 * Loads, validates, and merges environment variables according to Mode priorities.
 */
export declare function loadEnv(mode: string, projectRoot: string, prefix?: string): Record<string, string>;
//# sourceMappingURL=env.d.ts.map