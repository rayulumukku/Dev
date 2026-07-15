import { describe, it, expect } from 'vitest';
import { Lexer, TokenType } from '../../packages/core/src/compiler/lexer.js';
import { Parser } from '../../packages/core/src/compiler/parser.js';
import { Transformer } from '../../packages/core/src/compiler/transformer.js';
import { Optimizer } from '../../packages/core/src/compiler/optimizer.js';
import { CodeGenerator } from '../../packages/core/src/compiler/codegen.js';
import { RayCompiler } from '../../packages/core/src/compiler/index.js';

describe('Native Ray Compiler Core Unit Tests', () => {
  it('should tokenize source code successfully', () => {
    const code = 'const a = 1;';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].type).toBe(TokenType.Keyword);
    expect(tokens[0].value).toBe('const');
  });

  it('should parse variables, imports and functions into strongly typed AST', () => {
    const code = `import React from 'react';
    function App(props) {
      return props.val;
    }`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.type).toBe('Program');
    expect(ast.body[0].type).toBe('ImportDeclaration');
    expect(ast.body[1].type).toBe('FunctionDeclaration');
  });

  it('should transform JSX elements to React.createElement call expressions', () => {
    const code = 'const el = <div className="test">Hello</div>;';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const transformer = new Transformer();
    const transformed = transformer.transform(ast);

    const codegen = new CodeGenerator();
    const output = codegen.generate(transformed);

    expect(output).toContain('React.createElement("div"');
    expect(output).toContain('className: "test"');
  });

  it('should optimize binary expressions via constant folding', () => {
    const code = 'export const sum = 1 + 2;';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const optimizer = new Optimizer();
    const optimized = optimizer.optimize(ast);

    const codegen = new CodeGenerator();
    const output = codegen.generate(optimized);

    expect(output).toContain('export const sum = 3;');
  });

  it('should eliminate dead-code branches of IfStatements', () => {
    const code = `if (false) {
      console.log("dead");
    } else {
      console.log("alive");
    }`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const optimizer = new Optimizer();
    const optimized = optimizer.optimize(ast);

    const codegen = new CodeGenerator();
    const output = codegen.generate(optimized);

    expect(output).not.toContain('console.log("dead")');
    expect(output).toContain('console.log("alive")');
  });

  it('should run end-to-end compiles in RayCompiler pipeline', () => {
    const code = `import React from 'react';
    export default function Main() {
      const value = process.env.NODE_ENV;
      return <div className="card">{value}</div>;
    }`;

    const compiler = new RayCompiler({ NODE_ENV: 'production' });
    const res = compiler.compile(code, 'src/main.jsx');

    expect(res.code).toContain('React.createElement("div"');
    expect(res.code).toContain('"production"');
    expect(res.astNodesCount).toBeGreaterThan(0);
    expect(res.parseTimeMs).toBeDefined();
    expect(res.transformTimeMs).toBeDefined();
    expect(res.emitTimeMs).toBeDefined();
  });
});
