export enum TokenType {
  Keyword = 'Keyword',
  Identifier = 'Identifier',
  StringLiteral = 'StringLiteral',
  NumericLiteral = 'NumericLiteral',
  RegExpLiteral = 'RegExpLiteral',
  Punctuator = 'Punctuator',
  TemplateHead = 'TemplateHead',       // `...${
  TemplateMiddle = 'TemplateMiddle',   // }...${
  TemplateTail = 'TemplateTail',       // }...`
  TemplateNoSub = 'TemplateNoSub',     // `...` (no interpolation)
  PrivateIdentifier = 'PrivateIdentifier', // #foo
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

const KEYWORDS = new Set([
  'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
  'if', 'else', 'true', 'false', 'null', 'undefined', 'await', 'async',
  'default', 'as', 'class', 'extends', 'super', 'this', 'new', 'typeof',
  'instanceof', 'void', 'delete', 'in', 'of', 'yield',
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
  'throw', 'try', 'catch', 'finally',
  'with', 'using', 'debugger', 'static', 'get', 'set',
]);

export class Lexer {
  private source: string;
  private length: number;
  private index = 0;
  private line = 1;
  private column = 1;
  private templateDepth = 0;
  private contextStack: string[] = [];

  constructor(source: string) {
    this.source = source;
    this.length = source.length;
  }

  private peek(): string {
    return this.index < this.length ? this.source[this.index] : '';
  }

  private peekAt(offset: number): string {
    const i = this.index + offset;
    return i < this.length ? this.source[i] : '';
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

  private slice(start: number, end: number): string {
    return this.source.slice(start, end);
  }

  // Whether the last meaningful token could be the end of an expression.
  // Used to distinguish regex `/` from division `/`.
  private canPrecedeDivision(lastToken: Token | null): boolean {
    if (!lastToken) return false;
    if (lastToken.type === TokenType.Identifier) return true;
    if (lastToken.type === TokenType.NumericLiteral) return true;
    if (lastToken.type === TokenType.StringLiteral) return true;
    if (lastToken.type === TokenType.Punctuator) {
      return [')', ']', '++', '--'].includes(lastToken.value);
    }
    if (lastToken.type === TokenType.Keyword) {
      return ['this', 'true', 'false', 'null', 'undefined'].includes(lastToken.value);
    }
    return false;
  }

  private updateContext(val: string) {
    if (val === '{') {
      const top = this.contextStack[this.contextStack.length - 1];
      if (top === 'jsx-child' || top === 'jsx-tag') {
        this.contextStack.push('jsx-expr');
      } else if (top === 'jsx-expr' || top === 'brace') {
        this.contextStack.push('brace');
      }
    } else if (val === '}') {
      const top = this.contextStack[this.contextStack.length - 1];
      if (top === 'brace') {
        this.contextStack.pop();
      } else if (top === 'jsx-expr') {
        this.contextStack.pop();
      }
    } else if (val === '>') {
      if (this.contextStack[this.contextStack.length - 1] === 'jsx-tag') {
        this.contextStack.pop();
        this.contextStack.push('jsx-child');
      }
    } else if (val === '/>') {
      if (this.contextStack[this.contextStack.length - 1] === 'jsx-tag') {
        this.contextStack.pop();
      }
    }
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    let lastToken: Token | null = null;

    while (this.index < this.length) {
      const startLine = this.line;
      const startColumn = this.column;
      const char = this.peek();

      if (this.contextStack[this.contextStack.length - 1] === 'jsx-child') {
        if (char !== '<' && char !== '{') {
          let value = '';
          while (this.index < this.length && this.peek() !== '<' && this.peek() !== '{') {
            value += this.advance();
          }
          const t: Token = { type: TokenType.StringLiteral, value, line: startLine, column: startColumn };
          tokens.push(t);
          lastToken = t;
          continue;
        }
      }

      // Whitespace
      if (/\s/.test(char)) {
        this.advance();
        continue;
      }

      // ── Comments ──
      if (char === '/' && this.peekAt(1) === '/') {
        let commentVal = '';
        while (this.index < this.length && this.peek() !== '\n') {
          commentVal += this.advance();
        }
        const t = { type: TokenType.Comment, value: commentVal, line: startLine, column: startColumn };
        tokens.push(t);
        continue;
      }
      if (char === '/' && this.peekAt(1) === '*') {
        let commentVal = '';
        while (this.index < this.length && !(this.peek() === '*' && this.peekAt(1) === '/')) {
          commentVal += this.advance();
        }
        commentVal += this.advance(); // *
        commentVal += this.advance(); // /
        const t = { type: TokenType.Comment, value: commentVal, line: startLine, column: startColumn };
        tokens.push(t);
        continue;
      }

      // ── Template Literals ──
      if (char === '`') {
        const tok = this.readTemplateLiteral(startLine, startColumn);
        tokens.push(tok);
        lastToken = tok;
        continue;
      }

      // ── Template continuation: } inside template expression ──
      if (char === '}' && this.templateDepth > 0) {
        // End of template expression, continue reading template
        this.advance(); // consume }
        const tok = this.readTemplateAfterExpression(startLine, startColumn);
        tokens.push(tok);
        lastToken = tok;
        continue;
      }

      // ── JSX specific: closing tag ──
      if (char === '<' && this.peekAt(1) === '/' && /[a-zA-Z_]/.test(this.peekAt(2) || '')) {
        let tagVal = this.advance(); // <
        tagVal += this.advance(); // /
        while (this.index < this.length && /[a-zA-Z0-9_\-\.]/.test(this.peek())) {
          tagVal += this.advance();
        }
        if (this.peek() === '>') {
          tagVal += this.advance();
        }
        const t: Token = { type: TokenType.JSXTagClose, value: tagVal, line: startLine, column: startColumn };
        tokens.push(t);
        lastToken = t;
        if (this.contextStack[this.contextStack.length - 1] === 'jsx-child') {
          this.contextStack.pop();
        }
        continue;
      }

      // ── JSX specific: opening tag ──
      if (char === '<' && /[a-zA-Z_]/.test(this.peekAt(1) || '')) {
        // If preceded by an identifier or certain keywords (except return, default, yield, throw),
        // it's likely a generic parameter list or comparison, not JSX.
        const skipJSX = lastToken && (
          lastToken.type === TokenType.Identifier ||
          (lastToken.type === TokenType.Keyword && !['return', 'yield', 'default', 'throw', 'await'].includes(lastToken.value))
        );
        if (!skipJSX) {
          let tagVal = this.advance(); // <
          while (this.index < this.length && /[a-zA-Z0-9_\-\.]/.test(this.peek())) {
            tagVal += this.advance();
          }
          const t: Token = { type: TokenType.JSXTagOpen, value: tagVal, line: startLine, column: startColumn };
          tokens.push(t);
          lastToken = t;
          this.contextStack.push('jsx-tag');
          continue;
        }
      }

      // ── Regex Literal ──
      if (char === '/' && !this.canPrecedeDivision(lastToken)) {
        const tok = this.readRegex(startLine, startColumn);
        if (tok) {
          tokens.push(tok);
          lastToken = tok;
          continue;
        }
        // If not a valid regex, fall through to punctuator
      }

      // ── String literals ──
      if (char === '"' || char === "'") {
        const tok = this.readString(startLine, startColumn);
        tokens.push(tok);
        lastToken = tok;
        continue;
      }

      // ── Numeric literals ──
      if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(this.peekAt(1)))) {
        const tok = this.readNumber(startLine, startColumn);
        tokens.push(tok);
        lastToken = tok;
        continue;
      }

      // ── Private identifiers: #foo ──
      if (char === '#' && /[a-zA-Z_$]/.test(this.peekAt(1))) {
        this.advance(); // #
        let name = '#';
        while (this.index < this.length && /[a-zA-Z0-9_$]/.test(this.peek())) {
          name += this.advance();
        }
        const t: Token = { type: TokenType.PrivateIdentifier, value: name, line: startLine, column: startColumn };
        tokens.push(t);
        lastToken = t;
        continue;
      }

      // ── Decorator: @ ──
      if (char === '@') {
        const t: Token = { type: TokenType.Punctuator, value: this.advance(), line: startLine, column: startColumn };
        tokens.push(t);
        lastToken = t;
        continue;
      }

      // ── Identifiers / Keywords ──
      if (/[a-zA-Z_$]/.test(char)) {
        let identVal = '';
        while (this.index < this.length && /[a-zA-Z0-9_$]/.test(this.peek())) {
          identVal += this.advance();
        }

        const type = KEYWORDS.has(identVal) ? TokenType.Keyword : TokenType.Identifier;
        const t: Token = { type, value: identVal, line: startLine, column: startColumn };
        tokens.push(t);
        lastToken = t;
        continue;
      }

      // ── Multi-character operators / punctuators ──
      const tok = this.readPunctuator(startLine, startColumn);
      if (tok) {
        tokens.push(tok);
        lastToken = tok;
        this.updateContext(tok.value);
        continue;
      }

      // ── Single-char fallback ──
      const puncVal = this.advance();
      const t: Token = { type: TokenType.Punctuator, value: puncVal, line: startLine, column: startColumn };
      tokens.push(t);
      lastToken = t;
      this.updateContext(puncVal);
    }

    tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column });
    return tokens;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private readString(startLine: number, startCol: number): Token {
    const quote = this.advance();
    let strVal = quote;
    while (this.index < this.length && this.peek() !== quote) {
      if (this.peek() === '\\') {
        strVal += this.advance();
      }
      strVal += this.advance();
    }
    if (this.index < this.length) {
      strVal += this.advance(); // closing quote
    }
    return { type: TokenType.StringLiteral, value: strVal, line: startLine, column: startCol };
  }

  private readNumber(startLine: number, startCol: number): Token {
    let numVal = '';

    // Handle 0x, 0o, 0b prefixes
    if (this.peek() === '0' && /[xXoObB]/.test(this.peekAt(1))) {
      numVal += this.advance(); // 0
      numVal += this.advance(); // prefix letter
      while (this.index < this.length && /[0-9a-fA-F_]/.test(this.peek())) {
        numVal += this.advance();
      }
      // BigInt suffix
      if (this.peek() === 'n') numVal += this.advance();
      return { type: TokenType.NumericLiteral, value: numVal, line: startLine, column: startCol };
    }

    while (this.index < this.length && /[0-9_]/.test(this.peek())) {
      numVal += this.advance();
    }
    if (this.peek() === '.' && /[0-9]/.test(this.peekAt(1))) {
      numVal += this.advance(); // .
      while (this.index < this.length && /[0-9_]/.test(this.peek())) {
        numVal += this.advance();
      }
    }
    // Exponent
    if (this.peek() === 'e' || this.peek() === 'E') {
      numVal += this.advance();
      if (this.peek() === '+' || this.peek() === '-') numVal += this.advance();
      while (this.index < this.length && /[0-9_]/.test(this.peek())) {
        numVal += this.advance();
      }
    }
    // BigInt suffix
    if (this.peek() === 'n') numVal += this.advance();

    return { type: TokenType.NumericLiteral, value: numVal, line: startLine, column: startCol };
  }

  private readRegex(startLine: number, startCol: number): Token | null {
    const saved = { index: this.index, line: this.line, column: this.column };
    let regexVal = this.advance(); // opening /
    let inCharClass = false;

    while (this.index < this.length) {
      const c = this.peek();
      if (c === '\n') {
        // Not a valid regex — restore and return null
        this.index = saved.index;
        this.line = saved.line;
        this.column = saved.column;
        return null;
      }
      if (c === '\\') {
        regexVal += this.advance();
        if (this.index < this.length) regexVal += this.advance();
        continue;
      }
      if (c === '[') inCharClass = true;
      if (c === ']') inCharClass = false;
      if (c === '/' && !inCharClass) {
        regexVal += this.advance(); // closing /
        // Read flags
        while (this.index < this.length && /[gimsuy]/.test(this.peek())) {
          regexVal += this.advance();
        }
        return { type: TokenType.RegExpLiteral, value: regexVal, line: startLine, column: startCol };
      }
      regexVal += this.advance();
    }

    // Unterminated — restore
    this.index = saved.index;
    this.line = saved.line;
    this.column = saved.column;
    return null;
  }

  private readTemplateLiteral(startLine: number, startCol: number): Token {
    this.advance(); // consume opening `
    let val = '`';

    while (this.index < this.length) {
      const c = this.peek();
      if (c === '\\') {
        val += this.advance();
        if (this.index < this.length) val += this.advance();
        continue;
      }
      if (c === '$' && this.peekAt(1) === '{') {
        val += this.advance(); // $
        val += this.advance(); // {
        this.templateDepth++;
        return { type: TokenType.TemplateHead, value: val, line: startLine, column: startCol };
      }
      if (c === '`') {
        val += this.advance(); // closing `
        return { type: TokenType.TemplateNoSub, value: val, line: startLine, column: startCol };
      }
      val += this.advance();
    }

    // Unterminated template
    return { type: TokenType.TemplateNoSub, value: val, line: startLine, column: startCol };
  }

  private readTemplateAfterExpression(startLine: number, startCol: number): Token {
    let val = '}';

    while (this.index < this.length) {
      const c = this.peek();
      if (c === '\\') {
        val += this.advance();
        if (this.index < this.length) val += this.advance();
        continue;
      }
      if (c === '$' && this.peekAt(1) === '{') {
        val += this.advance(); // $
        val += this.advance(); // {
        // templateDepth stays the same (we're still inside)
        return { type: TokenType.TemplateMiddle, value: val, line: startLine, column: startCol };
      }
      if (c === '`') {
        val += this.advance(); // closing `
        this.templateDepth--;
        return { type: TokenType.TemplateTail, value: val, line: startLine, column: startCol };
      }
      val += this.advance();
    }

    // Unterminated
    this.templateDepth--;
    return { type: TokenType.TemplateTail, value: val, line: startLine, column: startCol };
  }

  private readPunctuator(startLine: number, startCol: number): Token | null {
    const c1 = this.peek();
    const c2 = this.peekAt(1);
    const c3 = this.peekAt(2);
    const c4 = this.peekAt(3);

    // 4-char operators
    const four = c1 + (c2 || '') + (c3 || '') + (c4 || '');
    if (four === '>>>=') {
      this.advance(); this.advance(); this.advance(); this.advance();
      return { type: TokenType.Punctuator, value: '>>>=', line: startLine, column: startCol };
    }

    // 3-char operators
    const three = c1 + (c2 || '') + (c3 || '');
    const threeCharOps = ['===', '!==', '>>>', '<<=', '>>=', '**=', '&&=', '||=', '??=', '...'];
    if (threeCharOps.includes(three)) {
      this.advance(); this.advance(); this.advance();
      return { type: TokenType.Punctuator, value: three, line: startLine, column: startCol };
    }

    // 2-char operators
    const two = c1 + (c2 || '');
    const twoCharOps = [
      '=>', '==', '!=', '>=', '<=', '&&', '||', '??',
      '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
      '++', '--', '**', '<<', '>>', '?.', '/>'
    ];
    if (twoCharOps.includes(two)) {
      this.advance(); this.advance();
      return { type: TokenType.Punctuator, value: two, line: startLine, column: startCol };
    }

    // Single-char punctuators
    const singleCharOps = '{}()[];,.:?<>+-*/%&|^~!=@>';
    if (singleCharOps.includes(c1)) {
      return { type: TokenType.Punctuator, value: this.advance(), line: startLine, column: startCol };
    }

    return null;
  }
}
