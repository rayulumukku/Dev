import path from 'path';
/**
 * Official Ray plugin for image assets (png, jpeg, gif, webp).
 * Compiles images and exports default asset metadata.
 */
export function imagePlugin() {
    return {
        name: '@ray/plugin-image',
        async transform(code, id) {
            const cleanId = id.split('?')[0];
            const ext = path.extname(cleanId).toLowerCase();
            if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext))
                return null;
            const relPath = '/' + path.relative(this.projectRoot, cleanId).replace(/\\/g, '/');
            if (id.includes('?raw') || id.includes('&raw')) {
                return { code: `export default ${JSON.stringify(code)};` };
            }
            const metadata = {
                src: relPath,
                width: 800,
                height: 600,
                format: ext.slice(1),
            };
            return {
                code: `export default ${JSON.stringify(metadata)};`
            };
        },
    };
}
//# sourceMappingURL=image.js.map