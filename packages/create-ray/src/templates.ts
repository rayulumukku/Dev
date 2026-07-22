import { Framework, Language, Styling, PackageManager } from './types.js';

export const FRAMEWORKS: { name: string; value: Framework }[] = [
  { name: 'React', value: 'react' },
  { name: 'Vue 3', value: 'vue' },
  { name: 'Minimal', value: 'minimal' },
];

export const LANGUAGES: { name: string; value: Language }[] = [
  { name: 'TypeScript', value: 'ts' },
  { name: 'JavaScript', value: 'js' },
];

export const STYLINGS: { name: string; value: Styling }[] = [
  { name: 'None', value: 'none' },
  { name: 'Tailwind CSS', value: 'tailwind' },
  { name: 'Plain CSS', value: 'css' },
];

export const PACKAGE_MANAGERS: { name: string; value: PackageManager }[] = [
  { name: 'npm', value: 'npm' },
  { name: 'pnpm', value: 'pnpm' },
  { name: 'yarn', value: 'yarn' },
  { name: 'bun', value: 'bun' },
];
