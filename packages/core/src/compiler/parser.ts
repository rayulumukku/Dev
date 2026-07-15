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
    return {
      type: NodeType.Program,
      body
    };
  }

  private parseStatement(): ASTNode {
    const token = this.peek();

    if (token.value === '{') {
      return this.parseBlockStatement();
    }

    if (token.type === TokenType.Keyword) {
      if (token.value === 'import') {
        return this.parseImportDeclaration();
      }
      if (token.value === 'export') {
        return this.parseExportDeclaration();
      }
      if (token.value === 'const' || token.value === 'let' || token.value === 'var') {
        return this.parseVariableDeclaration();
      }
      if (token.value === 'function') {
        return this.parseFunctionDeclaration();
      }
      if (token.value === 'if') {
        return this.parseIfStatement();
      }
      if (token.value === 'return') {
        return this.parseReturnStatement();
      }
    }

    // JSX block detection
    if (token.type === TokenType.JSXTagOpen) {
      return this.parseJSXElement();
    }

    return this.parseExpressionStatement();
  }

  private parseImportDeclaration(): ASTNode {
    const start = this.consume(TokenType.Keyword, 'import');
    const specifiers: ASTNode[] = [];

    // Parse import specs
    const next = this.peek();
    if (next.type === TokenType.StringLiteral) {
      // Side effect import: import "module";
      const sourceVal = this.advance();
      return {
        type: NodeType.ImportDeclaration,
        specifiers: [],
        source: { type: NodeType.Literal, value: sourceVal.value.replace(/['"`]/g, ''), raw: sourceVal.value }
      };
    }

    if (next.type === TokenType.Identifier) {
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
      this.consume(TokenType.Identifier, 'as');
      const local = this.consume(TokenType.Identifier);
      specifiers.push({
        type: NodeType.ImportNamespaceSpecifier,
        local: { type: NodeType.Identifier, name: local.value }
      });
    } else if (this.peek().value === '{') {
      // Named import: import { a, b as c } from "y";
      this.advance(); // {
      while (this.peek().value !== '}') {
        const imported = this.consume(TokenType.Identifier);
        let local = imported;
        if (this.peek().value === 'as') {
          this.advance(); // as
          local = this.consume(TokenType.Identifier);
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

    return {
      type: NodeType.ImportDeclaration,
      specifiers,
      source: { type: NodeType.Literal, value: source.value.replace(/['"`]/g, ''), raw: source.value }
    };
  }

  private parseExportDeclaration(): ASTNode {
    this.consume(TokenType.Keyword, 'export');
    const next = this.peek();
    
    let isDefault = false;
    if (next.value === 'default') {
      this.advance();
      isDefault = true;
    }

    const decl = this.parseStatement();
    return {
      type: NodeType.ExportNamedDeclaration,
      declaration: decl,
      isDefault
    };
  }

  private parseVariableDeclaration(): ASTNode {
    const kind = this.advance().value; // const/let/var
    const declarations: ASTNode[] = [];

    while (true) {
      const id = this.consume(TokenType.Identifier);
      
      // TS type strip support
      if (this.peek().value === ':') {
        this.advance(); // :
        this.advance(); // Type name
      }

      let init = null;
      if (this.peek().value === '=') {
        this.advance(); // =
        init = this.parseExpression();
      }

      declarations.push({
        type: NodeType.VariableDeclarator,
        id: { type: NodeType.Identifier, name: id.value },
        init
      });

      if (this.peek().value === ',') {
        this.advance();
      } else {
        break;
      }
    }

    if (this.peek().value === ';') {
      this.advance();
    }

    return {
      type: NodeType.VariableDeclaration,
      kind,
      declarations
    };
  }

  private parseFunctionDeclaration(): ASTNode {
    this.consume(TokenType.Keyword, 'function');
    const id = this.consume(TokenType.Identifier);
    
    this.consume(TokenType.Punctuator, '(');
    const params: ASTNode[] = [];
    while (this.peek().value !== ')') {
      const paramName = this.consume(TokenType.Identifier).value;
      
      // TS Param annotations stripping
      if (this.peek().value === ':') {
        this.advance(); // :
        this.advance(); // Type
      }

      params.push({ type: NodeType.Identifier, name: paramName });
      if (this.peek().value === ',') {
        this.advance();
      }
    }
    this.consume(TokenType.Punctuator, ')');

    const body = this.parseBlockStatement();

    return {
      type: NodeType.FunctionDeclaration,
      id: { type: NodeType.Identifier, name: id.value },
      params,
      body
    };
  }

  private parseIfStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'if');
    this.consume(TokenType.Punctuator, '(');
    const test = this.parseExpression();
    this.consume(TokenType.Punctuator, ')');

    const consequent = this.parseStatement();
    let alternate = null;
    if (this.peek().value === 'else') {
      this.advance();
      alternate = this.parseStatement();
    }

    return {
      type: NodeType.IfStatement,
      test,
      consequent,
      alternate
    };
  }

  private parseReturnStatement(): ASTNode {
    this.consume(TokenType.Keyword, 'return');
    const argument = this.peek().value !== ';' ? this.parseExpression() : null;
    if (this.peek().value === ';') {
      this.advance();
    }
    return {
      type: NodeType.ReturnStatement,
      argument
    };
  }

  private parseBlockStatement(): ASTNode {
    this.consume(TokenType.Punctuator, '{');
    const body: ASTNode[] = [];
    while (this.peek().value !== '}') {
      body.push(this.parseStatement());
    }
    this.consume(TokenType.Punctuator, '}');
    return {
      type: NodeType.BlockStatement,
      body
    };
  }

  private parseJSXElement(): ASTNode {
    const startTag = this.consume(TokenType.JSXTagOpen).value;
    const tagName = startTag.slice(1);
    const attributes: ASTNode[] = [];

    // Parse attributes
    while (this.peek().type !== TokenType.Punctuator && this.peek().value !== '/>' && this.peek().value !== '>') {
      const name = this.consume(TokenType.Identifier).value;
      this.consume(TokenType.Punctuator, '=');
      
      let valNode: ASTNode;
      if (this.peek().type === TokenType.StringLiteral) {
        const rawVal = this.advance();
        valNode = { type: NodeType.Literal, value: rawVal.value.replace(/['"`]/g, ''), raw: rawVal.value };
      } else {
        // expression attribute e.g. onClick={clickFunc}
        this.consume(TokenType.Punctuator, '{');
        valNode = this.parseExpression();
        this.consume(TokenType.Punctuator, '}');
      }

      attributes.push({
        type: NodeType.JSXAttribute,
        name: { type: NodeType.Identifier, name },
        value: valNode
      });
    }

    let isSelfClosing = false;
    if (this.peek().value === '/>') {
      this.consume(TokenType.Punctuator, '/>');
      isSelfClosing = true;
    } else {
      this.consume(TokenType.Punctuator, '>');
    }

    const children: ASTNode[] = [];
    if (!isSelfClosing) {
      while (this.peek().type !== TokenType.JSXTagClose) {
        if (this.peek().type === TokenType.JSXTagOpen) {
          children.push(this.parseJSXElement());
        } else if (this.peek().value === '{') {
          // Expression child
          this.advance();
          children.push({
            type: NodeType.JSXExpressionContainer,
            expression: this.parseExpression()
          });
          this.consume(TokenType.Punctuator, '}');
        } else {
          // JSX Text
          const textToken = this.advance();
          children.push({
            type: NodeType.JSXText,
            value: textToken.value
          });
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

  private parseExpressionStatement(): ASTNode {
    const expr = this.parseExpression();
    if (this.peek().value === ';') {
      this.advance();
    }
    return {
      type: NodeType.ExpressionStatement,
      expression: expr
    };
  }

  private parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): ASTNode {
    const left = this.parseBinary();
    return left;
  }

  private parseBinary(): ASTNode {
    let left = this.parsePrimary();
    const ops = ['+', '-', '*', '/', '===', '==', '!=', '=>'];
    while (ops.includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parsePrimary();
      left = {
        type: NodeType.BinaryExpression,
        operator: op,
        left,
        right
      };
    }
    return left;
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    if (token.type === TokenType.StringLiteral) {
      const raw = this.advance();
      return { type: NodeType.Literal, value: raw.value.replace(/['"`]/g, ''), raw: raw.value };
    }
    if (token.type === TokenType.NumericLiteral) {
      const raw = this.advance();
      return { type: NodeType.Literal, value: Number(raw.value), raw: raw.value };
    }
    if (token.type === TokenType.JSXTagOpen) {
      return this.parseJSXElement();
    }
    if (token.type === TokenType.Keyword) {
      if (token.value === 'true') {
        this.advance();
        return { type: NodeType.Literal, value: true, raw: 'true' };
      }
      if (token.value === 'false') {
        this.advance();
        return { type: NodeType.Literal, value: false, raw: 'false' };
      }
      if (token.value === 'null') {
        this.advance();
        return { type: NodeType.Literal, value: null, raw: 'null' };
      }
    }
    if (token.type === TokenType.Identifier) {
      const id = this.advance();
      
      // Dynamic import representation / call
      if (id.value === 'import' && this.peek().value === '(') {
        this.advance(); // (
        const arg = this.parseExpression();
        this.consume(TokenType.Punctuator, ')');
        return {
          type: NodeType.CallExpression,
          callee: { type: NodeType.Identifier, name: 'import' },
          arguments: [arg]
        };
      }

      // Member call or general call
      let node: ASTNode = { type: NodeType.Identifier, name: id.value };
      while (this.peek().value === '.' || this.peek().value === '(') {
        if (this.peek().value === '.') {
          this.advance();
          const prop = this.consume(TokenType.Identifier);
          node = {
            type: NodeType.MemberExpression,
            object: node,
            property: { type: NodeType.Identifier, name: prop.value }
          };
        } else if (this.peek().value === '(') {
          this.advance();
          const args: ASTNode[] = [];
          while (this.peek().value !== ')') {
            args.push(this.parseExpression());
            if (this.peek().value === ',') this.advance();
          }
          this.consume(TokenType.Punctuator, ')');
          node = {
            type: NodeType.CallExpression,
            callee: node,
            arguments: args
          };
        }
      }
      return node;
    }

    if (token.value === '(') {
      this.advance();
      const expr = this.parseExpression();
      this.consume(TokenType.Punctuator, ')');
      return expr;
    }

    // fallback placeholder identifier
    return { type: NodeType.Identifier, name: this.advance().value };
  }
}
