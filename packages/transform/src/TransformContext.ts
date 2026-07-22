import path from 'path';

export interface TransformContextOptions {
  filename: string;
  root?: string;
  mode?: string;
  command?: 'serve' | 'build';
  loader?: string;
  sourcemap?: boolean;
}

export interface TransformContext {
  readonly filename: string;
  readonly absolutePath: string;
  readonly extension: string;
  readonly root: string;
  readonly mode: string;
  readonly command: 'serve' | 'build';
  readonly loader: string;
  readonly sourcemap: boolean;
  readonly isProduction: boolean;
}

export function createTransformContext(opts: TransformContextOptions): Readonly<TransformContext> {
  const absPath = path.isAbsolute(opts.filename)
    ? opts.filename
    : path.resolve(opts.root || process.cwd(), opts.filename);
  const ext = path.extname(opts.filename);
  const mode = opts.mode || 'development';
  const command = opts.command || 'serve';

  let defaultLoader = 'js';
  if (ext === '.ts') defaultLoader = 'ts';
  else if (ext === '.jsx') defaultLoader = 'jsx';
  else if (ext === '.tsx') defaultLoader = 'tsx';
  else if (ext === '.css') defaultLoader = 'css';
  else if (ext === '.json') defaultLoader = 'json';

  return Object.freeze({
    filename: opts.filename,
    absolutePath: absPath,
    extension: ext,
    root: opts.root || process.cwd(),
    mode,
    command,
    loader: opts.loader || defaultLoader,
    sourcemap: opts.sourcemap ?? true,
    isProduction: mode === 'production',
  });
}
