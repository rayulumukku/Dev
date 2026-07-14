import fs from 'fs';
import path from 'path';

export function runCreateProject(projectRoot: string, name: string, template: string) {
  const targetDir = path.resolve(projectRoot, name);
  console.log(`\n⚡ [Ray Create] Scaffolding new Ray project: "${name}" using template "${template}" at ${targetDir}...`);

  if (fs.existsSync(targetDir)) {
    throw new Error(`Target directory "${targetDir}" already exists.`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

  // 1. package.json template
  const pkgJson = {
    name,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'ray dev',
      build: 'ray build',
      preview: 'ray preview',
      verify: 'ray verify'
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      '@ray/cli': '*',
      typescript: '^5.3.3'
    }
  };

  // Adjustments based on templates
  if (template === 'react-ts') {
    pkgJson.dependencies = {
      ...pkgJson.dependencies,
      // TypeScript type mappings
    } as any;
  } else if (template === 'react-ssr') {
    pkgJson.dependencies = {
      ...pkgJson.dependencies,
      'react-router-dom': '^7.18.1'
    } as any;
  } else if (template === 'library') {
    pkgJson.scripts = {
      build: 'ray build --lib',
      verify: 'ray verify'
    } as any;
  }

  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2) + '\n');

  // 2. ray.config.ts template
  let configContent = `import { defineConfig } from '@ray/core';\n\nexport default defineConfig({\n  mode: 'development'\n});\n`;
  if (template === 'library') {
    configContent = `import { defineConfig } from '@ray/core';\n\nexport default defineConfig({\n  build: {\n    lib: {\n      entry: 'src/index.ts',\n      name: '${name.replace(/[^a-zA-Z0-9]/g, '')}',\n      formats: ['esm', 'cjs', 'umd']\n    }\n  }\n});\n`;
  }
  fs.writeFileSync(path.join(targetDir, 'ray.config.ts'), configContent);

  // 3. index.html template (for SPAs / SSR)
  if (template !== 'library') {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/${template === 'react-ts' ? 'main.tsx' : 'main.jsx'}"></script>
</body>
</html>
`;
    fs.writeFileSync(path.join(targetDir, 'index.html'), htmlContent);
  }

  // 4. Source Files template
  if (template === 'library') {
    fs.writeFileSync(
      path.join(targetDir, 'src/index.ts'),
      `export const hello = () => {\n  return "Hello from ${name} library!";\n};\n`
    );
  } else if (template === 'react-ssr') {
    // entry-client.jsx
    fs.writeFileSync(
      path.join(targetDir, 'src/entry-client.jsx'),
      `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './App.jsx';\n\nReactDOM.hydrateRoot(document.getElementById('root'), <App />);\n`
    );
    // entry-server.jsx
    fs.writeFileSync(
      path.join(targetDir, 'src/entry-server.jsx'),
      `import React from 'react';\nimport ReactDOMServer from 'react-dom/server';\nimport { App } from './App.jsx';\n\nexport function render(url) {\n  return {\n    html: ReactDOMServer.renderToString(<App />)\n  };\n}\n`
    );
    // App.jsx
    fs.writeFileSync(
      path.join(targetDir, 'src/App.jsx'),
      `import React from 'react';\n\nexport const App = () => {\n  return <div>Hello SSR World from Ray!</div>;\n};\n`
    );
    // main.jsx
    fs.writeFileSync(
      path.join(targetDir, 'src/main.jsx'),
      `import './entry-client.jsx';\n`
    );
  } else {
    // React ts/js SPAs
    const ext = template === 'react-ts' ? 'tsx' : 'jsx';
    const mainExt = template === 'react-ts' ? 'tsx' : 'jsx';
    fs.writeFileSync(
      path.join(targetDir, `src/main.${mainExt}`),
      `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './App';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);\n`
    );
    fs.writeFileSync(
      path.join(targetDir, `src/App.${ext}`),
      `import React, { useState } from 'react';\n\nexport const App = () => {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <h1>Hello Ray + React!</h1>\n      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>\n    </div>\n  );\n};\n`
    );
  }

  console.log(`\n🎉 Project "${name}" initialized successfully! Run the following:\n  cd ${name}\n  npm install\n  npm run dev\n`);
}
