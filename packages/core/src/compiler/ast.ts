export enum NodeType {
  // ── Core ──
  Program = 'Program',
  BlockStatement = 'BlockStatement',
  ExpressionStatement = 'ExpressionStatement',
  ReturnStatement = 'ReturnStatement',

  // ── Declarations ──
  VariableDeclaration = 'VariableDeclaration',
  VariableDeclarator = 'VariableDeclarator',
  FunctionDeclaration = 'FunctionDeclaration',
  ClassDeclaration = 'ClassDeclaration',
  ClassBody = 'ClassBody',
  MethodDefinition = 'MethodDefinition',
  PropertyDefinition = 'PropertyDefinition',
  UsingDeclaration = 'UsingDeclaration',

  // ── Imports / Exports ──
  ImportDeclaration = 'ImportDeclaration',
  ImportSpecifier = 'ImportSpecifier',
  ImportDefaultSpecifier = 'ImportDefaultSpecifier',
  ImportNamespaceSpecifier = 'ImportNamespaceSpecifier',
  ImportExpression = 'ImportExpression',
  ImportAttribute = 'ImportAttribute',
  ExportNamedDeclaration = 'ExportNamedDeclaration',
  ExportAllDeclaration = 'ExportAllDeclaration',
  ExportSpecifier = 'ExportSpecifier',

  // ── Expressions ──
  Identifier = 'Identifier',
  Literal = 'Literal',
  BinaryExpression = 'BinaryExpression',
  LogicalExpression = 'LogicalExpression',
  UnaryExpression = 'UnaryExpression',
  UpdateExpression = 'UpdateExpression',
  AssignmentExpression = 'AssignmentExpression',
  ConditionalExpression = 'ConditionalExpression',
  CallExpression = 'CallExpression',
  MemberExpression = 'MemberExpression',
  ArrowFunctionExpression = 'ArrowFunctionExpression',
  NewExpression = 'NewExpression',
  SequenceExpression = 'SequenceExpression',
  AwaitExpression = 'AwaitExpression',
  YieldExpression = 'YieldExpression',
  TaggedTemplateExpression = 'TaggedTemplateExpression',
  TemplateLiteral = 'TemplateLiteral',
  TemplateElement = 'TemplateElement',
  SpreadElement = 'SpreadElement',
  RestElement = 'RestElement',
  ArrayExpression = 'ArrayExpression',
  ObjectExpression = 'ObjectExpression',
  Property = 'Property',

  // ── Optional Chaining ──
  ChainExpression = 'ChainExpression',
  OptionalMemberExpression = 'OptionalMemberExpression',
  OptionalCallExpression = 'OptionalCallExpression',

  // ── Patterns (Destructuring) ──
  ObjectPattern = 'ObjectPattern',
  ArrayPattern = 'ArrayPattern',
  AssignmentPattern = 'AssignmentPattern',

  // ── Statements ──
  IfStatement = 'IfStatement',
  ForStatement = 'ForStatement',
  ForInStatement = 'ForInStatement',
  ForOfStatement = 'ForOfStatement',
  WhileStatement = 'WhileStatement',
  DoWhileStatement = 'DoWhileStatement',
  SwitchStatement = 'SwitchStatement',
  SwitchCase = 'SwitchCase',
  TryStatement = 'TryStatement',
  CatchClause = 'CatchClause',
  ThrowStatement = 'ThrowStatement',
  BreakStatement = 'BreakStatement',
  ContinueStatement = 'ContinueStatement',

  // ── JSX ──
  JSXElement = 'JSXElement',
  JSXOpeningElement = 'JSXOpeningElement',
  JSXClosingElement = 'JSXClosingElement',
  JSXAttribute = 'JSXAttribute',
  JSXSpreadAttribute = 'JSXSpreadAttribute',
  JSXExpressionContainer = 'JSXExpressionContainer',
  JSXText = 'JSXText',
  JSXFragment = 'JSXFragment',

  // ── Decorators ──
  Decorator = 'Decorator',

  // ── Private Fields ──
  PrivateIdentifier = 'PrivateIdentifier',

  // ── TypeScript (for stripping) ──
  TSTypeAnnotation = 'TSTypeAnnotation',
  TSEnumDeclaration = 'TSEnumDeclaration',
  TSDeclareBlock = 'TSDeclareBlock',
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
  attributes?: ASTNode[];
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

export interface ArrowFunctionExpression extends ASTNode {
  type: NodeType.ArrowFunctionExpression;
  params: ASTNode[];
  body: ASTNode;
  async: boolean;
  expression: boolean; // true if concise body (no braces)
}

export interface ClassDeclaration extends ASTNode {
  type: NodeType.ClassDeclaration;
  id: ASTNode | null;
  superClass: ASTNode | null;
  body: ASTNode; // ClassBody
  decorators?: ASTNode[];
}

export interface TemplateLiteral extends ASTNode {
  type: NodeType.TemplateLiteral;
  quasis: ASTNode[]; // TemplateElement[]
  expressions: ASTNode[];
}

export interface ConditionalExpression extends ASTNode {
  type: NodeType.ConditionalExpression;
  test: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

export interface ForOfStatement extends ASTNode {
  type: NodeType.ForOfStatement;
  left: ASTNode;
  right: ASTNode;
  body: ASTNode;
  await: boolean;
}

export interface TryStatement extends ASTNode {
  type: NodeType.TryStatement;
  block: ASTNode;
  handler: ASTNode | null;
  finalizer: ASTNode | null;
}
