import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProjectOptions } from './types.js';

function copyRecursive(src: string, dest: string, context: Record<string, string>) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child), context);
    }
  } else {
    let content = fs.readFileSync(src, 'utf-8');
    for (const [key, val] of Object.entries(context)) {
      content = content.replaceAll(`{{${key}}}`, val);
    }
    fs.writeFileSync(dest, content);
  }
}

export function renderProject(options: ProjectOptions) {
  const { projectName, targetDir, template, framework, styling } = options;

  let chosenTemplate = template;
  if (!chosenTemplate) {
    if (styling === 'tailwind') chosenTemplate = 'react-tailwind';
    else if (framework === 'vue') chosenTemplate = 'vue-ts';
    else if (framework === 'minimal') chosenTemplate = 'minimal';
    else chosenTemplate = 'react-ts';
  }

  if (!['react-ts', 'react-tailwind', 'vue-ts', 'minimal'].includes(chosenTemplate)) {
    if (chosenTemplate.includes('vue')) chosenTemplate = 'vue-ts';
    else if (chosenTemplate.includes('tailwind')) chosenTemplate = 'react-tailwind';
    else if (chosenTemplate.includes('minimal')) chosenTemplate = 'minimal';
    else chosenTemplate = 'react-ts';
  }

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const templateDir = path.resolve(currentDir, '../templates', chosenTemplate);

  if (fs.existsSync(templateDir)) {
    copyRecursive(templateDir, targetDir, { projectName });
  } else {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify({ name: projectName, version: '1.0.0' }, null, 2));
  }
}
