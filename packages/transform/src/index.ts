import { transform } from 'esbuild';
import path from 'path';

/**
 * Transforms JS/JSX/TS/TSX code using esbuild's transform API.
 * Uses classic JSX ('classic') to output standard React.createElement calls.
 * Includes inline sourcemaps for debugging in the browser.
 *
 * @param code The raw source code to compile.
 * @param filename The path/name of the file, used to determine loader and sourcemap sourcefile.
 */
export async function transformJsx(code: string, filename: string): Promise<string> {
  const ext = path.extname(filename);
  let loader: 'js' | 'jsx' | 'ts' | 'tsx' = 'js';

  if (ext === '.jsx') {
    loader = 'jsx';
  } else if (ext === '.tsx') {
    loader = 'tsx';
  } else if (ext === '.ts') {
    loader = 'ts';
  } else if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
    loader = 'js';
  }

  const result = await transform(code, {
    loader,
    target: 'esnext',
    format: 'esm',
    jsx: 'transform', // JSX becomes React.createElement
    sourcemap: 'inline', // Easy debugging in the browser console
    sourcefile: filename,
  });

  return result.code;
}
