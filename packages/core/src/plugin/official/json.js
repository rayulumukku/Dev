/**
 * Official Ray plugin for JSON files.
 * Transforms raw JSON strings into default objects and named exports.
 */
export function jsonPlugin() {
    return {
        name: '@ray/plugin-json',
        async transform(code, id) {
            if (!id.endsWith('.json'))
                return null;
            try {
                const parsed = JSON.parse(code);
                let transformed = `const data = ${JSON.stringify(parsed)};\nexport default data;\n`;
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                    for (const [key, value] of Object.entries(parsed)) {
                        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
                            transformed += `export const ${key} = ${JSON.stringify(value)};\n`;
                        }
                    }
                }
                return { code: transformed };
            }
            catch (err) {
                throw new Error(`[Ray JSON Plugin] Parsing error in "${id}": ${err.message}`);
            }
        },
    };
}
//# sourceMappingURL=json.js.map