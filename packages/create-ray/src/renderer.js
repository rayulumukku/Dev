import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function copyRecursive(src, dest, context) {
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

export function renderProject(options) {
  const { projectName, targetDir, template } = options;

  let chosenTemplate = template;
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
