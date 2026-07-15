export enum TokenType {
  Keyword = 'Keyword',
  Identifier = 'Identifier',
  StringLiteral = 'StringLiteral',
  NumericLiteral = 'NumericLiteral',
  Punctuator = 'Punctuator',
  JSXTagOpen = 'JSXTagOpen',
  JSXTagClose = 'JSXTagClose',
  Comment = 'Comment',
  EOF = 'EOF'
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class Lexer {
  private source: string;
  private length: number;
  private index = 0;
  private line = 1;
  private column = 1;

  constructor(source: string) {
    this.source = source;
    this.length = source.length;
  }

  private peek(): string {
    return this.index < this.length ? this.source[this.index] : '';
  }

  private advance(): string {
    const char = this.peek();
    this.index++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.index < this.length) {
      const startLine = this.line;
      const startColumn = this.column;
      const char = this.peek();

      // Whitespace
      if (/\s/.test(char)) {
        this.advance();
        continue;
      }

      // Comments
      if (char === '/' && this.source[this.index + 1] === '/') {
        let commentVal = '';
        while (this.index < this.length && this.peek() !== '\n') {
          commentVal += this.advance();
        }
        tokens.push({ type: TokenType.Comment, value: commentVal, line: startLine, column: startColumn });
        continue;
      }
      if (char === '/' && this.source[this.index + 1] === '*') {
        let commentVal = '';
        while (this.index < this.length && !(this.peek() === '*' && this.source[this.index + 1] === '/')) {
          commentVal += this.advance();
        }
        commentVal += this.advance(); // *
        commentVal += this.advance(); // /
        tokens.push({ type: TokenType.Comment, value: commentVal, line: startLine, column: startColumn });
        continue;
      }

      // JSX specific: Tag detections
      if (char === '<' && /[a-zA-Z_]/.test(this.source[this.index + 1] || '')) {
        let tagVal = this.advance(); // <
        while (this.index < this.length && /[a-zA-Z0-9_\-\.]/.test(this.peek())) {
          tagVal += this.advance();
        }
        tokens.push({ type: TokenType.JSXTagOpen, value: tagVal, line: startLine, column: startColumn });
        continue;
      }
      if (char === '<' && this.source[this.index + 1] === '/' && /[a-zA-Z_]/.test(this.source[this.index + 2] || '')) {
        let tagVal = this.advance(); // <
        tagVal += this.advance(); // /
        while (this.index < this.length && /[a-zA-Z0-9_\-\.]/.test(this.peek())) {
          tagVal += this.advance();
        }
        if (this.peek() === '>') {
          tagVal += this.advance();
        }
        tokens.push({ type: TokenType.JSXTagClose, value: tagVal, line: startLine, column: startColumn });
        continue;
      }

      // String literals
      if (char === '"' || char === "'" || char === '`') {
        const quote = char;
        let strVal = this.advance(); // quote character
        while (this.index < this.length && this.peek() !== quote) {
          if (this.peek() === '\\') {
            strVal += this.advance();
          }
          strVal += this.advance();
        }
        if (this.index < this.length) {
          strVal += this.advance(); // closing quote
        }
        tokens.push({ type: TokenType.StringLiteral, value: strVal, line: startLine, column: startColumn });
        continue;
      }

      // Numeric literals
      if (/[0-9]/.test(char)) {
        let numVal = '';
        while (this.index < this.length && /[0-9\.]/.test(this.peek())) {
          numVal += this.advance();
        }
        tokens.push({ type: TokenType.NumericLiteral, value: numVal, line: startLine, column: startColumn });
        continue;
      }

      // Identifiers / Keywords
      if (/[a-zA-Z_$]/.test(char)) {
        let identVal = '';
        while (this.index < this.length && /[a-zA-Z0-9_$]/.test(this.peek())) {
          identVal += this.advance();
        }

        const keywords = new Set([
          'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
          'if', 'else', 'true', 'false', 'null', 'await', 'async', 'default', 'as', 'class', 'extends'
        ]);

        const type = keywords.has(identVal) ? TokenType.Keyword : TokenType.Identifier;
        tokens.push({ type, value: identVal, line: startLine, column: startColumn });
        continue;
      }

      // Operators and Punctuators
      const doubleChars = ['=>', '===', '==', '!=', '>=', '<=', '&&', '||', '+=', '-='];
      const nextTwo = this.source.slice(this.index, this.index + 2);
      const nextThree = this.source.slice(this.index, this.index + 3);

      if (nextThree === '===') {
        this.advance(); this.advance(); this.advance();
        tokens.push({ type: TokenType.Punctuator, value: '===', line: startLine, column: startColumn });
        continue;
      }
      if (doubleChars.includes(nextTwo)) {
        this.advance(); this.advance();
        tokens.push({ type: TokenType.Punctuator, value: nextTwo, line: startLine, column: startColumn });
        continue;
      }

      // Single char punctuator
      const puncVal = this.advance();
      tokens.push({ type: TokenType.Punctuator, value: puncVal, line: startLine, column: startColumn });
    }

    tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column });
    return tokens;
  }
}
