import fs from 'fs';
import path from 'path';

export function runCreateProject(projectRoot: string, name: string, template: string) {
  const isDotPath = name === '.';
  const targetDir = isDotPath ? projectRoot : path.resolve(projectRoot, name);
  const projectName = isDotPath ? path.basename(targetDir) : name;

  console.log(`\n⚡ [Ray Create] Scaffolding new Ray project: "${projectName}" using template "${template}" at ${targetDir}...`);

  if (!isDotPath && fs.existsSync(targetDir)) {
    throw new Error(`Target directory "${targetDir}" already exists.`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

  // 1. package.json template
  const pkgJson = {
    name: projectName,
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
    } as Record<string, string>,
    devDependencies: {
      '@ray/cli': '*',
      typescript: '^5.3.3'
    } as Record<string, string>
  };

  // Adjustments based on templates
  if (template === 'vue') {
    pkgJson.dependencies = {
      vue: '^3.4.0'
    };
  } else if (template === 'svelte') {
    pkgJson.dependencies = {
      svelte: '^4.0.0'
    };
  } else if (template === 'solid') {
    pkgJson.dependencies = {
      'solid-js': '^1.8.0'
    };
  } else if (template === 'react-ts') {
    pkgJson.dependencies = {
      react: '^18.2.0',
      'react-dom': '^18.2.0'
    };
  } else if (template === 'react-ssr') {
    pkgJson.dependencies = {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^7.18.1'
    };
  } else if (template === 'library') {
    pkgJson.scripts = {
      build: 'ray build --lib',
      verify: 'ray verify'
    } as any;
    pkgJson.dependencies = {};
  }

  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2) + '\n');

  // 2. ray.config.ts template
  let configContent = `import { defineConfig } from '@ray/core';\n\nexport default defineConfig({\n  mode: 'development'\n});\n`;
  if (template === 'vue') {
    configContent = `import { defineConfig, vue } from '@ray/core';\n\nexport default defineConfig({\n  plugins: [\n    vue()\n  ]\n});\n`;
  } else if (template === 'svelte') {
    configContent = `import { defineConfig, svelte } from '@ray/core';\n\nexport default defineConfig({\n  plugins: [\n    svelte()\n  ]\n});\n`;
  } else if (template === 'solid') {
    configContent = `import { defineConfig, solid } from '@ray/core';\n\nexport default defineConfig({\n  plugins: [\n    solid()\n  ]\n});\n`;
  } else if (template === 'library') {
    configContent = `import { defineConfig } from '@ray/core';\n\nexport default defineConfig({\n  build: {\n    lib: {\n      entry: 'src/index.ts',\n      name: '${projectName.replace(/[^a-zA-Z0-9]/g, '')}',\n      formats: ['esm', 'cjs', 'umd']\n    }\n  }\n});\n`;
  }
  fs.writeFileSync(path.join(targetDir, 'ray.config.ts'), configContent);

  // 3. .gitignore file template
  const gitignore = `node_modules/
dist/
.ray/
.env.local
.env.*.local
*.log
`;
  fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignore);

  // 4. index.html template (for SPAs / SSR)
  if (template !== 'library') {
    let mainScript = '/src/main.jsx';
    if (template === 'react-ts') mainScript = '/src/main.tsx';
    else if (template === 'svelte') mainScript = '/src/main.js';
    else if (template === 'vue') mainScript = '/src/main.js';
    else if (template === 'solid') mainScript = '/src/main.jsx';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${mainScript}"></script>
</body>
</html>
`;
    fs.writeFileSync(path.join(targetDir, 'index.html'), htmlContent);
  }

  // 5. Source Files template
  if (template === 'library') {
    fs.writeFileSync(
      path.join(targetDir, 'src/index.ts'),
      `export const hello = () => {\n  return "Hello from ${projectName} library!";\n};\n`
    );
  } else if (template === 'react-ssr') {
    fs.writeFileSync(
      path.join(targetDir, 'src/entry-client.jsx'),
      `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './App.jsx';\n\nReactDOM.hydrateRoot(document.getElementById('root'), <App />);\n`
    );
    fs.writeFileSync(
      path.join(targetDir, 'src/entry-server.jsx'),
      `import React from 'react';\nimport ReactDOMServer from 'react-dom/server';\nimport { App } from './App.jsx';\n\nexport function render(url) {\n  return {\n    html: ReactDOMServer.renderToString(<App />)\n  };\n}\n`
    );
    fs.writeFileSync(
      path.join(targetDir, 'src/App.jsx'),
      `import React from 'react';\n\nexport const App = () => {\n  return <div>Hello SSR World from Ray!</div>;\n};\n`
    );
    fs.writeFileSync(
      path.join(targetDir, 'src/main.jsx'),
      `import './entry-client.jsx';\n`
    );
  } else if (template === 'vue') {
    fs.writeFileSync(
      path.join(targetDir, 'src/main.js'),
      `import { createApp } from 'vue';\nimport App from './App.vue';\n\ncreateApp(App).mount('#root');\n`
    );
    fs.writeFileSync(
      path.join(targetDir, 'src/App.vue'),
      `<template>\n  <div>\n    <h1>Hello Ray + Vue!</h1>\n    <button @click="count++">Count: {{ count }}</button>\n  </div>\n</template>\n<script>\nexport default {\n  data() {\n    return { count: 0 };\n  }\n};\n</script>\n`
    );
  } else if (template === 'svelte') {
    fs.writeFileSync(
      path.join(targetDir, 'src/main.js'),
      `import App from './App.svelte';\n\nconst app = new App({\n  target: document.getElementById('root')\n});\nexport default app;\n`
    );
    fs.writeFileSync(
      path.join(targetDir, 'src/App.svelte'),
      `<script>\n  let count = 0;\n</script>\n<main>\n  <h1>Hello Ray + Svelte!</h1>\n  <button on:click={() => count++}>Count: {count}</button>\n</main>\n`
    );
  } else if (template === 'solid') {
    fs.writeFileSync(
      path.join(targetDir, 'src/main.jsx'),
      `import { render } from 'solid-js/web';\nimport App from './App';\n\nrender(() => <App />, document.getElementById('root'));\n`
    );
    fs.writeFileSync(
      path.join(targetDir, 'src/App.jsx'),
      `import { createSignal } from 'solid-js';\n\nexport default function App() {\n  const [count, setCount] = createSignal(0);\n  return (\n    <div>\n      <h1>Hello Ray + Solid!</h1>\n      <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>\n    </div>\n  );\n}\n`
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

  console.log(`\n🎉 Project "${projectName}" initialized successfully! Run the following:\n${isDotPath ? '' : `  cd ${name}\n`}  npm install\n  npm run dev\n`);
}
