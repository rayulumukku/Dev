import fs from 'fs';
import path from 'path';

export interface ProjectOptions {
  projectName: string;
  targetDir: string;
  template: string; // 'react' | 'react-ts' | 'vue' | 'vue-ts' | 'svelte' | 'solid' | 'vanilla' | 'vanilla-ts' | 'library'
}

export function generateProject(options: ProjectOptions) {
  const { projectName, targetDir, template } = options;

  if (fs.existsSync(targetDir) && targetDir !== process.cwd() && fs.readdirSync(targetDir).length > 0) {
    throw new Error(`Target directory "${targetDir}" already exists and is not empty.`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

  const isTS = template.endsWith('-ts') || template === 'library';

  // 1. package.json
  const pkgJson: Record<string, any> = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'ray dev',
      build: 'ray build',
      preview: 'ray preview'
    },
    dependencies: {},
    devDependencies: {
      '@ray/cli': '^1.0.0'
    }
  };

  if (isTS) {
    pkgJson.devDependencies['typescript'] = '^5.3.3';
  }

  if (template.startsWith('react')) {
    pkgJson.dependencies['react'] = '^18.2.0';
    pkgJson.dependencies['react-dom'] = '^18.2.0';
    if (isTS) {
      pkgJson.devDependencies['@types/react'] = '^18.2.0';
      pkgJson.devDependencies['@types/react-dom'] = '^18.2.0';
    }
  } else if (template.startsWith('vue')) {
    pkgJson.dependencies['vue'] = '^3.4.0';
    pkgJson.devDependencies['@ray/plugin-vue'] = '^1.0.0';
  } else if (template.startsWith('svelte')) {
    pkgJson.dependencies['svelte'] = '^4.0.0';
  } else if (template.startsWith('solid')) {
    pkgJson.dependencies['solid-js'] = '^1.8.0';
  } else if (template === 'library') {
    pkgJson.scripts = {
      build: 'ray build --lib'
    };
  }

  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2) + '\n');

  // 2. ray.config.ts / ray.config.js
  let configContent = `import { defineConfig } from '@ray/core';\n\nexport default defineConfig({\n  mode: 'development'\n});\n`;
  if (template.startsWith('vue')) {
    configContent = `import { defineConfig } from '@ray/core';\nimport vue from '@ray/plugin-vue';\n\nexport default defineConfig({\n  plugins: [vue()]\n});\n`;
  }
  const configFileName = isTS ? 'ray.config.ts' : 'ray.config.js';
  fs.writeFileSync(path.join(targetDir, configFileName), configContent);

  // 3. index.html (SPA templates)
  if (template !== 'library') {
    const ext = isTS ? (template.startsWith('react') ? 'tsx' : 'ts') : (template.startsWith('react') ? 'jsx' : 'js');
    const mainScript = `/src/main.${ext}`;
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="${mainScript}"></script>
</body>
</html>
`;
    fs.writeFileSync(path.join(targetDir, 'index.html'), htmlContent);
  }

  // 4. Source files in src/
  if (template.startsWith('react')) {
    const isTsx = isTS;
    const appExt = isTsx ? 'tsx' : 'jsx';
    const appCode = `import React, { useState } from 'react';\n\nexport function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>\n      <h1>Welcome to ${projectName} on Ray</h1>\n      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>\n    </div>\n  );\n}\n\nexport default App;\n`;
    fs.writeFileSync(path.join(targetDir, 'src', `App.${appExt}`), appCode);

    const mainCode = `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('app')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`;
    fs.writeFileSync(path.join(targetDir, 'src', `main.${appExt}`), mainCode);
  } else if (template.startsWith('vue')) {
    const appVue = `<template>\n  <div style="padding: 2rem; font-family: sans-serif;">\n    <h1>Welcome to ${projectName} on Ray</h1>\n    <button @click="count++">Count: {{ count }}</button>\n  </div>\n</template>\n\n<script setup>\nimport { ref } from 'vue';\nconst count = ref(0);\n</script>\n`;
    fs.writeFileSync(path.join(targetDir, 'src', 'App.vue'), appVue);

    const mainJs = `import { createApp } from 'vue';\nimport App from './App.vue';\n\ncreateApp(App).mount('#app');\n`;
    fs.writeFileSync(path.join(targetDir, 'src', `main.${isTS ? 'ts' : 'js'}`), mainJs);
  } else if (template === 'library') {
    const libCode = `export function greet(name: string): string {\n  return \`Hello, \${name} from ${projectName}!\`;\n}\n`;
    fs.writeFileSync(path.join(targetDir, 'src', 'index.ts'), libCode);
  } else {
    // Vanilla
    const mainCode = `document.querySelector('#app').innerHTML = \`\n  <div style="padding: 2rem; font-family: sans-serif;">\n    <h1>Welcome to ${projectName} on Ray</h1>\n  </div>\n\`;\n`;
    fs.writeFileSync(path.join(targetDir, 'src', `main.${isTS ? 'ts' : 'js'}`), mainCode);
  }

  // 5. .gitignore
  const gitignore = `node_modules/\ndist/\n.ray/\n*.log\n`;
  fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignore);

  // 6. tsconfig.json if TS
  if (isTS) {
    const tsconfig = {\n      compilerOptions: {\n        target: 'ES2022',\n        module: 'NodeNext',\n        moduleResolution: 'NodeNext',\n        jsx: 'react-jsx',\n        strict: true,\n        skipLibCheck: true\n      },\n      include: ['src/**/*']\n    };
    fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n');
  }
}
