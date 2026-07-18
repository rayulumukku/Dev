import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

const outputDir = path.resolve('docs/architecture');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 9 diagrams definitions
const diagrams = {
  'module-graph.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
    <rect width="100%" height="100%" fill="#09090b"/>
    <defs>
      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
    </defs>
    <rect x="50" y="50" width="700" height="300" rx="15" fill="#18181b" stroke="#27272a" stroke-width="2"/>
    <text x="400" y="35" font-family="'Inter', sans-serif" font-size="20" fill="#f4f4f5" font-weight="bold" text-anchor="middle">Ray Module Graph</text>
    
    <!-- Nodes -->
    <rect x="300" y="80" width="200" height="50" rx="8" fill="url(#g1)"/>
    <text x="400" y="110" font-family="monospace" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">src/main.jsx</text>
    
    <rect x="150" y="200" width="180" height="50" rx="8" fill="#27272a" stroke="#6366f1" stroke-width="2"/>
    <text x="240" y="230" font-family="monospace" font-size="13" fill="#f4f4f5" text-anchor="middle">src/App.jsx</text>
    
    <rect x="470" y="200" width="180" height="50" rx="8" fill="#27272a" stroke="#3b82f6" stroke-width="2"/>
    <text x="560" y="230" font-family="monospace" font-size="13" fill="#f4f4f5" text-anchor="middle">src/tailwind.css</text>
    
    <!-- Arrows -->
    <path d="M 400 130 L 240 200" stroke="#a1a1aa" stroke-width="2" marker-end="url(#arrow)"/>
    <path d="M 400 130 L 560 200" stroke="#a1a1aa" stroke-width="2"/>
  </svg>`,

  'compiler-pipeline.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="800" height="200">
    <rect width="100%" height="100%" fill="#09090b"/>
    <text x="400" y="30" font-family="'Inter', sans-serif" font-size="18" fill="#f4f4f5" font-weight="bold" text-anchor="middle">Ray Compiler Pipeline</text>
    <g transform="translate(40, 60)">
      <!-- Stage 1 -->
      <rect x="0" y="20" width="120" height="50" rx="8" fill="#6366f1"/>
      <text x="60" y="50" font-family="sans-serif" font-size="13" fill="#fff" text-anchor="middle">1. Lexer</text>
      <!-- Stage 2 -->
      <rect x="150" y="20" width="120" height="50" rx="8" fill="#4f46e5"/>
      <text x="210" y="50" font-family="sans-serif" font-size="13" fill="#fff" text-anchor="middle">2. Parser</text>
      <!-- Stage 3 -->
      <rect x="300" y="20" width="120" height="50" rx="8" fill="#3b82f6"/>
      <text x="360" y="50" font-family="sans-serif" font-size="13" fill="#fff" text-anchor="middle">3. Optimizer</text>
      <!-- Stage 4 -->
      <rect x="450" y="20" width="120" height="50" rx="8" fill="#2563eb"/>
      <text x="510" y="50" font-family="sans-serif" font-size="13" fill="#fff" text-anchor="middle">4. Plugins</text>
      <!-- Stage 5 -->
      <rect x="600" y="20" width="120" height="50" rx="8" fill="#1d4ed8"/>
      <text x="660" y="50" font-family="sans-serif" font-size="13" fill="#fff" text-anchor="middle">5. Codegen</text>
    </g>
  </svg>`,

  'plugin-lifecycle.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" width="800" height="300">
    <rect width="100%" height="100%" fill="#09090b"/>
    <text x="400" y="30" font-family="'Inter', sans-serif" font-size="18" fill="#f4f4f5" font-weight="bold" text-anchor="middle">Ray Plugin Lifecycle Hooks</text>
    <rect x="100" y="70" width="600" height="180" rx="10" fill="#18181b" stroke="#27272a" stroke-width="2"/>
    <text x="400" y="110" font-family="monospace" font-size="14" fill="#a1a1aa" text-anchor="middle">configResolved() → buildStart()</text>
    <text x="400" y="150" font-family="monospace" font-size="14" fill="#6366f1" text-anchor="middle">resolveId() → load() → transform()</text>
    <text x="400" y="190" font-family="monospace" font-size="14" fill="#a1a1aa" text-anchor="middle">buildEnd()</text>
  </svg>`,

  'hmr-flow.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" width="800" height="300">
    <rect width="100%" height="100%" fill="#09090b"/>
    <text x="400" y="30" font-family="'Inter', sans-serif" font-size="18" fill="#f4f4f5" font-weight="bold" text-anchor="middle">Ray Hot Module Replacement (HMR) Flow</text>
    <circle cx="150" cy="150" r="50" fill="#ef4444"/>
    <text x="150" y="155" font-family="sans-serif" font-size="12" fill="#fff" text-anchor="middle">1. File Change</text>
    
    <rect x="300" y="125" width="200" height="50" rx="8" fill="#f59e0b"/>
    <text x="400" y="155" font-family="sans-serif" font-size="12" fill="#fff" text-anchor="middle">2. Replan & WS Broadcast</text>
    
    <circle cx="650" cy="150" r="50" fill="#10b981"/>
    <text x="650" y="155" font-family="sans-serif" font-size="12" fill="#fff" text-anchor="middle">3. Client Apply</text>
  </svg>`,

  'ssr-flow.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" width="800" height="300">
    <rect width="100%" height="100%" fill="#09090b"/>
    <text x="400" y="30" font-family="'Inter', sans-serif" font-size="18" fill="#f4f4f5" font-weight="bold" text-anchor="middle">Ray Server-Side Rendering (SSR) Flow</text>
    <rect x="100" y="100" width="180" height="80" rx="8" fill="#6366f1"/>
    <text x="190" y="145" font-family="sans-serif" font-size="13" fill="#fff" text-anchor="middle">ssrLoadModule()</text>
    
    <rect x="350" y="100" width="180" height="80" rx="8" fill="#3b82f6"/>
    <text x="440" y="145" font-family="sans-serif" font-size="13" fill="#fff" text-anchor="middle">Render App to HTML</text>
    
    <rect x="580" y="100" width="150" height="80" rx="8" fill="#10b981"/>
    <text x="655" y="145" font-family="sans-serif" font-size="13" fill="#fff" text-anchor="middle">Hydrate Client</text>
  </svg>`,

  'build-pipeline.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" width="800" height="300">
    <rect width="100%" height="100%" fill="#09090b"/>
    <text x="400" y="30" font-family="'Inter', sans-serif" font-size="18" fill="#f4f4f5" font-weight="bold" text-anchor="middle">Ray Build Pipeline</text>
    <rect x="50" y="100" width="180" height="100" rx="10" fill="#18181b" stroke="#6366f1" stroke-width="2"/>
    <text x="140" y="150" font-family="sans-serif" font-size="13" fill="#f4f4f5" text-anchor="middle">Pre-bundling</text>
    
    <rect x="310" y="100" width="180" height="100" rx="10" fill="#18181b" stroke="#3b82f6" stroke-width="2"/>
    <text x="400" y="150" font-family="sans-serif" font-size="13" fill="#f4f4f5" text-anchor="middle">Parallel Compilation</text>
    
    <rect x="570" y="100" width="180" height="100" rx="10" fill="#18181b" stroke="#10b981" stroke-width="2"/>
    <text x="660" y="150" font-family="sans-serif" font-size="13" fill="#f4f4f5" text-anchor="middle">Chunk merging (dist)</text>
  </svg>`,

  'dependency-optimizer.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" width="800" height="300">
    <rect width="100%" height="100%" fill="#09090b"/>
    <text x="400" y="30" font-family="'Inter', sans-serif" font-size="18" fill="#f4f4f5" font-weight="bold" text-anchor="middle">Dependency Pre-Bundling Optimizer</text>
    <rect x="100" y="100" width="200" height="100" rx="8" fill="#27272a"/>
    <text x="200" y="145" font-family="sans-serif" font-size="14" fill="#a1a1aa" text-anchor="middle">Scan bare imports</text>
    
    <rect x="380" y="100" width="320" height="100" rx="8" fill="#6366f1"/>
    <text x="540" y="145" font-family="sans-serif" font-size="14" fill="#fff" text-anchor="middle">Pre-bundle bare modules via RayBundler</text>
  </svg>`,

  'incremental-cache.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" width="800" height="300">
    <rect width="100%" height="100%" fill="#09090b"/>
    <text x="400" y="30" font-family="'Inter', sans-serif" font-size="18" fill="#f4f4f5" font-weight="bold" text-anchor="middle">Ray Incremental Cache Lifecycle</text>
    <rect x="100" y="110" width="180" height="80" rx="8" fill="#18181b" stroke="#27272a" stroke-width="2"/>
    <text x="190" y="155" font-family="sans-serif" font-size="13" fill="#a1a1aa" text-anchor="middle">Compute file hash</text>
    
    <rect x="350" y="110" width="180" height="80" rx="8" fill="#18181b" stroke="#6366f1" stroke-width="2"/>
    <text x="440" y="155" font-family="sans-serif" font-size="13" fill="#f4f4f5" text-anchor="middle">Check .ray/cache</text>
    
    <rect x="580" y="110" width="150" height="80" rx="8" fill="#10b981"/>
    <text x="655" y="155" font-family="sans-serif" font-size="13" fill="#fff" text-anchor="middle">Return output</text>
  </svg>`,

  'ray-studio.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" width="800" height="300">
    <rect width="100%" height="100%" fill="#09090b"/>
    <text x="400" y="30" font-family="'Inter', sans-serif" font-size="18" fill="#f4f4f5" font-weight="bold" text-anchor="middle">Ray Studio Control Center</text>
    <rect x="150" y="100" width="500" height="120" rx="10" fill="#18181b" stroke="#3b82f6" stroke-width="2"/>
    <text x="400" y="145" font-family="'Inter', sans-serif" font-size="16" fill="#f4f4f5" text-anchor="middle" font-weight="bold">Dev Server Telemetry / WebSocket</text>
    <text x="400" y="185" font-family="monospace" font-size="13" fill="#3b82f6" text-anchor="middle">Interactive Graph Viewer & Plugin Telemetry Panels</text>
  </svg>`
};

// 1. Write SVG files
for (const [filename, svg] of Object.entries(diagrams)) {
  fs.writeFileSync(path.join(outputDir, filename), svg);
  console.log(`Saved SVG: ${filename}`);
}

// 2. Generate PNG files using Playwright chromium screenshotting
async function generatePngs() {
  console.log('Spawning Playwright browser to capture PNG diagram screenshots...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  for (const filename of Object.keys(diagrams)) {
    const svgPath = path.join(outputDir, filename);
    const pngFilename = filename.replace('.svg', '.png');
    const pngPath = path.join(outputDir, pngFilename);
    
    // Open the SVG locally
    await page.goto(`file:///${svgPath.replace(/\\/g, '/')}`);
    
    // Set viewport size matching the SVG viewbox
    await page.setViewportSize({ width: 800, height: filename === 'compiler-pipeline.svg' ? 200 : 300 });
    
    await page.screenshot({ path: pngPath });
    console.log(`Generated PNG: ${pngFilename}`);
  }
  
  await browser.close();
  console.log('Diagrams generation completed successfully!');
}

generatePngs().catch(console.error);
