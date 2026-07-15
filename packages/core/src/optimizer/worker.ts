import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import { transformCjsToEsm } from '../compiler/cjsTransform.js';
import { Lexer, Parser, CodeGenerator, Optimizer } from '../compiler/index.js';

interface WorkerPayload {
  resolvedPath: string;
  dep: string;
  outFilePath: string;
  env: Record<string, string>;
}

async function execute() {
  const { resolvedPath, dep, outFilePath, env } = workerData as WorkerPayload;

  try {
    const visited = new Set<string>();

    function inlineBundle(filePath: string): string {
      const absPath = path.resolve(filePath);
      if (visited.has(absPath)) return '';
      visited.add(absPath);

      if (!fs.existsSync(absPath)) return '';
      let fileContent = fs.readFileSync(absPath, 'utf-8');

      // 1. Convert CommonJS constructs to ESM if present
      if (fileContent.includes('module.exports') || fileContent.includes('exports.') || fileContent.includes('require(')) {
        fileContent = transformCjsToEsm(fileContent);
      }

      // 2. Scan and recursively inline relative imports within the package
      const dir = path.dirname(absPath);
      // Matches both static: import x from './y' and side-effect: import './y'
      const relativeImportRegex = /import\s+[^'"]*from\s+['"](\.\/|\.\.\/)([^'"]+)['"]\s*;?/g;
      
      fileContent = fileContent.replace(relativeImportRegex, (match, dotPrefix, relPath) => {
        let nestedPath = path.resolve(dir, dotPrefix + relPath);
        if (!path.extname(nestedPath)) {
          for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
            if (fs.existsSync(nestedPath + ext)) {
              nestedPath += ext;
              break;
            }
          }
        }
        return inlineBundle(nestedPath);
      });

      // Inline side-effect imports as well
      const relativeSideEffectRegex = /import\s+['"](\.\/|\.\.\/)([^'"]+)['"]\s*;?/g;
      fileContent = fileContent.replace(relativeSideEffectRegex, (match, dotPrefix, relPath) => {
        let nestedPath = path.resolve(dir, dotPrefix + relPath);
        if (!path.extname(nestedPath)) {
          for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
            if (fs.existsSync(nestedPath + ext)) {
              nestedPath += ext;
              break;
            }
          }
        }
        return inlineBundle(nestedPath);
      });

      return fileContent;
    }

    // Rollup internal files into a single bundle
    let bundledCode = inlineBundle(resolvedPath);

    // If final bundledCode is empty (fallback), write original file content
    if (!bundledCode.trim()) {
      bundledCode = fs.readFileSync(resolvedPath, 'utf-8');
      if (bundledCode.includes('module.exports') || bundledCode.includes('exports.') || bundledCode.includes('require(')) {
        bundledCode = transformCjsToEsm(bundledCode);
      }
    }

    // 3. Optimize and Minify the generated ESM bundle
    try {
      const lexer = new Lexer(bundledCode);
      const parser = new Parser(lexer.tokenize());
      const ast = parser.parse();

      const optimizer = new Optimizer();
      const optimizedAst = optimizer.optimize(ast);

      const codegen = new CodeGenerator(true); // minify = true
      const { code: minifiedCode } = codegen.generateWithSourceMap(optimizedAst, resolvedPath);
      bundledCode = minifiedCode;
    } catch {
      // Fallback: simple whitespace/newline minification if advanced parser optimization fails
      bundledCode = bundledCode
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // remove comments
        .replace(/\s+/g, ' ')
        .trim();
    }

    // 4. Ensure parent directories exist and write output file
    fs.mkdirSync(path.dirname(outFilePath), { recursive: true });
    fs.writeFileSync(outFilePath, bundledCode, 'utf-8');

    parentPort?.postMessage({ success: true });
  } catch (err: any) {
    parentPort?.postMessage({ success: false, error: err.message });
  }
}

execute();
