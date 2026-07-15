import { Lexer, Parser, CodeGenerator, ASTVisitor } from './index.js';
import { NodeType } from './ast.js';

/**
 * Transforms a CommonJS format module string to ESM.
 * Combines AST traversal for standard require/exports with regular expression fallbacks for complex patterns.
 */
export function transformCjsToEsm(code: string): string {
  let transformed = code;

  // 1. Convert require declarations
  // const x = require('y') -> import x from 'y'
  transformed = transformed.replace(
    /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\);?/g,
    'import $1 from "$2";'
  );

  // require('y') -> import 'y'
  transformed = transformed.replace(
    /require\(\s*['"]([^'"]+)['"]\s*\);?/g,
    'import "$1";'
  );

  // 2. Convert module.exports
  // module.exports = x -> export default x
  transformed = transformed.replace(
    /module\.exports\s*=\s*([a-zA-Z0-9_$]+);?/g,
    'export default $1;'
  );

  // module.exports = { a, b } -> export default { a, b }
  transformed = transformed.replace(
    /module\.exports\s*=\s*(\{[\s\S]*?\});?/g,
    'export default $1;'
  );

  // 3. Convert exports.foo
  // exports.foo = bar -> export const foo = bar
  transformed = transformed.replace(
    /exports\.([a-zA-Z0-9_$]+)\s*=\s*([^;]+);?/g,
    'export const $1 = $2;'
  );

  // 4. Try parsing and optimizing using AST visitor if valid JS
  try {
    const lexer = new Lexer(transformed);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();

    const visitor = new ASTVisitor({
      ExpressionStatement(node: any) {
        // Handle assignment to module.exports inside statements
        if (
          node.expression &&
          node.expression.type === 'AssignmentExpression' &&
          node.expression.left &&
          node.expression.left.type === 'MemberExpression'
        ) {
          const leftStr = `${node.expression.left.object.name || ''}.${node.expression.left.property.name || ''}`;
          if (leftStr === 'module.exports') {
            return {
              type: NodeType.ExportNamedDeclaration,
              isDefault: true,
              declaration: node.expression.right
            };
          }
        }
        return node;
      }
    });

    visitor.traverse(ast);
    transformed = new CodeGenerator().generate(ast);
  } catch {
    // If AST parsing fails due to non-standard code (e.g. CJS conditional requires), we use the regex-transformed version as fallback.
  }

  return transformed;
}
