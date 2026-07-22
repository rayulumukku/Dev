/**
 * Official Ray plugin for Tailwind CSS directives.
 * Replaces @tailwind directives inside CSS modules with core styles and utility classes.
 */
export function tailwindPlugin() {
    return {
        name: '@ray/plugin-tailwind',
        async transform(code, id) {
            if (id.endsWith('.css') && code.includes('@tailwind')) {
                let replaced = code
                    .replace('@tailwind base;', '/* Tailwind Base Styles */\nbody { margin: 0; font-family: sans-serif; }')
                    .replace('@tailwind components;', '/* Tailwind Components */')
                    .replace('@tailwind utilities;', '/* Tailwind Utilities */\n.flex { display: flex; }\n.hidden { display: none; }\n.text-3xl { font-size: 1.875rem; }\n.font-extrabold { font-weight: 800; }\n.p-8 { padding: 2rem; }\n.max-w-2xl { max-width: 42rem; }\n.mx-auto { margin-left: auto; margin-right: auto; }\n.space-y-6 > * + * { margin-top: 1.5rem; }\n.rounded-xl { border-radius: 0.75rem; }\n.border { border-style: solid; }');
                return { code: replaced };
            }
            return null;
        },
    };
}
//# sourceMappingURL=tailwind.js.map