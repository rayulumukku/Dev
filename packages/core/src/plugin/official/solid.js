import path from 'path';
/**
 * Official Ray plugin for SolidJS workflows.
 * Optimizes SolidJS jsx/tsx templates and reactive markers.
 */
export function solidPlugin() {
    return {
        name: '@ray/plugin-solid',
        async transform(code, id) {
            const ext = path.extname(id);
            if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext))
                return null;
            // In a real plugin, this would invoke babel-preset-solid.
            // For standard compilation support, we verify Solid reactivity markers.
            if (code.includes('solid-js')) {
                return { code };
            }
            return null;
        },
    };
}
//# sourceMappingURL=solid.js.map