import { describe, it, expect } from 'vitest';
import { Lexer } from '../../packages/core/src/compiler/lexer.js';
import { Parser } from '../../packages/core/src/compiler/parser.js';
import { ASTVisitor } from '../../packages/core/src/compiler/visitor.js';
import { ScopeAnalyzer } from '../../packages/core/src/compiler/scope.js';
import { Optimizer } from '../../packages/core/src/compiler/optimizer.js';
import { CodeGenerator } from '../../packages/core/src/compiler/codegen.js';
import { NodeType } from '../../packages/core/src/compiler/ast.js';

describe('Native Ray Compiler Extended Phase 1-5 Tests', () => {
  
  it('should support Visitor API to inspect and replace AST nodes', () => {
    const code = 'const x = 1;';
    const lexer = new Lexer(code);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();

    const visitor = new ASTVisitor({
      Identifier(node) {
        if (node.name === 'x') {
          return { type: NodeType.Identifier, name: 'y' };
        }
        return node;
      }
    });

    const mutated = visitor.traverse(ast);
    const codegen = new CodeGenerator();
    const output = codegen.generate(mutated as any);

    expect(output).toContain('const y = 1;');
  });

  it('should compile correct hierarchical scopes and track reference counts', () => {
    const code = `
      const x = 10;
      function calc(y) {
        const z = x + y;
        return z;
      }
    `;
    const lexer = new Lexer(code);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();

    const analyzer = new ScopeAnalyzer();
    const globalScope = analyzer.analyze(ast);

    // x is declared globally, referenced inside calc function (x + y)
    const bindingX = globalScope.getBinding('x');
    expect(bindingX).toBeDefined();
    expect(bindingX?.referencesCount).toBe(1);

    // calc function binding
    const bindingCalc = globalScope.getBinding('calc');
    expect(bindingCalc).toBeDefined();
    expect(bindingCalc?.referencesCount).toBe(0); // calc is not referenced in this code
  });

  it('should tree-shake unreferenced local declarations while preserving exported bindings', () => {
    const code = `
      const unusedLocal = 100;
      export const usedExport = 200;
      function unusedFunc() {
        return 0;
      }
      export function usedFunc() {
        return 1;
      }
    `;
    const lexer = new Lexer(code);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();

    const optimizer = new Optimizer();
    const optimized = optimizer.optimize(ast);

    const codegen = new CodeGenerator();
    const output = codegen.generate(optimized);

    // Unreferenced local variable and function should be tree-shaken
    expect(output).not.toContain('unusedLocal');
    expect(output).not.toContain('unusedFunc');

    // Exported variable and function should be preserved
    expect(output).toContain('usedExport');
    expect(output).toContain('usedFunc');
  });

  it('should generate valid source map VLQ mapping strings', () => {
    const code = 'const val = 42;';
    const lexer = new Lexer(code);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();

    const codegen = new CodeGenerator();
    const res = codegen.generateWithSourceMap(ast, 'src/main.js');

    expect(res.code).toContain('const val = 42;');
    expect(res.map.version).toBe(3);
    expect(res.map.file).toBe('src/main.js');
    expect(res.map.sources[0]).toBe('src/main.js');
    expect(res.map.mappings).toBeDefined();
    expect(typeof res.map.mappings).toBe('string');
    expect(res.map.mappings.length).toBeGreaterThan(0);
  });
});
