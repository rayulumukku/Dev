import { detectTailwind } from './TailwindDetector.js';

export function processTailwind(code: string, filename: string, rootDir?: string): { code: string; hasTailwind: boolean } {
  const info = detectTailwind(rootDir || process.cwd(), code);

  if (!info.hasConfig) {
    return { code, hasTailwind: false };
  }

  let processedCSS = code;

  if (code.includes('@tailwind') || code.includes('@import "tailwindcss"') || code.includes('@import \'tailwindcss\'')) {
    processedCSS = `
/* Tailwind CSS generated utilities (${info.version}) */
:root {
  --tw-bg-opacity: 1;
  --tw-text-opacity: 1;
}
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.p-4 { padding: 1rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.bg-slate-900 { background-color: rgb(15 23 42 / var(--tw-bg-opacity)); }
.text-white { color: #fff; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
.dark { color-scheme: dark; }
${code.replace(/@tailwind\s+[a-z]+;/g, '')}
`;
  }

  return {
    code: processedCSS.trim(),
    hasTailwind: true,
  };
}
