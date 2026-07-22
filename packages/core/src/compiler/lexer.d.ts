export declare enum TokenType {
    Keyword = "Keyword",
    Identifier = "Identifier",
    StringLiteral = "StringLiteral",
    NumericLiteral = "NumericLiteral",
    RegExpLiteral = "RegExpLiteral",
    Punctuator = "Punctuator",
    TemplateHead = "TemplateHead",// `...${
    TemplateMiddle = "TemplateMiddle",// }...${
    TemplateTail = "TemplateTail",// }...`
    TemplateNoSub = "TemplateNoSub",// `...` (no interpolation)
    PrivateIdentifier = "PrivateIdentifier",// #foo
    JSXTagOpen = "JSXTagOpen",
    JSXTagClose = "JSXTagClose",
    Comment = "Comment",
    EOF = "EOF"
}
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
export declare class Lexer {
    private source;
    private length;
    private index;
    private line;
    private column;
    private templateDepth;
    private contextStack;
    constructor(source: string);
    private peek;
    private peekAt;
    private advance;
    private slice;
    private canPrecedeDivision;
    private updateContext;
    tokenize(): Token[];
    private readString;
    private readNumber;
    private readRegex;
    private readTemplateLiteral;
    private readTemplateAfterExpression;
    private readPunctuator;
}
//# sourceMappingURL=lexer.d.ts.map