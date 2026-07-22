export type Framework = 'react' | 'vue' | 'minimal';
export type Language = 'ts' | 'js';
export type Styling = 'none' | 'tailwind' | 'css';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface ProjectOptions {
  projectName: string;
  targetDir: string;
  framework: Framework;
  language: Language;
  styling: Styling;
  packageManager: PackageManager;
  installDeps?: boolean;
  overwrite?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface RenderContext {
  projectName: string;
  framework: Framework;
  language: Language;
  styling: Styling;
  packageManager: PackageManager;
}
