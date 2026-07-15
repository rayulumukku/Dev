export enum NodeType {
  Program = 'Program',
  ImportDeclaration = 'ImportDeclaration',
  ImportSpecifier = 'ImportSpecifier',
  ImportDefaultSpecifier = 'ImportDefaultSpecifier',
  ImportNamespaceSpecifier = 'ImportNamespaceSpecifier',
  ExportNamedDeclaration = 'ExportNamedDeclaration',
  FunctionDeclaration = 'FunctionDeclaration',
  VariableDeclaration = 'VariableDeclaration',
  VariableDeclarator = 'VariableDeclarator',
  JSXElement = 'JSXElement',
  JSXOpeningElement = 'JSXOpeningElement',
  JSXClosingElement = 'JSXClosingElement',
  JSXAttribute = 'JSXAttribute',
  JSXExpressionContainer = 'JSXExpressionContainer',
  JSXText = 'JSXText',
  BinaryExpression = 'BinaryExpression',
  Identifier = 'Identifier',
  Literal = 'Literal',
  IfStatement = 'IfStatement',
  BlockStatement = 'BlockStatement',
  ExpressionStatement = 'ExpressionStatement',
  CallExpression = 'CallExpression',
  MemberExpression = 'MemberExpression',
  TSTypeAnnotation = 'TSTypeAnnotation',
  ArrowFunctionExpression = 'ArrowFunctionExpression',
  ReturnStatement = 'ReturnStatement'
}

export interface ASTNode {
  type: NodeType | string;
  loc?: {
    line: number;
    column: number;
  };
  [key: string]: any;
}

export interface Program extends ASTNode {
  type: NodeType.Program;
  body: ASTNode[];
}

export interface ImportDeclaration extends ASTNode {
  type: NodeType.ImportDeclaration;
  specifiers: ASTNode[];
  source: Literal;
}

export interface Literal extends ASTNode {
  type: NodeType.Literal;
  value: any;
  raw: string;
}

export interface Identifier extends ASTNode {
  type: NodeType.Identifier;
  name: string;
}

export interface JSXElement extends ASTNode {
  type: NodeType.JSXElement;
  openingElement: ASTNode;
  children: ASTNode[];
  closingElement: ASTNode | null;
}
