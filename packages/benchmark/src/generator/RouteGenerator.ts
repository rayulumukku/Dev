import fs from 'fs';
import path from 'path';

export function generateRoutes(routesDir: string, count: number) {
  fs.mkdirSync(routesDir, { recursive: true });

  let routeManifest = `import React, { lazy } from 'react';\n\nexport const routes = [\n`;

  for (let i = 0; i < count; i++) {
    const pageCode = `import React from 'react';\nexport default function Page${i}() { return <div>Page ${i}</div>; }\n`;
    fs.writeFileSync(path.join(routesDir, `Page${i}.tsx`), pageCode);

    routeManifest += `  { path: '/page-${i}', component: lazy(() => import('./Page${i}')) },\n`;
  }

  routeManifest += `];\n`;
  fs.writeFileSync(path.join(routesDir, 'index.ts'), routeManifest);
}
