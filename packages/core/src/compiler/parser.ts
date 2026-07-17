import { Token, TokenType } from './lexer.js';
import { ASTNode, NodeType, Program } from './ast.js';

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t => t.type !== TokenType.Comment);
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: TokenType.EOF, value: '', line: 0, column: 0 };
  }

  private peek2(): Token | null {
    return this.tokens[this.current + 1] || null;
  }

  private peekN(n: number): Token | null {
    return this.tokens[this.current + n] || null;
  }

  private advance(): Token {
    const t = this.peek();
    if (this.current < this.tokens.length) {
      this.current++;
    }
    return t;
  }

  private consume(type: TokenType, value?: string): Token {
    const t = this.peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`[Ray Parser Error] Expected token of type ${type}${value ? ` with value "${value}"` : ''}, got type ${t.type} ("${t.value}") at line ${t.line}, col ${t.column}`);
    }
    return this.advance();
  }

  private match(type: TokenType, value?: string): boolean {
    const t = this.peek();
    return t.type === type && (value === undefined || t.value === value);
  }

  private eat(type: TokenType, value?: string): Token | null {
    if (this.match(type, value)) return this.advance();
    return null;
  }

  private loc(): { line: number; column: number } {
    const t = this.peek();
    return { line: t.line, column: t.column };
  }

  parse(): Program {
    const body: ASTNode[] = [];
    while (this.peek().type !== TokenType.EOF) {
      if (this.peek().value === ';') {
        this.advance();
        continue;
      }
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    const program: Program = {
      type: NodeType.Program,
      body
    };
    this.decorate(program);
    return program;
  }

  private decorate(node: ASTNode) {
    let tokenIdx = 0;
    const walk = (n: ASTNode) => {
      if (!n) return;
      if (tokenIdx < this.tokens.length) {
        n.loc = { line: this.tokens[tokenIdx].line, column: this.tokens[tokenIdx].column };
      } else {
        n.loc = { line: 1, column: 0 };
      }
      tokenIdx++;

      if (n.type === NodeType.Program || n.type === NodeType.BlockStatement) {
        if (Array.isArray(n.body)) n.body.forEach(walk);
      } else if (n.type === NodeType.VariableDeclaration) {
        if (Array.isArray(n.declarations)) n.declarations.forEach(walk);
      } else if (n.type === NodeType.VariableDeclarator) {
        walk(n.id);
        if (n.init) walk(n.init);
      } else if (n.type === NodeType.FunctionDeclaration) {
        walk(n.id);
        if (Array.isArray(n.params)) n.params.forEach(walk);
        walk(n.body);
      } else if (n.type === NodeType.ExportNamedDeclaration) {
        if (n.declaration) walk(n.declaration);
      } else if (n.type === NodeType.IfStatement) {
        walk(n.test);
        walk(n.consequent);
        if (n.alternate) walk(n.alternate);
      } else if (n.type === NodeType.BinaryExpression || n.type === NodeType.LogicalExpression) {
        walk(n.left);
        walk(n.right);
      } else if (n.type === NodeType.CallExpression) {
        walk(n.callee);
        if (Array.isArray(n.arguments)) n.arguments.forEach(walk);
      } else if (n.type === NodeType.ExpressionStatement) {
        walk(n.expression);
      } else if (n.type === NodeType.MemberExpression) {
        walk(n.object);
        walk(n.property);
      } else if (n.type === NodeType.JSXElement) {
        if (Array.isArray(n.children)) n.children.forEach(walk);
      } else if (n.type === NodeType.ArrowFunctionExpression) {
        if (Array.isArray(n.params)) n.params.forEach(walk);
        walk(n.body);
      } else if (n.type === NodeType.ClassDeclaration) {
        if (n.id) walk(n.id);
        if (n.superClass) walk(n.superClass);
        walk(n.body);
      } else if (n.type === NodeType.ClassBody) {
        if (Array.isArray(n.body)) n.body.forEach(walk);
      } else if (n.type === NodeType.TemplateLiteral) {
        if (Array.isArray(n.quasis)) n.quasis.forEach(walk);
        if (Array.isArray(n.expressions)) n.expressions.forEach(walk);
      } else if (n.type === NodeType.ConditionalExpression) {
        walk(n.test);
        walk(n.consequent);
        walk(n.alternate);
      } else if (n.type === NodeType.ForStatement) {
        if (n.init) walk(n.init);
        if (n.test) walk(n.test);
        if (n.update) walk(n.update);
        walk(n.body);
      } else if (n.type === NodeType.ForInStatement || n.type === NodeType.ForOfStatement) {
        walk(n.left);
        walk(n.right);
        walk(n.body);
      } else if (n.type === NodeType.WhileStatement || n.type === NodeType.DoWhileStatement) {
        walk(n.test);
        walk(n.body);
      } else if (n.type === NodeType.TryStatement) {
        walk(n.block);
        if (n.handler) walk(n.handler);
        if (n.finalizer) walk(n.finalizer);
      } else if (n.type === NodeType.CatchClause) {
        if (n.param) walk(n.param);
        walk(n.body);
      } else if (n.type === NodeType.ReturnStatement || n.type === NodeType.ThrowStatement) {
        if (n.argument) walk(n.argument);
      } else if (n.type === NodeType.AssignmentExpression) {
        walk(n.left);
        walk(n.right);
      }
    };
    walk(node);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Statements
  // ═══════════════════════════════════════════════════════════════════════════

  private parseStatement(): ASTNode {
    const token = this.peek();

    // Decorators
    if (token.value === '@') {
      const decorators = this.parseDecorators();
      // After decorators, expect class or export
      if (this.match(TokenType.Keyword, 'class')) {
        const cls = this.parseClassDeclaration();
        cls.decorators = decorators;
        return cls;
      }
      if (this.match(TokenType.Keyword, 'export')) {
        const exp = this.parseExportDeclaration();
        if (exp.declaration && exp.declaration.type === NodeType.ClassDeclaration) {
          exp.declaration.decorators = decorators;
        }
        return exp;
      }
      // Unexpected decorators location — treat as expression
      return this.parseExpressionStatement();
    }

    if (token.value === '{') {
      return this.parseBlockStatement();
    }

    if (token.type === TokenType.Keyword) {
      switch (token.value) {
        case 'import': return this.parseImportDeclaration();
        case 'export': return this.parseExportDeclaration();
        case 'const':
        case 'let':
        case 'var':
          return this.parseVariableDeclaration();
        case 'using':
          return this.parseUsingDeclaration();
        case 'function':
          return this.parseFunctionDeclaration(false);
        case 'async': {
          const next = this.peek2();
          if (next && next.value === 'function') {
            this.advance(); // consume 'async'
            return this.parseFunctionDeclaration(true);
          }
          // async arrow: fall through to expression
          break;
        }
        case 'class':
          return this.parseClassDeclaration();
        case 'if':
          return this.parseIfStatement();
        case 'for':
          return this.parseForStatement();
        case 'while':
          return this.parseWhileStatement();
        case 'do':
          return this.parseDoWhileStatement();
        case 'switch':
          return this.parseSwitchStatement();
        case 'try':
          return this.parseTryStatement();
        case 'throw':
          return this.parseThrowStatement();
        case 'return':
          return this.parseReturnStatement();
        case 'break':
          return this.parseBreakStatement();
        case 'continue':
          return this.parseContinueStatement();
        case 'debugger': {
          this.advance();
          this.eat(TokenType.Punctuator, ';');
          return { type: NodeType.ExpressionStatement, expression: { type: NodeType.Identifier, name: 'debugger' } };
        }
      }
    }

    // JSX block detection
    if (token.type === TokenType.JSXTagOpen) {
      return this.parseJSXElement();
    }

    return this.parseExpressionStatement();
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  private parseImportDeclaration(): ASTNode {
    const start = this.consume(TokenType.Keyword, 'import');

    // Dynamic import as expression statement: import(...)
    if (this.match(TokenType.Punctuator, '(')) {
      this.current--; // put 'import' back
      // Actually we can't put it back easily — handle inline
      this.advance(); // (
      const arg = this.parseAssignmentExpression();
      // import attributes: import(..., { with: { type: 'json' } })
      let attrs: ASTNode | null = null;
      if (this.eat(TokenType.Punctuator, ',')) {
        attrs = this.parseAssignmentExpression();
      }
      this.consume(TokenType.Punctuator, ')');
      const expr: ASTNode = {
        type: NodeType.ImportExpression,
        source: arg,
        attributes: attrs,
      };
      this.eat(TokenType.Punctuator, ';');
      return { type: NodeType.ExpressionStatement, expression: expr };
    }

    // import type { ... } from ... (TS — skip entirely)
    if (this.match(TokenType.Identifier, 'type') || this.match(TokenType.Keyword, 'type')) {
      const afterType = this.peek2();
      if (afterType && (afterType.value === '{' || afterType.value === '*' || afterType.type === TokenType.Identifier)) {
        // This is `import type ...` — consume until semicolon
        while (!this.match(TokenType.Punctuator, ';') && !this.match(TokenType.EOF)) {
          this.advance();
        }
        this.eat(TokenType.Punctuator, ';');
        return { type: NodeType.ImportDeclaration, specifiers: [], source: { type: NodeType.Literal, value: '', raw: '""' }, _tsTypeOnly: true };
      }
    }

    const specifiers: ASTNode[] = [];
    const next = this.peek();

    if (next.type === TokenType.StringLiteral) {
      // Side effect import: import "module";
      const sourceVal = this.advance();
      const attributes = this.parseImportAttributes();
      this.eat(TokenType.Punctuator, ';');
      return {
        type: NodeType.ImportDeclaration,
        specifiers: [],
        source: { type: NodeType.Literal, value: sourceVal.value.replace(/['"`]/g, ''), raw: sourceVal.value },
        attributes,
      };
    }

    if (next.type === TokenType.Identifier || (next.type === TokenType.Keyword && next.value !== 'from')) {
      // Default import: import React from "react";
      const local = this.advance();
      specifiers.push({
        type: NodeType.ImportDefaultSpecifier,
        local: { type: NodeType.Identifier, name: local.value }
      });
      if (this.peek().value === ',') {
        this.advance(); // consume comma
      }
    }

    if (this.peek().value === '*') {
      // Namespace import: import * as x from "y";
      this.advance(); // *
      this.consume(TokenType.Keyword, 'as');
      const local = this.advance();
      specifiers.push({
        type: NodeType.ImportNamespaceSpecifier,
        local: { type: NodeType.Identifier, name: local.value }
      });
    } else if (this.peek().value === '{') {
      // Named import: import { a, b as c } from "y";
      this.advance(); // {
      while (this.peek().value !== '}') {
        // Skip 'type' keyword in named imports (TS)
        if ((this.match(TokenType.Identifier, 'type') || this.match(TokenType.Keyword, 'type')) && this.peek2() && this.peek2()!.type === TokenType.Identifier) {
          this.advance(); // skip 'type'
        }
        const imported = this.advance();
        let local = imported;
        if (this.peek().value === 'as') {
          this.advance(); // as
          local = this.advance();
        }
        specifiers.push({
          type: NodeType.ImportSpecifier,
          imported: { type: NodeType.Identifier, name: imported.value },
          local: { type: NodeType.Identifier, name: local.value }
        });
        if (this.peek().value === ',') {
          this.advance();
        }
      }
      this.consume(TokenType.Punctuator, '}');
    }

    if (this.peek().value === 'from') {
      this.advance();
    }
    const source = this.consume(TokenType.StringLiteral);
    const attributes = this.parseImportAttributes();
    this.eat(TokenType.Punctuator, ';');

    return {
      type: NodeType.ImportDeclaration,
      specifiers,
      source: { type: NodeType.Literal, value: source.value.replace(/['"`]/g, ''), raw: source.value },
      attributes,
    };
  }

  private parseImportAttributes(): ASTNode[] | undefined {
    // import ... with { type: 'json' }
    // import ... assert { type: 'json' } (older)
    if (
      (this.match(TokenType.Keyword, 'with') || this.match(TokenType.Identifier, 'with') ||
       this.match(TokenType.Identifier, 'assert'))
    ) {
      this.advance(); // 'with' or 'assert'
      const attrs: ASTNode[] = [];
      this.consume(TokenType.Punctuator, '{');
      while (!this.match(TokenType.Punctuator, '}')) {
        const key = this.advance();
        this.consume(TokenType.Punctuator, ':');
        const value = this.consume(TokenType.StringLiteral);
        attrs.push({
          type: NodeType.ImportAttribute,
          key: { type: NodeType.Identifier, name: key.value },
          value: { type: NodeType.Literal, value: value.value.replace(/['"`]/g, ''), raw: value.value },
        });
        this.eat(TokenType.Punctuator, ',');
      }
      this.consume(TokenType.Punctuator, '}');
      return attrs;
    }
    return undefined;
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  private parseExportDeclaration(): ASTNode {
    this.consume(TokenType.Keyword, 'export');

    // export * from '...'
    if (this.match(TokenType.Punctuator, '*')) {
      this.advance(); // *
      let exported: ASTNode | null = null;
      if (this.match(TokenType.Keyword, 'as') || this.match(TokenType.Identifier, 'as')) {
        this.advance(); // 'as'
        const name = this.advance();
        exported = { type: NodeType.Identifier, name: name.value };
      }
      this.advance(); // 'from'
      const source = this.consume(TokenType.StringLiteral);
      const attributes = this.parseImportAttributes();
      this.eat(TokenType.Punctuator, ';');
      return {
        type: NodeType.ExportAllDeclaration,
        exported,
        source: { type: NodeType.Literal, value: source.value.replace(/['"`]/g, ''), raw: source.value },
        attributes,
      };
    }

    // export { ... } or export { ... } from '...'
    if (this.match(TokenType.Punctuator, '{')) {
      this.advance(); // {
      const specifiers: ASTNode[] = [];
      while (!this.match(TokenType.Punctuator, '}')) {
        // Skip 'type' in export { type Foo }
        if ((this.match(TokenType.Identifier, 'type') || this.match(TokenType.Keyword, 'type')) && this.peek2() && this.peek2()!.type === TokenType.Identifier) {
          this.advance(); // skip 'type'
        }
        const local = this.advance();
        let exported = local;
        if (this.match(TokenType.Keyword, 'as') || this.match(TokenType.Identifier, 'as')) {
          this.advance(); // as
          exported = this.advance();
        }
        specifiers.push({
          type: NodeType.ExportSpecifier,
          local: { type: NodeType.Identifier, name: local.value },
          exported: { type: NodeType.Identifier, name: exported.value },
        });
        this.eat(TokenType.Punctuator, ',');
      }
      this.consume(TokenType.Punctuator, '}');

      let source: ASTNode | null = null;
      if (this.match(TokenType.Keyword, 'from') || this.match(TokenType.Identifier, 'from')) {
        this.advance(); // from
        const src = this.consume(TokenType.StringLiteral);
        source = { type: NodeType.Literal, value: src.value.replace(/['"`]/g, ''), raw: src.value };
      }
      const attributes = this.parseImportAttributes();
      this.eat(TokenType.Punctuator, ';');
      return {
        type: NodeType.ExportNamedDeclaration,
        declaration: null,
        specifiers,
        source,
        attributes,
        isDefault: false,
      };
    }

    // export type ... (TS — skip)
    if ((this.match(TokenType.Identifier, 'type') || this.match(TokenType.Keyword, 'type'))) {
      const afterType = this.peek2();
      if (afterType && (afterType.value === '{' || afterType.type === TokenType.Identifier)) {
        while (!this.match(TokenType.Punctuator, ';') && !this.match(TokenType.EOF)) {
          this.advance();
        }
        this.eat(TokenType.Punctuator, ';');
        return { type: NodeType.ExportNamedDeclaration, declaration: null, isDefault: false, _tsTypeOnly: true };
      }
    }

    let isDefault = false;
    if (this.match(TokenType.Keyword, 'default')) {
      this.advance();
      isDefault = true;
    }

    // Handle: export [default] async function foo() {}
    const curr = this.peek();
    if (curr.value === 'async') {
      const afterAsync = this.peek2();
      if (afterAsync && afterAsync.value === 'function') {
        this.advance(); // consume 'async'
        const decl = this.parseFunctionDeclaration(true);
        return {
          type: NodeType.ExportNamedDeclaration,
          declaration: decl,
          isDefault,
        };
      }
    }

    // export default <expression>;
    if (isDefault) {
      if (this.match(TokenType.Keyword, 'function')) {
        const decl = this.parseFunctionDeclaration(false);
        return { type: NodeType.ExportNamedDeclaration, declaration: decl, isDefault: true };
      }
      if (this.match(TokenType.Keyword, 'class')) {
        const decl = this.parseClassDeclaration();
        return { type: NodeType.ExportNamedDeclaration, declaration: decl, isDefault: true };
      }
      const expr = this.parseAssignmentExpression();
      this.eat(TokenType.Punctuator, ';');
      return {
        type: NodeType.ExportNamedDeclaration,
        declaration: expr,
        isDefault: true,
      };
    }

    const decl = this.parseStatement();
    return {
      type: NodeType.ExportNamedDeclaration,
      declaration: decl,
      isDefault
    };
  }

  // ── Variable Declarations ──────────────────────────────────────────────────

  private parseVariableDeclaration(): ASTNode {
    const kind = this.advance().value; // const/let/var
    const declarations: ASTNode[] = [];

    while (true) {
      let id: ASTNode;

      // Destructuring patterns
      if (this.match(TokenType.Punctuator, '{')) {
        id = this.parseObjectPattern();
      } else if (this.match(TokenType.Punctuator, '[')) {
        id = this.parseArrayPattern();
      } else {
        const tok = this.consume(TokenType.Identifier);
        id = { type: NodeType.Identifier, name: tok.value };
      }

      // TS type annotation
      this.skipTypeAnnotation();

      let init = null;
      if (this.eat(TokenType.Punctuator, '=')) {
        init = this.parseAssignmentExpression();
      }

      declarations.push({
        type: NodeType.VariableDeclarator,
        id,
        init
      });

      if (!this.eat(TokenType.Punctuator, ',')) {
        break;
      }
    }

    this.eat(TokenType.Punctuator, ';');

    return {
      type: NodeType.VariableDeclaration,
      kind,
      declarations
    };
  }

  private parseUsingDeclaration(): ASTNode {
    const isAwait = false; // `await using` handled at call site
    this.consume(TokenType.Keyword, 'using');
    const declarations: ASTNode[] = [];

    while (true) {
      const id = this.consume(TokenType.Identifier);
      this.skipTypeAnnotation();
      let init = null;
      if (this.eat(TokenType.Punctuator, '=')) {
        init = this.parseAssignmentExpression();
      }
      declarations.push({
        type: NodeType.VariableDeclarator,
        id: { type: NodeType.Identifier, name: id.value },
        init
      });
      if (!this.eat(TokenType.Punctuator, ',')) break;
    }

    this.eat(TokenType.Punctuator, ';');
    return {
      type: NodeType.UsingDeclaration,
      kind: 'using',
      await: isAwait,
      declarations,
    };
  }

  // ── Function Declaration ──────────────────────────────────────────────────

  private parseFunctionDeclaration(isAsync = false): ASTNode {
    this.consume(TokenType.Keyword, 'function');

    // Generator: function* foo() {}
    const isGenerator = !!this.eat(TokenType.Punctuator, '*');

    // Function name (optional for default exports)
    let id: ASTNode | null = null;
    if (this.match(TokenType.Identifier)) {
      const name = this.advance();
      id = { type: NodeType.Identifier, name: name.value };
    }

    // TS Generics: <T>
    this.skipTypeParameters();

    this.consume(TokenType.Punctuator, '(');
    const params = this.parseFunctionParams();
    this.consume(TokenType.Punctuator, ')');

    // TS return type annotation
    this.skipTypeAnnotation();

    const body = this.parseBlockStatement();

    return {
      type: NodeType.FunctionDeclaration,
      async: isAsync,
      generator: isGenerator,
      id: id || { type: NodeType.Identifier, name: '' },
      params,
      body
    };
  }

  private parseFunctionParams(): ASTNode[] {
    const params: ASTNode[] = [];
    while (!this.match(TokenType.Punctuator, ')')) {
      // Rest element: ...args
      if (this.match(TokenType.Punctuator, '...')) {
        this.advance();
        const arg = this.advance();
        this.skipTypeAnnotation();
        params.push({
          type: NodeType.RestElement,
          argument: { type: NodeType.Identifier, name: arg.value }
        });
        this.eat(TokenType.Punctuator, ',');
        continue;
      }

      // Destructuring param
      if (this.match(TokenType.Punctuator, '{')) {
        const pattern = this.parseObjectPattern();
        this.skipTypeAnnotation();
        // Default value
        if (this.eat(TokenType.Punctuator, '=')) {
          const defaultVal = this.parseAssignmentExpression();
          params.push({ type: NodeType.AssignmentPattern, left: pattern, right: defaultVal });
        } else {
          params.push(pattern);
        }
        this.eat(TokenType.Punctuator, ',');
        continue;
      }
      if (this.match(TokenType.Punctuator, '[')) {
        const pattern = this.parseArrayPattern();
        this.skipTypeAnnotation();
        if (this.eat(TokenType.Punctuator, '=')) {
          const defaultVal = this.parseAssignmentExpression();
          params.push({ type: NodeType.AssignmentPattern, left: pattern, right: defaultVal });
        } else {
          params.push(pattern);
        }
        this.eat(TokenType.Punctuator, ',');
        continue;
      }

      // Simple identifier param
      // Handle visibility modifiers (TS constructor params): public/private/protected/readonly
      if (this.match(TokenType.Identifier, 'public') || this.match(TokenType.Identifier, 'private') ||
          this.match(TokenType.Identifier, 'protected') || this.match(TokenType.Identifier, 'readonly')) {
        this.advance(); // skip modifier
      }

      const paramName = this.advance().value;
      // Optional: ?
      this.eat(TokenType.Punctuator, '?');
      // TS type annotation
      this.skipTypeAnnotation();

      let param: ASTNode = { type: NodeType.Identifier, name: paramName };

      // Default value
      if (this.eat(TokenType.Punctuator, '=')) {
        const defaultVal = this.parseAssignmentExpression();
        param = { type: NodeType.AssignmentPattern, left: param, right: defaultVal };
      }

      params.push(param);
      this.eat(TokenType.Punctuator, ',');
    }
    return params;
  }

  // ── Class Declaration ──────────────────────────────────────────────────────

  private parseClassDeclaration(): ASTNode {
    this.consume(TokenType.Keyword, 'class');

    let id: ASTNode | null = null;
    if (this.match(TokenType.Identifier)) {
      const name = this.advance();
      id = { type: NodeType.Identifier, name: name.value };
    }

    this.skipTypeParameters();

    // implements clause (TS)
    if (this.match(TokenType.Identifier, 'implements') || this.match(TokenType.Keyword, 'implements')) {
      this.advance();
      // Skip type list until {
      while (!this.match(TokenType.Punctuator, '{') && !this.match(TokenType.EOF)) {
        this.advance();
      }
    }

    let superClass: ASTNode | null = null;
    if (this.match(TokenType.Keyword, 'extends')) {
      this.advance();
      superClass = this.parsePrimary();
      // Skip generic args on superclass: extends Base<T>
      this.skipTypeParameters();
      // Skip implements if present after extends
      if (this.match(TokenType.Identifier, 'implements') || this.match(TokenType.Keyword, 'implements')) {
        this.advance();
        while (!this.match(TokenType.Punctuator, '{') && !this.match(TokenType.EOF)) {
          this.advance();
        }
      }
    }

    const body = this.parseClassBody();

    return {
      type: NodeType.ClassDeclaration,
      id,
      superClass,
      body,
    };
  }

  private parseClassBody(): ASTNode {
    this.consume(TokenType.Punctuator, '{');
    const body: ASTNode[] = [];

    while (!this.match(TokenType.Punctuator, '}') && !this.match(TokenType.EOF)) {
      if (this.eat(TokenType.Punctuator, ';')) continue;

      // Decorators on methods/properties
      let decorators: ASTNode[] | undefined;
      if (this.match(TokenType.Punctuator, '@')) {
        decorators = this.parseDecorators();
      }

      let isStatic = false;
      let kind: string = 'method';
      let computed = false;
      let isAsync = false;
      let isGenerator = false;

      // static keyword
      if (this.match(TokenType.Keyword, 'static') || this.match(TokenType.Identifier, 'static')) {
        const next = this.peek2();
        if (next && next.value !== '(' && next.value !== '=' && next.value !== ';' && next.value !== ':') {
          this.advance();
          isStatic = true;
        }
      }

      // abstract (TS) — skip
      if (this.match(TokenType.Identifier, 'abstract')) {
        this.advance();
      }

      // readonly (TS)
      if (this.match(TokenType.Identifier, 'readonly')) {
        this.advance();
      }

      // accessor keyword (stage 3 auto-accessors)
      if (this.match(TokenType.Identifier, 'accessor')) {
        const next = this.peek2();
        if (next && next.value !== '(' && next.value !== '=') {
          this.advance();
        }
      }

      // async
      if ((this.match(TokenType.Keyword, 'async') || this.match(TokenType.Identifier, 'async'))) {
        const next = this.peek2();
        if (next && next.value !== '(' && next.value !== '=' && next.value !== ':' && next.value !== ';') {
          this.advance();
          isAsync = true;
        }
      }

      // generator *
      if (this.eat(TokenType.Punctuator, '*')) {
        isGenerator = true;
      }

      // get/set
      if (this.match(TokenType.Keyword, 'get') || this.match(TokenType.Identifier, 'get')) {
        const next = this.peek2();
        if (next && next.value !== '(' && next.value !== '=') {
          this.advance();
          kind = 'get';
        }
      } else if (this.match(TokenType.Keyword, 'set') || this.match(TokenType.Identifier, 'set')) {
        const next = this.peek2();
        if (next && next.value !== '(' && next.value !== '=') {
          this.advance();
          kind = 'set';
        }
      }

      // Property key
      let key: ASTNode;
      if (this.match(TokenType.Punctuator, '[')) {
        // Computed key
        this.advance();
        key = this.parseAssignmentExpression();
        this.consume(TokenType.Punctuator, ']');
        computed = true;
      } else if (this.match(TokenType.PrivateIdentifier)) {
        const tok = this.advance();
        key = { type: NodeType.PrivateIdentifier, name: tok.value };
      } else if (this.match(TokenType.StringLiteral)) {
        const tok = this.advance();
        key = { type: NodeType.Literal, value: tok.value.replace(/['"`]/g, ''), raw: tok.value };
      } else if (this.match(TokenType.NumericLiteral)) {
        const tok = this.advance();
        key = { type: NodeType.Literal, value: Number(tok.value), raw: tok.value };
      } else {
        const tok = this.advance();
        key = { type: NodeType.Identifier, name: tok.value };
      }

      // constructor is 'constructor' kind
      if (key.type === NodeType.Identifier && key.name === 'constructor') {
        kind = 'constructor';
      }

      // TS optional (?)
      this.eat(TokenType.Punctuator, '?');
      // TS definite assignment (!:)
      if (this.match(TokenType.Punctuator, '!') && this.peek2()?.value === ':') {
        this.advance(); // !
      }

      if (this.match(TokenType.Punctuator, '(') || this.match(TokenType.Punctuator, '<')) {
        // Method
        this.skipTypeParameters();
        this.consume(TokenType.Punctuator, '(');
        const params = this.parseFunctionParams();
        this.consume(TokenType.Punctuator, ')');
        this.skipTypeAnnotation();
        const methodBody = this.parseBlockStatement();

        const member: ASTNode = {
          type: NodeType.MethodDefinition,
          key,
          value: {
            type: NodeType.FunctionDeclaration,
            async: isAsync,
            generator: isGenerator,
            id: key,
            params,
            body: methodBody,
          },
          kind,
          static: isStatic,
          computed,
        };
        if (decorators) member.decorators = decorators;
        body.push(member);
      } else {
        // Property definition
        this.skipTypeAnnotation();
        let value: ASTNode | null = null;
        if (this.eat(TokenType.Punctuator, '=')) {
          value = this.parseAssignmentExpression();
        }
        this.eat(TokenType.Punctuator, ';');

        const member: ASTNode = {
          type: NodeType.PropertyDefinition,
          key,
          value,
          static: isStatic,
          computed,
        };
        if (decorators) member.decorators = decorators;
        body.push(member);
      }
    }

    this.consume(TokenType.Punctuator, '}');
    return { type: NodeType.ClassBody, body };
  }

  // ── Control Flow ──────────────────────────────────────────────────────────

  private parseIfStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'if');
    this.consume(TokenType.Punctuator, '(');
    const test = this.parseExpression();
    this.consume(TokenType.Punctuator, ')');

    const consequent = this.parseStatement();
    let alternate = null;
    if (this.match(TokenType.Keyword, 'else')) {
      this.advance();
      alternate = this.parseStatement();
    }

    return { type: NodeType.IfStatement, test, consequent, alternate };
  }

  private parseForStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'for');

    // for await (... of ...)
    const isAwait = !!this.eat(TokenType.Keyword, 'await');

    this.consume(TokenType.Punctuator, '(');

    // Determine: for, for...in, for...of
    let init: ASTNode | null = null;
    if (this.match(TokenType.Keyword, 'const') || this.match(TokenType.Keyword, 'let') || this.match(TokenType.Keyword, 'var')) {
      const kind = this.advance().value;
      let id: ASTNode;
      if (this.match(TokenType.Punctuator, '{')) {
        id = this.parseObjectPattern();
      } else if (this.match(TokenType.Punctuator, '[')) {
        id = this.parseArrayPattern();
      } else {
        id = { type: NodeType.Identifier, name: this.advance().value };
      }
      this.skipTypeAnnotation();

      // for (const x of ...)
      if (this.match(TokenType.Keyword, 'of')) {
        this.advance();
        const right = this.parseAssignmentExpression();
        this.consume(TokenType.Punctuator, ')');
        const body = this.parseStatement();
        return {
          type: NodeType.ForOfStatement,
          left: { type: NodeType.VariableDeclaration, kind, declarations: [{ type: NodeType.VariableDeclarator, id, init: null }] },
          right,
          body,
          await: isAwait,
        };
      }
      // for (const x in ...)
      if (this.match(TokenType.Keyword, 'in')) {
        this.advance();
        const right = this.parseAssignmentExpression();
        this.consume(TokenType.Punctuator, ')');
        const body = this.parseStatement();
        return {
          type: NodeType.ForInStatement,
          left: { type: NodeType.VariableDeclaration, kind, declarations: [{ type: NodeType.VariableDeclarator, id, init: null }] },
          right,
          body,
        };
      }

      // Standard for
      let initVal: ASTNode | null = null;
      if (this.eat(TokenType.Punctuator, '=')) {
        initVal = this.parseAssignmentExpression();
      }
      init = { type: NodeType.VariableDeclaration, kind, declarations: [{ type: NodeType.VariableDeclarator, id, init: initVal }] };
    } else if (!this.match(TokenType.Punctuator, ';')) {
      init = this.parseExpression();
      // for (x of ...)
      if (this.match(TokenType.Keyword, 'of')) {
        this.advance();
        const right = this.parseAssignmentExpression();
        this.consume(TokenType.Punctuator, ')');
        const body = this.parseStatement();
        return { type: NodeType.ForOfStatement, left: init, right, body, await: isAwait };
      }
      // for (x in ...)
      if (this.match(TokenType.Keyword, 'in')) {
        this.advance();
        const right = this.parseAssignmentExpression();
        this.consume(TokenType.Punctuator, ')');
        const body = this.parseStatement();
        return { type: NodeType.ForInStatement, left: init, right, body };
      }
    }

    this.consume(TokenType.Punctuator, ';');
    let test: ASTNode | null = null;
    if (!this.match(TokenType.Punctuator, ';')) {
      test = this.parseExpression();
    }
    this.consume(TokenType.Punctuator, ';');
    let update: ASTNode | null = null;
    if (!this.match(TokenType.Punctuator, ')')) {
      update = this.parseExpression();
    }
    this.consume(TokenType.Punctuator, ')');
    const body = this.parseStatement();
    return { type: NodeType.ForStatement, init, test, update, body };
  }

  private parseWhileStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'while');
    this.consume(TokenType.Punctuator, '(');
    const test = this.parseExpression();
    this.consume(TokenType.Punctuator, ')');
    const body = this.parseStatement();
    return { type: NodeType.WhileStatement, test, body };
  }

  private parseDoWhileStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'do');
    const body = this.parseStatement();
    this.consume(TokenType.Keyword, 'while');
    this.consume(TokenType.Punctuator, '(');
    const test = this.parseExpression();
    this.consume(TokenType.Punctuator, ')');
    this.eat(TokenType.Punctuator, ';');
    return { type: NodeType.DoWhileStatement, test, body };
  }

  private parseSwitchStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'switch');
    this.consume(TokenType.Punctuator, '(');
    const discriminant = this.parseExpression();
    this.consume(TokenType.Punctuator, ')');
    this.consume(TokenType.Punctuator, '{');
    const cases: ASTNode[] = [];
    while (!this.match(TokenType.Punctuator, '}') && !this.match(TokenType.EOF)) {
      let test: ASTNode | null = null;
      if (this.match(TokenType.Keyword, 'case')) {
        this.advance();
        test = this.parseExpression();
        this.consume(TokenType.Punctuator, ':');
      } else if (this.match(TokenType.Keyword, 'default')) {
        this.advance();
        this.consume(TokenType.Punctuator, ':');
      }
      const consequent: ASTNode[] = [];
      while (
        !this.match(TokenType.Keyword, 'case') &&
        !this.match(TokenType.Keyword, 'default') &&
        !this.match(TokenType.Punctuator, '}') &&
        !this.match(TokenType.EOF)
      ) {
        consequent.push(this.parseStatement());
      }
      cases.push({ type: NodeType.SwitchCase, test, consequent });
    }
    this.consume(TokenType.Punctuator, '}');
    return { type: NodeType.SwitchStatement, discriminant, cases };
  }

  private parseTryStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'try');
    const block = this.parseBlockStatement();
    let handler: ASTNode | null = null;
    let finalizer: ASTNode | null = null;

    if (this.match(TokenType.Keyword, 'catch')) {
      this.advance();
      let param: ASTNode | null = null;
      if (this.eat(TokenType.Punctuator, '(')) {
        param = { type: NodeType.Identifier, name: this.advance().value };
        this.skipTypeAnnotation();
        this.consume(TokenType.Punctuator, ')');
      }
      const body = this.parseBlockStatement();
      handler = { type: NodeType.CatchClause, param, body };
    }

    if (this.match(TokenType.Keyword, 'finally')) {
      this.advance();
      finalizer = this.parseBlockStatement();
    }

    return { type: NodeType.TryStatement, block, handler, finalizer };
  }

  private parseThrowStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'throw');
    const argument = this.parseExpression();
    this.eat(TokenType.Punctuator, ';');
    return { type: NodeType.ThrowStatement, argument };
  }

  private parseReturnStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'return');
    let argument: ASTNode | null = null;
    if (this.peek().value !== ';' && this.peek().value !== '}' && this.peek().type !== TokenType.EOF) {
      if (this.peek().value === '{') {
        argument = this.parseObjectExpression();
      } else {
        argument = this.parseAssignmentExpression();
      }
    }
    this.eat(TokenType.Punctuator, ';');
    return { type: NodeType.ReturnStatement, argument };
  }

  private parseBreakStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'break');
    let label: ASTNode | null = null;
    if (this.match(TokenType.Identifier) && this.peek().line === this.tokens[this.current - 1]?.line) {
      label = { type: NodeType.Identifier, name: this.advance().value };
    }
    this.eat(TokenType.Punctuator, ';');
    return { type: NodeType.BreakStatement, label };
  }

  private parseContinueStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'continue');
    let label: ASTNode | null = null;
    if (this.match(TokenType.Identifier) && this.peek().line === this.tokens[this.current - 1]?.line) {
      label = { type: NodeType.Identifier, name: this.advance().value };
    }
    this.eat(TokenType.Punctuator, ';');
    return { type: NodeType.ContinueStatement, label };
  }

  private parseBlockStatement(): ASTNode {
    this.consume(TokenType.Punctuator, '{');
    const body: ASTNode[] = [];
    while (this.peek().value !== '}' && this.peek().type !== TokenType.EOF) {
      if (this.peek().value === ';') { this.advance(); continue; }
      body.push(this.parseStatement());
    }
    this.consume(TokenType.Punctuator, '}');
    return { type: NodeType.BlockStatement, body };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Expressions
  // ═══════════════════════════════════════════════════════════════════════════

  private parseExpressionStatement(): ASTNode {
    const expr = this.parseExpression();
    this.eat(TokenType.Punctuator, ';');
    return { type: NodeType.ExpressionStatement, expression: expr };
  }

  private parseExpression(): ASTNode {
    const expr = this.parseAssignmentExpression();
    // Sequence expression: expr, expr, expr
    if (this.match(TokenType.Punctuator, ',')) {
      const expressions: ASTNode[] = [expr];
      while (this.eat(TokenType.Punctuator, ',')) {
        expressions.push(this.parseAssignmentExpression());
      }
      return { type: NodeType.SequenceExpression, expressions };
    }
    return expr;
  }

  private parseAssignmentExpression(): ASTNode {
    const left = this.parseConditionalExpression();

    const assignOps = ['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=', '||=', '??='];
    if (assignOps.includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseAssignmentExpression();
      return { type: NodeType.AssignmentExpression, operator: op, left, right };
    }

    return left;
  }

  private parseConditionalExpression(): ASTNode {
    let expr = this.parseNullishCoalescing();

    if (this.eat(TokenType.Punctuator, '?')) {
      const consequent = this.parseAssignmentExpression();
      this.consume(TokenType.Punctuator, ':');
      const alternate = this.parseAssignmentExpression();
      return { type: NodeType.ConditionalExpression, test: expr, consequent, alternate };
    }

    return expr;
  }

  private parseNullishCoalescing(): ASTNode {
    let left = this.parseLogicalOr();

    while (this.match(TokenType.Punctuator, '??')) {
      const op = this.advance().value;
      const right = this.parseLogicalOr();
      left = { type: NodeType.LogicalExpression, operator: op, left, right };
    }

    return left;
  }

  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();

    while (this.match(TokenType.Punctuator, '||')) {
      const op = this.advance().value;
      const right = this.parseLogicalAnd();
      left = { type: NodeType.LogicalExpression, operator: op, left, right };
    }

    return left;
  }

  private parseLogicalAnd(): ASTNode {
    let left = this.parseBitwiseOr();

    while (this.match(TokenType.Punctuator, '&&')) {
      const op = this.advance().value;
      const right = this.parseBitwiseOr();
      left = { type: NodeType.LogicalExpression, operator: op, left, right };
    }

    return left;
  }

  private parseBitwiseOr(): ASTNode {
    let left = this.parseBitwiseXor();
    while (this.match(TokenType.Punctuator, '|') && !this.match(TokenType.Punctuator, '||')) {
      this.advance();
      const right = this.parseBitwiseXor();
      left = { type: NodeType.BinaryExpression, operator: '|', left, right };
    }
    return left;
  }

  private parseBitwiseXor(): ASTNode {
    let left = this.parseBitwiseAnd();
    while (this.match(TokenType.Punctuator, '^')) {
      this.advance();
      const right = this.parseBitwiseAnd();
      left = { type: NodeType.BinaryExpression, operator: '^', left, right };
    }
    return left;
  }

  private parseBitwiseAnd(): ASTNode {
    let left = this.parseEquality();
    while (this.match(TokenType.Punctuator, '&') && !this.match(TokenType.Punctuator, '&&')) {
      this.advance();
      const right = this.parseEquality();
      left = { type: NodeType.BinaryExpression, operator: '&', left, right };
    }
    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseRelational();

    while (
      this.match(TokenType.Punctuator, '===') ||
      this.match(TokenType.Punctuator, '!==') ||
      this.match(TokenType.Punctuator, '==') ||
      this.match(TokenType.Punctuator, '!=')
    ) {
      const op = this.advance().value;
      const right = this.parseRelational();
      left = { type: NodeType.BinaryExpression, operator: op, left, right };
    }

    return left;
  }

  private parseRelational(): ASTNode {
    let left = this.parseShift();

    while (
      this.match(TokenType.Punctuator, '<') ||
      this.match(TokenType.Punctuator, '>') ||
      this.match(TokenType.Punctuator, '<=') ||
      this.match(TokenType.Punctuator, '>=') ||
      this.match(TokenType.Keyword, 'instanceof') ||
      this.match(TokenType.Keyword, 'in')
    ) {
      const op = this.advance().value;
      const right = this.parseShift();
      left = { type: NodeType.BinaryExpression, operator: op, left, right };
    }

    return left;
  }

  private parseShift(): ASTNode {
    let left = this.parseAdditive();

    while (
      this.match(TokenType.Punctuator, '<<') ||
      this.match(TokenType.Punctuator, '>>') ||
      this.match(TokenType.Punctuator, '>>>')
    ) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = { type: NodeType.BinaryExpression, operator: op, left, right };
    }

    return left;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.match(TokenType.Punctuator, '+') || this.match(TokenType.Punctuator, '-')) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { type: NodeType.BinaryExpression, operator: op, left, right };
    }

    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseExponential();

    while (
      this.match(TokenType.Punctuator, '*') ||
      this.match(TokenType.Punctuator, '/') ||
      this.match(TokenType.Punctuator, '%')
    ) {
      const op = this.advance().value;
      const right = this.parseExponential();
      left = { type: NodeType.BinaryExpression, operator: op, left, right };
    }

    return left;
  }

  private parseExponential(): ASTNode {
    const left = this.parseUnary();

    if (this.match(TokenType.Punctuator, '**')) {
      const op = this.advance().value;
      const right = this.parseExponential(); // right-associative
      return { type: NodeType.BinaryExpression, operator: op, left, right };
    }

    return left;
  }

  private parseUnary(): ASTNode {
    const token = this.peek();

    // Prefix unary operators
    if (
      token.value === '!' || token.value === '~' ||
      token.value === '+' || token.value === '-'
    ) {
      if (token.type === TokenType.Punctuator) {
        const op = this.advance().value;
        const argument = this.parseUnary();
        return { type: NodeType.UnaryExpression, operator: op, prefix: true, argument };
      }
    }

    if (token.type === TokenType.Keyword) {
      if (token.value === 'typeof' || token.value === 'void' || token.value === 'delete') {
        const op = this.advance().value;
        const argument = this.parseUnary();
        return { type: NodeType.UnaryExpression, operator: op, prefix: true, argument };
      }
      if (token.value === 'await') {
        this.advance();
        const argument = this.parseUnary();
        return { type: NodeType.AwaitExpression, argument };
      }
      if (token.value === 'yield') {
        this.advance();
        const delegate = !!this.eat(TokenType.Punctuator, '*');
        let argument: ASTNode | null = null;
        if (!this.match(TokenType.Punctuator, ';') && !this.match(TokenType.Punctuator, ')') && !this.match(TokenType.Punctuator, '}')) {
          argument = this.parseAssignmentExpression();
        }
        return { type: NodeType.YieldExpression, delegate, argument };
      }
    }

    // Prefix ++ / --
    if (token.value === '++' || token.value === '--') {
      const op = this.advance().value;
      const argument = this.parseUnary();
      return { type: NodeType.UpdateExpression, operator: op, prefix: true, argument };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): ASTNode {
    let expr = this.parseCallMemberChain();

    // Postfix ++ / --
    if (this.match(TokenType.Punctuator, '++') || this.match(TokenType.Punctuator, '--')) {
      const op = this.advance().value;
      return { type: NodeType.UpdateExpression, operator: op, prefix: false, argument: expr };
    }

    // TS non-null assertion: expr! (skip)
    if (this.match(TokenType.Punctuator, '!')) {
      const next = this.peek2();
      if (next && next.value !== '=' && next.value !== '==') {
        // Could be non-null assertion — but we can't disambiguate fully without types.
        // Leave it for now (don't consume)
      }
    }

    // TS `as` cast: expr as Type or `satisfies` (skip the type)
    if (this.match(TokenType.Keyword, 'as') || this.match(TokenType.Identifier, 'as') || this.match(TokenType.Identifier, 'satisfies')) {
      this.advance(); // 'as' / 'satisfies'
      // Skip the type (could be complex)
      this.skipTypeExpression();
    }

    return expr;
  }

  private parseCallMemberChain(): ASTNode {
    let node = this.parsePrimary();

    while (true) {
      // Member access: .prop
      if (this.match(TokenType.Punctuator, '.')) {
        this.advance();
        if (this.match(TokenType.PrivateIdentifier)) {
          const prop = this.advance();
          node = { type: NodeType.MemberExpression, object: node, property: { type: NodeType.PrivateIdentifier, name: prop.value }, computed: false };
        } else {
          const prop = this.advance();
          node = { type: NodeType.MemberExpression, object: node, property: { type: NodeType.Identifier, name: prop.value }, computed: false };
        }
        continue;
      }

      // Optional chaining: ?.
      if (this.match(TokenType.Punctuator, '?.')) {
        this.advance();
        if (this.match(TokenType.Punctuator, '(')) {
          // Optional call: a?.(args)
          this.advance();
          const args = this.parseArguments();
          this.consume(TokenType.Punctuator, ')');
          node = { type: NodeType.OptionalCallExpression, callee: node, arguments: args, optional: true };
        } else if (this.match(TokenType.Punctuator, '[')) {
          // Optional computed: a?.[key]
          this.advance();
          const prop = this.parseExpression();
          this.consume(TokenType.Punctuator, ']');
          node = { type: NodeType.OptionalMemberExpression, object: node, property: prop, computed: true, optional: true };
        } else {
          // Optional property: a?.b
          const prop = this.advance();
          node = { type: NodeType.OptionalMemberExpression, object: node, property: { type: NodeType.Identifier, name: prop.value }, computed: false, optional: true };
        }
        continue;
      }

      // Computed access: [expr]
      if (this.match(TokenType.Punctuator, '[')) {
        this.advance();
        const prop = this.parseExpression();
        this.consume(TokenType.Punctuator, ']');
        node = { type: NodeType.MemberExpression, object: node, property: prop, computed: true };
        continue;
      }

      // Call: (args)
      if (this.match(TokenType.Punctuator, '(')) {
        this.advance();
        const args = this.parseArguments();
        this.consume(TokenType.Punctuator, ')');
        node = { type: NodeType.CallExpression, callee: node, arguments: args };
        continue;
      }

      // Tagged template: foo`...`
      if (this.match(TokenType.TemplateHead) || this.match(TokenType.TemplateNoSub)) {
        const quasi = this.parseTemplateLiteral();
        node = { type: NodeType.TaggedTemplateExpression, tag: node, quasi };
        continue;
      }

      break;
    }

    return node;
  }

  private parseArguments(): ASTNode[] {
    const args: ASTNode[] = [];
    while (!this.match(TokenType.Punctuator, ')') && !this.match(TokenType.EOF)) {
      if (this.match(TokenType.Punctuator, '...')) {
        this.advance();
        args.push({ type: NodeType.SpreadElement, argument: this.parseAssignmentExpression() });
      } else {
        args.push(this.parseAssignmentExpression());
      }
      this.eat(TokenType.Punctuator, ',');
    }
    return args;
  }

  // ── Primary Expressions ──────────────────────────────────────────────────

  private parsePrimary(): ASTNode {
    const token = this.peek();

    // String literal
    if (token.type === TokenType.StringLiteral) {
      const raw = this.advance();
      return { type: NodeType.Literal, value: raw.value.replace(/['"`]/g, ''), raw: raw.value };
    }

    // Numeric literal
    if (token.type === TokenType.NumericLiteral) {
      const raw = this.advance();
      return { type: NodeType.Literal, value: Number(raw.value.replace(/_/g, '')), raw: raw.value };
    }

    // Regex literal
    if (token.type === TokenType.RegExpLiteral) {
      const raw = this.advance();
      return { type: NodeType.Literal, value: raw.value, raw: raw.value, regex: true };
    }

    // Template literal
    if (token.type === TokenType.TemplateHead || token.type === TokenType.TemplateNoSub) {
      return this.parseTemplateLiteral();
    }

    // Private identifier
    if (token.type === TokenType.PrivateIdentifier) {
      const raw = this.advance();
      return { type: NodeType.PrivateIdentifier, name: raw.value };
    }

    // JSX
    if (token.type === TokenType.JSXTagOpen) {
      return this.parseJSXElement();
    }

    // Keywords that are expression-like
    if (token.type === TokenType.Keyword) {
      switch (token.value) {
        case 'true': this.advance(); return { type: NodeType.Literal, value: true, raw: 'true' };
        case 'false': this.advance(); return { type: NodeType.Literal, value: false, raw: 'false' };
        case 'null': this.advance(); return { type: NodeType.Literal, value: null, raw: 'null' };
        case 'undefined': this.advance(); return { type: NodeType.Identifier, name: 'undefined' };
        case 'this': this.advance(); return { type: NodeType.Identifier, name: 'this' };
        case 'super': this.advance(); return { type: NodeType.Identifier, name: 'super' };
        case 'new': return this.parseNewExpression();
        case 'function': return this.parseFunctionExpression(false);
        case 'async': {
          // async function expression or async arrow
          const next = this.peek2();
          if (next && next.value === 'function') {
            this.advance(); // consume 'async'
            return this.parseFunctionExpression(true);
          }
          // async arrow: async (args) => ... or async ident => ...
          if (next && (next.value === '(' || next.type === TokenType.Identifier)) {
            return this.parseAsyncArrow();
          }
          break;
        }
        case 'class': return this.parseClassExpression();
        case 'import': {
          // Dynamic import: import(...)
          this.advance();
          if (this.match(TokenType.Punctuator, '(')) {
            this.advance();
            const arg = this.parseAssignmentExpression();
            let attrs: ASTNode | null = null;
            if (this.eat(TokenType.Punctuator, ',')) {
              attrs = this.parseAssignmentExpression();
            }
            this.consume(TokenType.Punctuator, ')');
            return { type: NodeType.ImportExpression, source: arg, attributes: attrs };
          }
          // import.meta
          if (this.eat(TokenType.Punctuator, '.')) {
            const prop = this.advance();
            return { type: NodeType.MemberExpression, object: { type: NodeType.Identifier, name: 'import' }, property: { type: NodeType.Identifier, name: prop.value }, computed: false };
          }
          return { type: NodeType.Identifier, name: 'import' };
        }
      }
    }

    // Identifier — with arrow-function detection
    if (token.type === TokenType.Identifier) {
      const id = this.advance();

      // Arrow: ident => expr
      if (this.match(TokenType.Punctuator, '=>')) {
        this.advance(); // =>
        return this.parseArrowBody([{ type: NodeType.Identifier, name: id.value }], false);
      }

      return { type: NodeType.Identifier, name: id.value };
    }

    // Parenthesized expression or arrow function
    if (token.value === '(') {
      return this.parseParenOrArrow();
    }

    // Array expression
    if (token.value === '[') {
      return this.parseArrayExpression();
    }

    // Object expression
    if (token.value === '{') {
      return this.parseObjectExpression();
    }

    // Spread / Rest
    if (token.value === '...') {
      this.advance();
      return { type: NodeType.SpreadElement, argument: this.parseAssignmentExpression() };
    }

    // Fallback: consume as identifier
    return { type: NodeType.Identifier, name: this.advance().value };
  }

  // ── Arrow Functions ──────────────────────────────────────────────────────

  private parseParenOrArrow(): ASTNode {
    // Look ahead to determine if this is an arrow function or grouping expression.
    const saved = this.current;
    try {
      this.advance(); // (
      // Empty parens => arrow
      if (this.match(TokenType.Punctuator, ')')) {
        this.advance(); // )
        if (this.match(TokenType.Punctuator, '=>')) {
          this.advance(); // =>
          return this.parseArrowBody([], false);
        }
        // () without => is unusual — return undefined-like
        return { type: NodeType.Identifier, name: 'undefined' };
      }

      // Try to parse as arrow params
      const params: ASTNode[] = [];
      let isArrow = true;

      while (!this.match(TokenType.Punctuator, ')') && !this.match(TokenType.EOF)) {
        if (this.match(TokenType.Punctuator, '...')) {
          // Rest param
          this.advance();
          const arg = this.advance();
          this.skipTypeAnnotation();
          params.push({ type: NodeType.RestElement, argument: { type: NodeType.Identifier, name: arg.value } });
          this.eat(TokenType.Punctuator, ',');
          continue;
        }
        if (this.match(TokenType.Punctuator, '{')) {
          const pattern = this.parseObjectPattern();
          this.skipTypeAnnotation();
          if (this.eat(TokenType.Punctuator, '=')) {
            const def = this.parseAssignmentExpression();
            params.push({ type: NodeType.AssignmentPattern, left: pattern, right: def });
          } else {
            params.push(pattern);
          }
          this.eat(TokenType.Punctuator, ',');
          continue;
        }
        if (this.match(TokenType.Punctuator, '[')) {
          const pattern = this.parseArrayPattern();
          this.skipTypeAnnotation();
          if (this.eat(TokenType.Punctuator, '=')) {
            const def = this.parseAssignmentExpression();
            params.push({ type: NodeType.AssignmentPattern, left: pattern, right: def });
          } else {
            params.push(pattern);
          }
          this.eat(TokenType.Punctuator, ',');
          continue;
        }

        // Simple identifier param
        const param = this.advance();
        this.eat(TokenType.Punctuator, '?'); // optional
        this.skipTypeAnnotation();

        let paramNode: ASTNode = { type: NodeType.Identifier, name: param.value };
        if (this.eat(TokenType.Punctuator, '=')) {
          const def = this.parseAssignmentExpression();
          paramNode = { type: NodeType.AssignmentPattern, left: paramNode, right: def };
        }
        params.push(paramNode);
        this.eat(TokenType.Punctuator, ',');
      }

      if (!this.match(TokenType.Punctuator, ')')) {
        isArrow = false;
      } else {
        this.advance(); // )
        this.skipTypeAnnotation(); // return type
        if (!this.match(TokenType.Punctuator, '=>')) {
          isArrow = false;
        }
      }

      if (isArrow) {
        this.advance(); // =>
        return this.parseArrowBody(params, false);
      }
    } catch {
      // Not an arrow — fall through to paren expression
    }

    // Restore and parse as parenthesized expression
    this.current = saved;
    this.advance(); // (
    const expr = this.parseExpression();
    this.consume(TokenType.Punctuator, ')');
    return expr;
  }

  private parseAsyncArrow(): ASTNode {
    this.advance(); // consume 'async'

    if (this.match(TokenType.Punctuator, '(')) {
      const result = this.parseParenOrArrow();
      if (result.type === NodeType.ArrowFunctionExpression) {
        result.async = true;
      }
      return result;
    }

    // async ident => ...
    const id = this.advance();
    this.consume(TokenType.Punctuator, '=>');
    return this.parseArrowBody([{ type: NodeType.Identifier, name: id.value }], true);
  }

  private parseArrowBody(params: ASTNode[], isAsync: boolean): ASTNode {
    let body: ASTNode;
    let expression = false;
    if (this.match(TokenType.Punctuator, '{')) {
      body = this.parseBlockStatement();
    } else {
      body = this.parseAssignmentExpression();
      expression = true;
    }
    return {
      type: NodeType.ArrowFunctionExpression,
      params,
      body,
      async: isAsync,
      expression,
    };
  }

  // ── New Expression ──────────────────────────────────────────────────────

  private parseNewExpression(): ASTNode {
    this.consume(TokenType.Keyword, 'new');

    // new.target
    if (this.eat(TokenType.Punctuator, '.')) {
      const prop = this.advance();
      return { type: NodeType.MemberExpression, object: { type: NodeType.Identifier, name: 'new' }, property: { type: NodeType.Identifier, name: prop.value }, computed: false };
    }

    let callee = this.parsePrimary();

    // new Foo.Bar
    while (this.match(TokenType.Punctuator, '.')) {
      this.advance();
      const prop = this.advance();
      callee = { type: NodeType.MemberExpression, object: callee, property: { type: NodeType.Identifier, name: prop.value }, computed: false };
    }

    let args: ASTNode[] = [];
    if (this.eat(TokenType.Punctuator, '(')) {
      args = this.parseArguments();
      this.consume(TokenType.Punctuator, ')');
    }

    return { type: NodeType.NewExpression, callee, arguments: args };
  }

  // ── Function Expression ──────────────────────────────────────────────────

  private parseFunctionExpression(isAsync: boolean): ASTNode {
    this.consume(TokenType.Keyword, 'function');
    const isGenerator = !!this.eat(TokenType.Punctuator, '*');

    let id: ASTNode | null = null;
    if (this.match(TokenType.Identifier)) {
      id = { type: NodeType.Identifier, name: this.advance().value };
    }

    this.skipTypeParameters();
    this.consume(TokenType.Punctuator, '(');
    const params = this.parseFunctionParams();
    this.consume(TokenType.Punctuator, ')');
    this.skipTypeAnnotation();
    const body = this.parseBlockStatement();

    return {
      type: NodeType.FunctionDeclaration,
      async: isAsync,
      generator: isGenerator,
      id: id || { type: NodeType.Identifier, name: '' },
      params,
      body,
      _expression: true,
    };
  }

  // ── Class Expression ──────────────────────────────────────────────────────

  private parseClassExpression(): ASTNode {
    const cls = this.parseClassDeclaration();
    cls._expression = true;
    return cls;
  }

  // ── Array Expression ──────────────────────────────────────────────────────

  private parseArrayExpression(): ASTNode {
    this.consume(TokenType.Punctuator, '[');
    const elements: (ASTNode | null)[] = [];

    while (!this.match(TokenType.Punctuator, ']') && !this.match(TokenType.EOF)) {
      if (this.match(TokenType.Punctuator, ',')) {
        this.advance();
        elements.push(null); // elision
        continue;
      }
      if (this.match(TokenType.Punctuator, '...')) {
        this.advance();
        elements.push({ type: NodeType.SpreadElement, argument: this.parseAssignmentExpression() });
      } else {
        elements.push(this.parseAssignmentExpression());
      }
      this.eat(TokenType.Punctuator, ',');
    }

    this.consume(TokenType.Punctuator, ']');
    return { type: NodeType.ArrayExpression, elements };
  }

  // ── Object Expression ──────────────────────────────────────────────────────

  private parseObjectExpression(): ASTNode {
    this.consume(TokenType.Punctuator, '{');
    const properties: ASTNode[] = [];

    while (!this.match(TokenType.Punctuator, '}') && !this.match(TokenType.EOF)) {
      // Spread: { ...obj }
      if (this.match(TokenType.Punctuator, '...')) {
        this.advance();
        properties.push({ type: NodeType.SpreadElement, argument: this.parseAssignmentExpression() });
        this.eat(TokenType.Punctuator, ',');
        continue;
      }

      let computed = false;
      let key: ASTNode;
      let isMethod = false;
      let isAsync = false;
      let isGenerator = false;
      let kind: 'init' | 'get' | 'set' = 'init';

      // async method: { async foo() {} }
      if ((this.match(TokenType.Keyword, 'async') || this.match(TokenType.Identifier, 'async'))) {
        const next = this.peek2();
        if (next && next.value !== ',' && next.value !== '}' && next.value !== ':' && next.value !== '(') {
          this.advance();
          isAsync = true;
        }
      }

      // Generator method: { *foo() {} }
      if (this.eat(TokenType.Punctuator, '*')) {
        isGenerator = true;
      }

      // get/set
      if (this.match(TokenType.Keyword, 'get') || this.match(TokenType.Identifier, 'get')) {
        const next = this.peek2();
        if (next && next.value !== ',' && next.value !== '}' && next.value !== ':' && next.value !== '(') {
          this.advance();
          kind = 'get';
        }
      } else if (this.match(TokenType.Keyword, 'set') || this.match(TokenType.Identifier, 'set')) {
        const next = this.peek2();
        if (next && next.value !== ',' && next.value !== '}' && next.value !== ':' && next.value !== '(') {
          this.advance();
          kind = 'set';
        }
      }

      // Computed key: [expr]
      if (this.match(TokenType.Punctuator, '[')) {
        this.advance();
        key = this.parseAssignmentExpression();
        this.consume(TokenType.Punctuator, ']');
        computed = true;
      } else if (this.match(TokenType.StringLiteral)) {
        const tok = this.advance();
        key = { type: NodeType.Literal, value: tok.value.replace(/['"`]/g, ''), raw: tok.value };
      } else if (this.match(TokenType.NumericLiteral)) {
        const tok = this.advance();
        key = { type: NodeType.Literal, value: Number(tok.value), raw: tok.value };
      } else {
        const tok = this.advance();
        key = { type: NodeType.Identifier, name: tok.value };
      }

      // Method: { foo() {} }
      if (this.match(TokenType.Punctuator, '(')) {
        this.advance();
        const params = this.parseFunctionParams();
        this.consume(TokenType.Punctuator, ')');
        this.skipTypeAnnotation();
        const body = this.parseBlockStatement();
        properties.push({
          type: NodeType.Property,
          key,
          value: { type: NodeType.FunctionDeclaration, async: isAsync, generator: isGenerator, id: key, params, body },
          kind,
          computed,
          method: true,
          shorthand: false,
        });
        this.eat(TokenType.Punctuator, ',');
        continue;
      }

      // Property: { key: value }
      if (this.match(TokenType.Punctuator, ':')) {
        this.advance();
        const value = this.parseAssignmentExpression();
        properties.push({
          type: NodeType.Property,
          key,
          value,
          kind: 'init',
          computed,
          method: false,
          shorthand: false,
        });
        this.eat(TokenType.Punctuator, ',');
        continue;
      }

      // Shorthand: { x } or { x = defaultVal }
      let value: ASTNode = key;
      let shorthand = true;
      if (this.eat(TokenType.Punctuator, '=')) {
        const def = this.parseAssignmentExpression();
        value = { type: NodeType.AssignmentPattern, left: key, right: def };
      }
      properties.push({
        type: NodeType.Property,
        key,
        value,
        kind: 'init',
        computed: false,
        method: false,
        shorthand,
      });
      this.eat(TokenType.Punctuator, ',');
    }

    this.consume(TokenType.Punctuator, '}');
    return { type: NodeType.ObjectExpression, properties };
  }

  // ── Destructuring Patterns ────────────────────────────────────────────────

  private parseObjectPattern(): ASTNode {
    this.consume(TokenType.Punctuator, '{');
    const properties: ASTNode[] = [];

    while (!this.match(TokenType.Punctuator, '}') && !this.match(TokenType.EOF)) {
      // Rest: { ...rest }
      if (this.match(TokenType.Punctuator, '...')) {
        this.advance();
        const arg = this.advance();
        properties.push({ type: NodeType.RestElement, argument: { type: NodeType.Identifier, name: arg.value } });
        this.eat(TokenType.Punctuator, ',');
        continue;
      }

      const keyTok = this.advance();
      const key: ASTNode = { type: NodeType.Identifier, name: keyTok.value };
      let value: ASTNode = key;

      if (this.eat(TokenType.Punctuator, ':')) {
        // Renamed: { a: b } or nested: { a: { ... } }
        if (this.match(TokenType.Punctuator, '{')) {
          value = this.parseObjectPattern();
        } else if (this.match(TokenType.Punctuator, '[')) {
          value = this.parseArrayPattern();
        } else {
          value = { type: NodeType.Identifier, name: this.advance().value };
        }
      }

      // Default: { a = 1 }
      if (this.eat(TokenType.Punctuator, '=')) {
        const def = this.parseAssignmentExpression();
        value = { type: NodeType.AssignmentPattern, left: value, right: def };
      }

      properties.push({
        type: NodeType.Property,
        key,
        value,
        kind: 'init',
        computed: false,
        method: false,
        shorthand: key === value || (value.type === NodeType.AssignmentPattern && value.left === key),
      });
      this.eat(TokenType.Punctuator, ',');
    }

    this.consume(TokenType.Punctuator, '}');
    return { type: NodeType.ObjectPattern, properties };
  }

  private parseArrayPattern(): ASTNode {
    this.consume(TokenType.Punctuator, '[');
    const elements: (ASTNode | null)[] = [];

    while (!this.match(TokenType.Punctuator, ']') && !this.match(TokenType.EOF)) {
      if (this.match(TokenType.Punctuator, ',')) {
        this.advance();
        elements.push(null); // hole
        continue;
      }
      if (this.match(TokenType.Punctuator, '...')) {
        this.advance();
        const arg = this.advance();
        elements.push({ type: NodeType.RestElement, argument: { type: NodeType.Identifier, name: arg.value } });
        this.eat(TokenType.Punctuator, ',');
        continue;
      }

      let elem: ASTNode;
      if (this.match(TokenType.Punctuator, '{')) {
        elem = this.parseObjectPattern();
      } else if (this.match(TokenType.Punctuator, '[')) {
        elem = this.parseArrayPattern();
      } else {
        elem = { type: NodeType.Identifier, name: this.advance().value };
      }

      if (this.eat(TokenType.Punctuator, '=')) {
        const def = this.parseAssignmentExpression();
        elem = { type: NodeType.AssignmentPattern, left: elem, right: def };
      }

      elements.push(elem);
      this.eat(TokenType.Punctuator, ',');
    }

    this.consume(TokenType.Punctuator, ']');
    return { type: NodeType.ArrayPattern, elements };
  }

  // ── Template Literals ──────────────────────────────────────────────────────

  private parseTemplateLiteral(): ASTNode {
    const quasis: ASTNode[] = [];
    const expressions: ASTNode[] = [];

    if (this.match(TokenType.TemplateNoSub)) {
      const tok = this.advance();
      const raw = tok.value.slice(1, -1); // strip backticks
      quasis.push({ type: NodeType.TemplateElement, value: { raw, cooked: raw }, tail: true });
      return { type: NodeType.TemplateLiteral, quasis, expressions };
    }

    // TemplateHead: `...${ 
    const head = this.consume(TokenType.TemplateHead);
    const headRaw = head.value.slice(1, -2); // strip ` and ${
    quasis.push({ type: NodeType.TemplateElement, value: { raw: headRaw, cooked: headRaw }, tail: false });

    // Parse expression
    expressions.push(this.parseExpression());

    // Continue with TemplateMiddle or TemplateTail
    while (this.match(TokenType.TemplateMiddle)) {
      const mid = this.advance();
      const midRaw = mid.value.slice(1, -2); // strip } and ${
      quasis.push({ type: NodeType.TemplateElement, value: { raw: midRaw, cooked: midRaw }, tail: false });
      expressions.push(this.parseExpression());
    }

    // TemplateTail: }...`
    const tail = this.consume(TokenType.TemplateTail);
    const tailRaw = tail.value.slice(1, -1); // strip } and `
    quasis.push({ type: NodeType.TemplateElement, value: { raw: tailRaw, cooked: tailRaw }, tail: true });

    return { type: NodeType.TemplateLiteral, quasis, expressions };
  }

  // ── JSX ──────────────────────────────────────────────────────────────────

  private parseJSXElement(): ASTNode {
    const startTag = this.consume(TokenType.JSXTagOpen).value;
    const tagName = startTag.slice(1);
    const attributes: ASTNode[] = [];

    // Parse attributes
    while (
      this.peek().type !== TokenType.Punctuator ||
      (this.peek().value !== '/>' && this.peek().value !== '>')
    ) {
      if (this.peek().type === TokenType.EOF) break;

      // Spread attribute: {...expr}
      if (this.match(TokenType.Punctuator, '{')) {
        this.advance();
        if (this.match(TokenType.Punctuator, '...')) {
          this.advance();
          const expr = this.parseAssignmentExpression();
          this.consume(TokenType.Punctuator, '}');
          attributes.push({ type: NodeType.JSXSpreadAttribute, argument: expr });
          continue;
        }
        // This shouldn't happen in valid JSX attrs, but handle gracefully
        const expr = this.parseExpression();
        this.consume(TokenType.Punctuator, '}');
        attributes.push(expr);
        continue;
      }

      const name = this.advance().value;

      if (this.eat(TokenType.Punctuator, '=')) {
        let valNode: ASTNode;
        if (this.match(TokenType.StringLiteral)) {
          const rawVal = this.advance();
          valNode = { type: NodeType.Literal, value: rawVal.value.replace(/['"`]/g, ''), raw: rawVal.value };
        } else if (this.match(TokenType.Punctuator, '{')) {
          this.advance();
          valNode = this.parseExpression();
          this.consume(TokenType.Punctuator, '}');
        } else {
          valNode = this.parsePrimary();
        }
        attributes.push({
          type: NodeType.JSXAttribute,
          name: { type: NodeType.Identifier, name },
          value: valNode
        });
      } else {
        // Boolean attribute: <Component disabled />
        attributes.push({
          type: NodeType.JSXAttribute,
          name: { type: NodeType.Identifier, name },
          value: { type: NodeType.Literal, value: true, raw: 'true' }
        });
      }
    }

    let isSelfClosing = false;
    if (this.eat(TokenType.Punctuator, '/>')) {
      isSelfClosing = true;
    } else {
      this.consume(TokenType.Punctuator, '>');
    }

    const children: ASTNode[] = [];
    if (!isSelfClosing) {
      while (this.peek().type !== TokenType.JSXTagClose) {
        if (this.peek().type === TokenType.EOF) break;
        if (this.peek().type === TokenType.JSXTagOpen) {
          children.push(this.parseJSXElement());
        } else if (this.peek().value === '{') {
          this.advance();
          children.push({
            type: NodeType.JSXExpressionContainer,
            expression: this.parseExpression()
          });
          this.consume(TokenType.Punctuator, '}');
        } else {
          const textToken = this.advance();
          children.push({ type: NodeType.JSXText, value: textToken.value });
        }
      }
      this.consume(TokenType.JSXTagClose);
    }

    return {
      type: NodeType.JSXElement,
      openingElement: {
        type: NodeType.JSXOpeningElement,
        name: { type: NodeType.Identifier, name: tagName },
        attributes
      },
      children,
      closingElement: isSelfClosing ? null : {
        type: NodeType.JSXClosingElement,
        name: { type: NodeType.Identifier, name: tagName }
      }
    };
  }

  // ── Decorators ──────────────────────────────────────────────────────────

  private parseDecorators(): ASTNode[] {
    const decorators: ASTNode[] = [];
    while (this.match(TokenType.Punctuator, '@')) {
      this.advance(); // @
      let expr = this.parsePrimary();
      // @decorator.name or @decorator(args)
      while (this.match(TokenType.Punctuator, '.')) {
        this.advance();
        const prop = this.advance();
        expr = { type: NodeType.MemberExpression, object: expr, property: { type: NodeType.Identifier, name: prop.value }, computed: false };
      }
      if (this.match(TokenType.Punctuator, '(')) {
        this.advance();
        const args = this.parseArguments();
        this.consume(TokenType.Punctuator, ')');
        expr = { type: NodeType.CallExpression, callee: expr, arguments: args };
      }
      decorators.push({ type: NodeType.Decorator, expression: expr });
    }
    return decorators;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TypeScript Helpers (skip/strip TS syntax during parsing)
  // ═══════════════════════════════════════════════════════════════════════════

  private skipTypeAnnotation(): void {
    if (!this.match(TokenType.Punctuator, ':')) return;
    this.advance(); // :
    this.skipTypeExpression();
  }

  private skipTypeExpression(): void {
    let depth = 0;
    // Consume tokens until we hit a meaningful delimiter at depth 0
    while (this.peek().type !== TokenType.EOF) {
      const v = this.peek().value;
      if (v === '<') { depth++; this.advance(); continue; }
      if (v === '>' && depth > 0) { depth--; this.advance(); continue; }
      if (depth > 0) { this.advance(); continue; }
      // Stop at tokens that indicate end of type annotation
      if ((v === '=' || v === ',' || v === ')' || v === ';' || v === '{' || v === '}' || v === '=>' || v === '|' || v === '&') && depth === 0) {
        // Handle union / intersection types: keep consuming if | or &
        if (v === '|' || v === '&') {
          this.advance();
          continue;
        }
        break;
      }
      if (v === '[' && this.peekAt(1) === ']') {
        this.advance(); this.advance(); // []
        continue;
      }
      this.advance();
    }
  }

  private skipTypeParameters(): void {
    if (!this.match(TokenType.Punctuator, '<')) return;
    let depth = 1;
    this.advance(); // <
    while (depth > 0 && this.peek().type !== TokenType.EOF) {
      if (this.peek().value === '<') depth++;
      if (this.peek().value === '>') depth--;
      this.advance();
    }
  }

  // Helper to peek at source char (for the lexer reference, not used in parser)
  private peekAt(offset: number): string {
    const tok = this.tokens[this.current + offset];
    return tok ? tok.value : '';
  }
}
