import { describe, it, expect } from 'vitest';
import { Lexer, TokenType } from '../../packages/core/src/compiler/lexer.js';
import { Parser } from '../../packages/core/src/compiler/parser.js';
import { Transformer } from '../../packages/core/src/compiler/transformer.js';
import { Optimizer } from '../../packages/core/src/compiler/optimizer.js';
import { CodeGenerator } from '../../packages/core/src/compiler/codegen.js';
import { RayCompiler } from '../../packages/core/src/compiler/index.js';
import { NodeType } from '../../packages/core/src/compiler/ast.js';

function parse(code: string) {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

function compile(code: string, minify = false) {
  const ast = parse(code);
  const codegen = new CodeGenerator(minify);
  return codegen.generate(ast);
}

function transformAndGenerate(code: string, env: Record<string, string> = {}, opts?: any) {
  const ast = parse(code);
  const transformer = new Transformer(env, opts);
  const transformed = transformer.transform(ast);
  const codegen = new CodeGenerator();
  return codegen.generate(transformed);
}

// ═══════════════════════════════════════════════════════════════════════════
//  1. Arrow Functions
// ═══════════════════════════════════════════════════════════════════════════

describe('Arrow Functions', () => {
  it('should parse and generate concise arrow functions', () => {
    const code = 'const add = (a, b) => a + b;';
    const output = compile(code);
    expect(output).toContain('=>');
    expect(output).toContain('a + b');
  });

  it('should parse single-param arrow without parens', () => {
    const code = 'const double = x => x * 2;';
    const output = compile(code);
    expect(output).toContain('=>');
    expect(output).toContain('x * 2');
  });

  it('should parse arrow with block body', () => {
    const code = 'const fn = (x) => { return x + 1; };';
    const output = compile(code);
    expect(output).toContain('=>');
    expect(output).toContain('return');
  });

  it('should parse async arrow', () => {
    const code = 'const fetchData = async (url) => { return await fetch(url); };';
    const output = compile(code);
    expect(output).toContain('async');
    expect(output).toContain('=>');
    expect(output).toContain('await');
  });

  it('should parse arrow with default params', () => {
    const code = 'const greet = (name = "world") => name;';
    const output = compile(code);
    expect(output).toContain('name = "world"');
  });

  it('should parse arrow with rest params', () => {
    const code = 'const sum = (...nums) => nums.reduce((a, b) => a + b);';
    const output = compile(code);
    expect(output).toContain('...nums');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  2. Classes
// ═══════════════════════════════════════════════════════════════════════════

describe('Classes', () => {
  it('should parse class declarations with constructor and methods', () => {
    const code = `class Foo {
      constructor(x) { this.x = x; }
      getX() { return this.x; }
    }`;
    const ast = parse(code);
    expect(ast.body[0].type).toBe(NodeType.ClassDeclaration);
    const output = compile(code);
    expect(output).toContain('class Foo');
    expect(output).toContain('constructor');
    expect(output).toContain('getX');
  });

  it('should parse class with extends', () => {
    const code = 'class Bar extends Foo { }';
    const output = compile(code);
    expect(output).toContain('extends Foo');
  });

  it('should parse static methods and properties', () => {
    const code = `class Config {
      static defaultValue = 42;
      static create() { return new Config(); }
    }`;
    const output = compile(code);
    expect(output).toContain('static defaultValue');
    expect(output).toContain('static create');
  });

  it('should parse private fields', () => {
    const code = `class Counter {
      #count = 0;
      increment() { this.#count++; }
    }`;
    const output = compile(code);
    expect(output).toContain('#count');
  });

  it('should parse getter and setter', () => {
    const code = `class Obj {
      get value() { return this._v; }
      set value(v) { this._v = v; }
    }`;
    const output = compile(code);
    expect(output).toContain('get value');
    expect(output).toContain('set value');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  3. Destructuring
// ═══════════════════════════════════════════════════════════════════════════

describe('Destructuring', () => {
  it('should parse object destructuring', () => {
    const code = 'const { a, b: c } = obj;';
    const output = compile(code);
    expect(output).toContain('{ a, b: c }');
  });

  it('should parse array destructuring', () => {
    const code = 'const [first, ...rest] = arr;';
    const output = compile(code);
    expect(output).toContain('[first, ...rest]');
  });

  it('should parse destructuring with defaults', () => {
    const code = 'const { x = 10, y = 20 } = pos;';
    const output = compile(code);
    expect(output).toContain('x = 10');
    expect(output).toContain('y = 20');
  });

  it('should parse nested destructuring', () => {
    const code = 'const { a: { b } } = deep;';
    const ast = parse(code);
    const decl = ast.body[0];
    expect(decl.declarations[0].id.type).toBe(NodeType.ObjectPattern);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  4. Template Literals
// ═══════════════════════════════════════════════════════════════════════════

describe('Template Literals', () => {
  it('should parse simple template literals', () => {
    const code = 'const msg = `hello world`;';
    const output = compile(code);
    expect(output).toContain('`hello world`');
  });

  it('should parse template literals with expressions', () => {
    const code = 'const msg = `hello ${name}!`;';
    const output = compile(code);
    expect(output).toContain('${');
    expect(output).toContain('name');
  });

  it('should parse tagged template literals', () => {
    const code = 'const result = html`<div>${content}</div>`;';
    const output = compile(code);
    expect(output).toContain('html`');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  5. Optional Chaining & Nullish Coalescing
// ═══════════════════════════════════════════════════════════════════════════

describe('Optional Chaining & Nullish Coalescing', () => {
  it('should parse optional member access', () => {
    const code = 'const val = obj?.foo?.bar;';
    const output = compile(code);
    expect(output).toContain('?.');
  });

  it('should parse optional call', () => {
    const code = 'const result = fn?.(arg);';
    const output = compile(code);
    expect(output).toContain('?.(');
  });

  it('should parse nullish coalescing', () => {
    const code = 'const val = x ?? defaultValue;';
    const output = compile(code);
    expect(output).toContain('??');
  });

  it('should parse optional computed access', () => {
    const code = 'const val = arr?.[0];';
    const output = compile(code);
    expect(output).toContain('?.[');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  6. Spread & Rest
// ═══════════════════════════════════════════════════════════════════════════

describe('Spread & Rest', () => {
  it('should parse spread in arrays', () => {
    const code = 'const arr = [1, ...other, 3];';
    const output = compile(code);
    expect(output).toContain('...other');
  });

  it('should parse spread in objects', () => {
    const code = 'const obj = { ...base, extra: 1 };';
    const output = compile(code);
    expect(output).toContain('...base');
  });

  it('should parse spread in function calls', () => {
    const code = 'fn(...args);';
    const output = compile(code);
    expect(output).toContain('...args');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  7. For / While / Do-While Loops
// ═══════════════════════════════════════════════════════════════════════════

describe('Loops', () => {
  it('should parse for loops', () => {
    const code = 'for (let i = 0; i < 10; i++) { console.log(i); }';
    const output = compile(code);
    expect(output).toContain('for');
    expect(output).toContain('i < 10');
  });

  it('should parse for...of loops', () => {
    const code = 'for (const item of items) { process(item); }';
    const output = compile(code);
    expect(output).toContain('of');
  });

  it('should parse for...in loops', () => {
    const code = 'for (const key in obj) { console.log(key); }';
    const output = compile(code);
    expect(output).toContain('in');
  });

  it('should parse while loops', () => {
    const code = 'while (running) { tick(); }';
    const output = compile(code);
    expect(output).toContain('while');
  });

  it('should parse do-while loops', () => {
    const code = 'do { tick(); } while (running);';
    const output = compile(code);
    expect(output).toContain('do');
    expect(output).toContain('while');
  });

  it('should parse for await...of loops', () => {
    const code = 'for await (const chunk of stream) { process(chunk); }';
    const ast = parse(code);
    expect(ast.body[0].type).toBe(NodeType.ForOfStatement);
    expect(ast.body[0].await).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  8. Switch Statements
// ═══════════════════════════════════════════════════════════════════════════

describe('Switch Statements', () => {
  it('should parse switch with cases and default', () => {
    const code = `switch (action) {
      case 'start': start(); break;
      case 'stop': stop(); break;
      default: idle();
    }`;
    const output = compile(code);
    expect(output).toContain('switch');
    expect(output).toContain('case');
    expect(output).toContain('default');
    expect(output).toContain('break');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  9. Try / Catch / Finally
// ═══════════════════════════════════════════════════════════════════════════

describe('Try / Catch / Finally', () => {
  it('should parse try-catch', () => {
    const code = 'try { riskyOp(); } catch (e) { handleError(e); }';
    const output = compile(code);
    expect(output).toContain('try');
    expect(output).toContain('catch');
  });

  it('should parse try-catch-finally', () => {
    const code = 'try { op(); } catch (e) { log(e); } finally { cleanup(); }';
    const output = compile(code);
    expect(output).toContain('finally');
  });

  it('should parse optional catch binding', () => {
    const code = 'try { op(); } catch { fallback(); }';
    const ast = parse(code);
    expect(ast.body[0].type).toBe(NodeType.TryStatement);
    expect(ast.body[0].handler.param).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  10. Import Attributes
// ═══════════════════════════════════════════════════════════════════════════

describe('Import Attributes', () => {
  it('should parse import with type attribute', () => {
    const code = `import data from './data.json' with { type: 'json' };`;
    const ast = parse(code);
    const importNode = ast.body[0];
    expect(importNode.type).toBe(NodeType.ImportDeclaration);
    expect(importNode.attributes).toBeDefined();
    expect(importNode.attributes).toHaveLength(1);
    expect(importNode.attributes[0].key.name).toBe('type');
    expect(importNode.attributes[0].value.value).toBe('json');
  });

  it('should generate import attributes in output', () => {
    const code = `import data from './data.json' with { type: 'json' };`;
    const output = compile(code);
    expect(output).toContain('with');
    expect(output).toContain("type: 'json'");
  });

  it('should parse assert (legacy) syntax', () => {
    const code = `import data from './data.json' assert { type: 'json' };`;
    const ast = parse(code);
    expect(ast.body[0].attributes).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  11. Decorators
// ═══════════════════════════════════════════════════════════════════════════

describe('Decorators', () => {
  it('should parse decorators on classes', () => {
    const code = `@observable class Store { }`;
    const ast = parse(code);
    const cls = ast.body[0];
    expect(cls.type).toBe(NodeType.ClassDeclaration);
    expect(cls.decorators).toHaveLength(1);
    expect(cls.decorators[0].expression.name).toBe('observable');
  });

  it('should parse decorator with arguments', () => {
    const code = `@inject('dep') class Service { }`;
    const ast = parse(code);
    const cls = ast.body[0];
    expect(cls.decorators[0].expression.type).toBe(NodeType.CallExpression);
  });

  it('should generate decorators in output', () => {
    const code = `@sealed class Foo { }`;
    const output = compile(code);
    expect(output).toContain('@sealed');
    expect(output).toContain('class Foo');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  12. Using Declaration (Explicit Resource Management)
// ═══════════════════════════════════════════════════════════════════════════

describe('Using Declaration', () => {
  it('should parse using declaration', () => {
    const code = 'using resource = getResource();';
    const ast = parse(code);
    expect(ast.body[0].type).toBe(NodeType.UsingDeclaration);
  });

  it('should generate using declaration', () => {
    const code = 'using handle = openFile();';
    const output = compile(code);
    expect(output).toContain('using');
    expect(output).toContain('handle');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  13. JSX Automatic Runtime
// ═══════════════════════════════════════════════════════════════════════════

describe('JSX Automatic Runtime', () => {
  it('should transform JSX to _jsx calls with automatic runtime', () => {
    const code = 'const el = <div className="card">Hello</div>;';
    const output = transformAndGenerate(code, {}, { jsxRuntime: 'automatic' });
    expect(output).toContain('_jsx(');
    expect(output).toContain('react/jsx-runtime');
    expect(output).not.toContain('React.createElement');
  });

  it('should use _jsxs for multiple children', () => {
    const code = 'const el = <div><span>A</span><span>B</span></div>;';
    const output = transformAndGenerate(code, {}, { jsxRuntime: 'automatic' });
    expect(output).toContain('_jsxs(');
  });

  it('should still use React.createElement in classic mode', () => {
    const code = 'const el = <div>Hello</div>;';
    const output = transformAndGenerate(code, {}, { jsxRuntime: 'classic' });
    expect(output).toContain('React.createElement');
    expect(output).not.toContain('_jsx');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  14. TypeScript Stripping
// ═══════════════════════════════════════════════════════════════════════════

describe('TypeScript Stripping', () => {
  it('should strip type annotations from variable declarations', () => {
    const code = 'const x: number = 42;';
    const output = compile(code);
    expect(output).toContain('const x = 42;');
    expect(output).not.toContain('number');
  });

  it('should strip type annotations from function params', () => {
    const code = 'function greet(name: string) { return name; }';
    const output = compile(code);
    expect(output).toContain('function greet(name)');
    expect(output).not.toContain('string');
  });

  it('should strip import type statements', () => {
    const code = `import type { Foo } from './types';
const x = 1;`;
    const output = compile(code);
    expect(output).not.toContain('import type');
    expect(output).toContain('const x = 1;');
  });

  it('should handle generic type parameters on functions', () => {
    const code = 'function identity<T>(x: T): T { return x; }';
    const output = compile(code);
    expect(output).toContain('function identity(x)');
    expect(output).not.toContain('<T>');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  15. Export Variations
// ═══════════════════════════════════════════════════════════════════════════

describe('Export Variations', () => {
  it('should parse export * from', () => {
    const code = `export * from 'module';`;
    const ast = parse(code);
    expect(ast.body[0].type).toBe(NodeType.ExportAllDeclaration);
  });

  it('should parse export * as ns from', () => {
    const code = `export * as utils from './utils';`;
    const output = compile(code);
    expect(output).toContain('as utils');
  });

  it('should parse named re-exports', () => {
    const code = `export { default as Foo, bar } from './module';`;
    const output = compile(code);
    expect(output).toContain('default as Foo');
    expect(output).toContain('bar');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  16. Ternary / Conditional Expression
// ═══════════════════════════════════════════════════════════════════════════

describe('Conditional Expressions', () => {
  it('should parse ternary operator', () => {
    const code = 'const val = cond ? a : b;';
    const output = compile(code);
    expect(output).toContain('?');
    expect(output).toContain(':');
  });

  it('should constant-fold in optimizer', () => {
    const code = 'export const val = true ? 1 : 2;';
    const ast = parse(code);
    const optimizer = new Optimizer();
    const optimized = optimizer.optimize(ast);
    const codegen = new CodeGenerator();
    const output = codegen.generate(optimized);
    expect(output).toContain('1');
    expect(output).not.toContain('true ? 1 : 2');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  17. New Expression
// ═══════════════════════════════════════════════════════════════════════════

describe('New Expression', () => {
  it('should parse new expressions', () => {
    const code = 'const obj = new Foo(1, 2);';
    const output = compile(code);
    expect(output).toContain('new Foo(1, 2)');
  });

  it('should parse new with member expression', () => {
    const code = 'const err = new Error("fail");';
    const output = compile(code);
    expect(output).toContain('new Error');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  18. Lexer: New Tokens
// ═══════════════════════════════════════════════════════════════════════════

describe('Lexer: New Token Types', () => {
  it('should tokenize template literals', () => {
    const code = '`hello ${name}`';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    expect(tokens.some(t => t.type === TokenType.TemplateHead)).toBe(true);
    expect(tokens.some(t => t.type === TokenType.TemplateTail)).toBe(true);
  });

  it('should tokenize simple template strings', () => {
    const code = '`hello world`';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    expect(tokens.some(t => t.type === TokenType.TemplateNoSub)).toBe(true);
  });

  it('should tokenize optional chaining operator', () => {
    const code = 'a?.b';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    expect(tokens.some(t => t.value === '?.')).toBe(true);
  });

  it('should tokenize nullish coalescing operator', () => {
    const code = 'a ?? b';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    expect(tokens.some(t => t.value === '??')).toBe(true);
  });

  it('should tokenize spread operator', () => {
    const code = '...args';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    expect(tokens.some(t => t.value === '...')).toBe(true);
  });

  it('should tokenize private identifiers', () => {
    const code = 'this.#field';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    expect(tokens.some(t => t.type === TokenType.PrivateIdentifier && t.value === '#field')).toBe(true);
  });

  it('should tokenize logical assignment operators', () => {
    const code = 'a ??= b; x ||= y; z &&= w;';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    expect(tokens.some(t => t.value === '??=')).toBe(true);
    expect(tokens.some(t => t.value === '||=')).toBe(true);
    expect(tokens.some(t => t.value === '&&=')).toBe(true);
  });

  it('should tokenize exponentiation operator', () => {
    const code = '2 ** 3';
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    expect(tokens.some(t => t.value === '**')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  19. RayCompiler E2E with new features
// ═══════════════════════════════════════════════════════════════════════════

describe('RayCompiler E2E — Ecosystem Features', () => {
  it('should compile arrow functions end-to-end', () => {
    const code = `const add = (a, b) => a + b;
export default add;`;
    const compiler = new RayCompiler({});
    const result = compiler.compile(code, 'test.js');
    expect(result.code).toContain('=>');
    expect(result.code).toContain('export default');
  });

  it('should compile classes end-to-end', () => {
    const code = `export class Counter {
  #count = 0;
  increment() { this.#count++; }
  get value() { return this.#count; }
}`;
    const compiler = new RayCompiler({});
    const result = compiler.compile(code, 'counter.ts');
    expect(result.code).toContain('class Counter');
    expect(result.code).toContain('#count');
  });

  it('should compile template literals end-to-end', () => {
    const code = 'export const msg = `Hello ${name}, you have ${count} items`;';
    const compiler = new RayCompiler({});
    const result = compiler.compile(code, 'msg.js');
    expect(result.code).toContain('${');
  });

  it('should compile optional chaining end-to-end', () => {
    const code = 'export const val = data?.user?.name ?? "anonymous";';
    const compiler = new RayCompiler({});
    const result = compiler.compile(code, 'safe.js');
    expect(result.code).toContain('?.');
    expect(result.code).toContain('??');
  });

  it('should compile for...of and destructuring end-to-end', () => {
    const code = `for (const { name, age } of users) {
  console.log(name, age);
}`;
    const compiler = new RayCompiler({});
    const result = compiler.compile(code, 'loop.js');
    expect(result.code).toContain('for');
    expect(result.code).toContain('of');
    expect(result.code).toContain('{ name, age }');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  20. Backward Compatibility — Existing Tests Still Pass
// ═══════════════════════════════════════════════════════════════════════════

describe('Backward Compatibility', () => {
  it('should still parse imports and functions', () => {
    const code = `import React from 'react';
function App(props) { return props.val; }`;
    const ast = parse(code);
    expect(ast.type).toBe('Program');
    expect(ast.body[0].type).toBe('ImportDeclaration');
    expect(ast.body[1].type).toBe('FunctionDeclaration');
  });

  it('should still transform JSX to React.createElement in classic mode', () => {
    const code = 'const el = <div className="test">Hello</div>;';
    const output = transformAndGenerate(code, {}, { jsxRuntime: 'classic' });
    expect(output).toContain('React.createElement("div"');
    expect(output).toContain('className');
  });

  it('should still constant-fold binary expressions', () => {
    const code = 'export const sum = 1 + 2;';
    const ast = parse(code);
    const optimizer = new Optimizer();
    const optimized = optimizer.optimize(ast);
    const codegen = new CodeGenerator();
    const output = codegen.generate(optimized);
    expect(output).toContain('export const sum = 3;');
  });

  it('should still eliminate dead code', () => {
    const code = `if (false) { console.log("dead"); } else { console.log("alive"); }`;
    const ast = parse(code);
    const optimizer = new Optimizer();
    const optimized = optimizer.optimize(ast);
    const codegen = new CodeGenerator();
    const output = codegen.generate(optimized);
    expect(output).not.toContain('console.log("dead")');
    expect(output).toContain('console.log("alive")');
  });

  it('should still replace env variables', () => {
    const code = 'const mode = process.env.NODE_ENV;';
    const output = transformAndGenerate(code, { NODE_ENV: 'production' });
    expect(output).toContain('"production"');
  });
});
