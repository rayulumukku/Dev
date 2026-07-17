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
    function normalizePath(p: string): string {
      let resolved = path.resolve(p);
      if (process.platform === 'win32' && resolved[1] === ':') {
        resolved = resolved[0].toLowerCase() + resolved.slice(1);
      }
      return resolved.replace(/\\/g, '/');
    }

    const visited = new Set<string>();
    const inlinedVars = new Map<string, string>();

    function inlineBundle(filePath: string, depName?: string): string {
      const normPath = normalizePath(filePath);
      if (depName) {
        inlinedVars.set(normPath, depName);
      }
      if (visited.has(normPath)) return '';
      visited.add(normPath);

      if (!fs.existsSync(normPath)) return '';
      let fileContent = fs.readFileSync(normPath, 'utf-8');

      // 1. Convert CommonJS constructs to ESM if present
      if (fileContent.includes('module.exports') || fileContent.includes('exports.') || fileContent.includes('require(')) {
        fileContent = transformCjsToEsm(fileContent);
      }

      // 2. Scan and recursively inline relative imports within the package
      const dir = path.dirname(normPath);
      // Matches: import x from './y'
      const relativeImportRegex = /import\s+(\w+)\s+from\s+['"](\.\/|\.\.\/)([^'"]+)['"]\s*;?/g;
      
      fileContent = fileContent.replace(relativeImportRegex, (match, importedName, dotPrefix, relPath) => {
        let nestedPath = path.resolve(dir, dotPrefix + relPath);
        if (!path.extname(nestedPath)) {
          for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
            if (fs.existsSync(nestedPath + ext)) {
              nestedPath += ext;
              break;
            }
          }
        }
        return inlineBundle(nestedPath, importedName);
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

      // Matches: export * from './y'
      const relativeExportAllRegex = /export\s+\*\s+from\s+['"](\.\/|\.\.\/)([^'"]+)['"]\s*;?/g;
      fileContent = fileContent.replace(relativeExportAllRegex, (match, dotPrefix, relPath) => {
        let nestedPath = path.resolve(dir, dotPrefix + relPath);
        if (!path.extname(nestedPath)) {
          for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
            if (fs.existsSync(nestedPath + ext)) {
              nestedPath += ext;
              break;
            }
          }
        }
        const normNested = normalizePath(nestedPath);
        if (visited.has(normNested)) {
          let nestedContent = fs.readFileSync(normNested, 'utf-8');
          if (nestedContent.includes('module.exports') || nestedContent.includes('exports.') || nestedContent.includes('require(')) {
            nestedContent = transformCjsToEsm(nestedContent);
          }
          const names: string[] = [];
          const exportNameRegex = /\bexport\s+const\s+([a-zA-Z0-9_$]+)\b/g;
          let m: RegExpExecArray | null;
          while ((m = exportNameRegex.exec(nestedContent)) !== null) {
            names.push(m[1]);
          }
          if (names.length > 0) {
            const importMatch = new RegExp(`import\\s+(\\w+)\\s+from\\s+['"](?:\\.\\/|\\.\\.\\/)${relPath.replace(/\./g, '\\.')}['"]`).exec(fileContent);
            const nestedVar = importMatch ? importMatch[1] : (inlinedVars.get(normNested) || `__dep_${Math.random().toString(36).substring(2, 8)}__`);
            return names.map(name => `export const ${name} = ${nestedVar}.${name};`).join('\n');
          }
          return `/* Inlined export * from: ${path.basename(normNested)} */`;
        }
        return match;
      });

      // 3. For nested inlined modules, rewrite "export default" to a local binding assignment
      // and strip relative exports.
      if (depName) {
        fileContent = fileContent.replace(/\bexport default\s+/g, `const ${depName} = `);
        fileContent = fileContent.replace(/export\s+const\s+[a-zA-Z0-9_$]+\s*=\s*__cjs_module_[a-zA-Z0-9_$]+__\.exports\.[a-zA-Z0-9_$]+;?/g, '');
        fileContent = fileContent.replace(/\bexport\s+(const|let|var|function|class)\s+/g, '$1 ');
      }

      // Strip relative re-exports (their contents are already inlined or handled by local bindings)
      fileContent = fileContent.replace(/export\s+\*\s+from\s+['"](\.\/|\.\.\/)[^'"]+['"]\s*;?/g, '');
      fileContent = fileContent.replace(/export\s+{[^}]+}\s+from\s+['"](\.\/|\.\.\/)[^'"]+['"]\s*;?/g, '');

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

    // Replace define/env variables
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        bundledCode = bundledCode.replace(new RegExp(escapedKey, 'g'), value);
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
      // Fallback: keep the bundled code as-is if advanced parser optimization fails
      // to ensure perfect correctness and syntax validity.
    }

    // 4. Rewrite bare package imports/re-exports (e.g. from 'react') to '/@modules/react'
    bundledCode = bundledCode.replace(
      /(\b(?:import|export)\s+[\w\s*{},\$]+from\s+['"])([^'"./][^'"]*)(['"])/g,
      '$1/@modules/$2$3'
    );
    bundledCode = bundledCode.replace(
      /(\bimport\s+['"])([^'"./][^'"]*)(['"])/g,
      '$1/@modules/$2$3'
    );

    // 5. Ensure parent directories exist and write output file
    fs.mkdirSync(path.dirname(outFilePath), { recursive: true });
    fs.writeFileSync(outFilePath, bundledCode, 'utf-8');

    parentPort?.postMessage({ success: true });
  } catch (err: any) {
    parentPort?.postMessage({ success: false, error: err.message });
  }
}

execute();
