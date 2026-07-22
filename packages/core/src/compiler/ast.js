export var NodeType;
(function (NodeType) {
    // ── Core ──
    NodeType["Program"] = "Program";
    NodeType["BlockStatement"] = "BlockStatement";
    NodeType["ExpressionStatement"] = "ExpressionStatement";
    NodeType["ReturnStatement"] = "ReturnStatement";
    // ── Declarations ──
    NodeType["VariableDeclaration"] = "VariableDeclaration";
    NodeType["VariableDeclarator"] = "VariableDeclarator";
    NodeType["FunctionDeclaration"] = "FunctionDeclaration";
    NodeType["ClassDeclaration"] = "ClassDeclaration";
    NodeType["ClassBody"] = "ClassBody";
    NodeType["MethodDefinition"] = "MethodDefinition";
    NodeType["PropertyDefinition"] = "PropertyDefinition";
    NodeType["UsingDeclaration"] = "UsingDeclaration";
    // ── Imports / Exports ──
    NodeType["ImportDeclaration"] = "ImportDeclaration";
    NodeType["ImportSpecifier"] = "ImportSpecifier";
    NodeType["ImportDefaultSpecifier"] = "ImportDefaultSpecifier";
    NodeType["ImportNamespaceSpecifier"] = "ImportNamespaceSpecifier";
    NodeType["ImportExpression"] = "ImportExpression";
    NodeType["ImportAttribute"] = "ImportAttribute";
    NodeType["ExportNamedDeclaration"] = "ExportNamedDeclaration";
    NodeType["ExportAllDeclaration"] = "ExportAllDeclaration";
    NodeType["ExportSpecifier"] = "ExportSpecifier";
    // ── Expressions ──
    NodeType["Identifier"] = "Identifier";
    NodeType["Literal"] = "Literal";
    NodeType["BinaryExpression"] = "BinaryExpression";
    NodeType["LogicalExpression"] = "LogicalExpression";
    NodeType["UnaryExpression"] = "UnaryExpression";
    NodeType["UpdateExpression"] = "UpdateExpression";
    NodeType["AssignmentExpression"] = "AssignmentExpression";
    NodeType["ConditionalExpression"] = "ConditionalExpression";
    NodeType["CallExpression"] = "CallExpression";
    NodeType["MemberExpression"] = "MemberExpression";
    NodeType["ArrowFunctionExpression"] = "ArrowFunctionExpression";
    NodeType["NewExpression"] = "NewExpression";
    NodeType["SequenceExpression"] = "SequenceExpression";
    NodeType["AwaitExpression"] = "AwaitExpression";
    NodeType["YieldExpression"] = "YieldExpression";
    NodeType["TaggedTemplateExpression"] = "TaggedTemplateExpression";
    NodeType["TemplateLiteral"] = "TemplateLiteral";
    NodeType["TemplateElement"] = "TemplateElement";
    NodeType["SpreadElement"] = "SpreadElement";
    NodeType["RestElement"] = "RestElement";
    NodeType["ArrayExpression"] = "ArrayExpression";
    NodeType["ObjectExpression"] = "ObjectExpression";
    NodeType["Property"] = "Property";
    // ── Optional Chaining ──
    NodeType["ChainExpression"] = "ChainExpression";
    NodeType["OptionalMemberExpression"] = "OptionalMemberExpression";
    NodeType["OptionalCallExpression"] = "OptionalCallExpression";
    // ── Patterns (Destructuring) ──
    NodeType["ObjectPattern"] = "ObjectPattern";
    NodeType["ArrayPattern"] = "ArrayPattern";
    NodeType["AssignmentPattern"] = "AssignmentPattern";
    // ── Statements ──
    NodeType["IfStatement"] = "IfStatement";
    NodeType["ForStatement"] = "ForStatement";
    NodeType["ForInStatement"] = "ForInStatement";
    NodeType["ForOfStatement"] = "ForOfStatement";
    NodeType["WhileStatement"] = "WhileStatement";
    NodeType["DoWhileStatement"] = "DoWhileStatement";
    NodeType["SwitchStatement"] = "SwitchStatement";
    NodeType["SwitchCase"] = "SwitchCase";
    NodeType["TryStatement"] = "TryStatement";
    NodeType["CatchClause"] = "CatchClause";
    NodeType["ThrowStatement"] = "ThrowStatement";
    NodeType["BreakStatement"] = "BreakStatement";
    NodeType["ContinueStatement"] = "ContinueStatement";
    // ── JSX ──
    NodeType["JSXElement"] = "JSXElement";
    NodeType["JSXOpeningElement"] = "JSXOpeningElement";
    NodeType["JSXClosingElement"] = "JSXClosingElement";
    NodeType["JSXAttribute"] = "JSXAttribute";
    NodeType["JSXSpreadAttribute"] = "JSXSpreadAttribute";
    NodeType["JSXExpressionContainer"] = "JSXExpressionContainer";
    NodeType["JSXText"] = "JSXText";
    NodeType["JSXFragment"] = "JSXFragment";
    // ── Decorators ──
    NodeType["Decorator"] = "Decorator";
    // ── Private Fields ──
    NodeType["PrivateIdentifier"] = "PrivateIdentifier";
    // ── TypeScript (for stripping) ──
    NodeType["TSTypeAnnotation"] = "TSTypeAnnotation";
    NodeType["TSEnumDeclaration"] = "TSEnumDeclaration";
    NodeType["TSDeclareBlock"] = "TSDeclareBlock";
})(NodeType || (NodeType = {}));
//# sourceMappingURL=ast.js.map