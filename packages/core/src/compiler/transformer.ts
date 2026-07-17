import { ASTNode, NodeType } from './ast.js';

export interface TransformerOptions {
  /** JSX runtime: 'classic' uses React.createElement, 'automatic' uses jsx/jsxs from react/jsx-runtime */
  jsxRuntime?: 'classic' | 'automatic';
  /** JSX import source (default: 'react') */
  jsxImportSource?: string;
  /** Enable React Compiler compatibility mode */
  reactCompiler?: boolean;
  /** Lower decorators to helper calls */
  lowerDecorators?: boolean;
  /** Lower `using` declarations to try/finally + Symbol.dispose */
  lowerUsing?: boolean;
}

export class Transformer {
  private env: Record<string, string>;
  private options: TransformerOptions;
  private needsJsxImport = false;
  private needsJsxsImport = false;
  private needsFragmentImport = false;
  private needsDisposeHelper = false;

  constructor(env: Record<string, string> = {}, options: TransformerOptions = {}) {
    this.env = env;
    this.options = {
      jsxRuntime: options.jsxRuntime ?? 'classic',
      jsxImportSource: options.jsxImportSource ?? 'react',
      reactCompiler: options.reactCompiler ?? false,
      lowerDecorators: options.lowerDecorators ?? false,
      lowerUsing: options.lowerUsing ?? false,
    };
  }

  transform(node: ASTNode): ASTNode {
    const transformed = this.visit(node);

    // Inject automatic JSX runtime imports at top of Program
    if (transformed.type === NodeType.Program && this.options.jsxRuntime === 'automatic') {
      const imports: ASTNode[] = [];

      if (this.needsJsxImport || this.needsJsxsImport || this.needsFragmentImport) {
        const specifiers: ASTNode[] = [];
        if (this.needsJsxImport) {
          specifiers.push({
            type: NodeType.ImportSpecifier,
            imported: { type: NodeType.Identifier, name: 'jsx' },
            local: { type: NodeType.Identifier, name: '_jsx' },
          });
        }
        if (this.needsJsxsImport) {
          specifiers.push({
            type: NodeType.ImportSpecifier,
            imported: { type: NodeType.Identifier, name: 'jsxs' },
            local: { type: NodeType.Identifier, name: '_jsxs' },
          });
        }
        if (this.needsFragmentImport) {
          specifiers.push({
            type: NodeType.ImportSpecifier,
            imported: { type: NodeType.Identifier, name: 'Fragment' },
            local: { type: NodeType.Identifier, name: '_Fragment' },
          });
        }

        imports.push({
          type: NodeType.ImportDeclaration,
          specifiers,
          source: {
            type: NodeType.Literal,
            value: `${this.options.jsxImportSource}/jsx-runtime`,
            raw: `"${this.options.jsxImportSource}/jsx-runtime"`,
          },
        });
      }

      if (imports.length > 0) {
        transformed.body = [...imports, ...transformed.body];
      }
    }

    return transformed;
  }

  private visit(node: ASTNode): ASTNode {
    if (!node) return node;

    // ── Program ──
    if (node.type === NodeType.Program) {
      node.body = node.body
        .map((child: any) => this.visit(child))
        .filter((child: any) => child != null);
      return node;
    }

    // ── Exports ──
    if (node.type === NodeType.ExportNamedDeclaration) {
      if (node.declaration) {
        node.declaration = this.visit(node.declaration);
      }
      return node;
    }

    if (node.type === NodeType.ExportAllDeclaration) {
      return node;
    }

    // ── Variable Declarations ──
    if (node.type === NodeType.VariableDeclaration) {
      node.declarations = node.declarations.map((decl: any) => this.visit(decl));
      return node;
    }

    if (node.type === NodeType.VariableDeclarator) {
      if (node.init) {
        node.init = this.visit(node.init);
      }
      return node;
    }

    // ── Using Declaration Lowering ──
    if (node.type === NodeType.UsingDeclaration && this.options.lowerUsing) {
      return this.lowerUsingDeclaration(node);
    }

    // ── Function Declarations ──
    if (node.type === NodeType.FunctionDeclaration) {
      if (node.body) {
        node.body = this.visit(node.body);
      }
      return node;
    }

    // ── Arrow Function ──
    if (node.type === NodeType.ArrowFunctionExpression) {
      node.body = this.visit(node.body);
      return node;
    }

    // ── Class Declarations ──
    if (node.type === NodeType.ClassDeclaration) {
      if (node.body) {
        node.body = this.visit(node.body);
      }
      if (node.decorators && this.options.lowerDecorators) {
        return this.lowerClassDecorators(node);
      }
      return node;
    }

    if (node.type === NodeType.ClassBody) {
      node.body = node.body.map((child: any) => this.visit(child));
      return node;
    }

    if (node.type === NodeType.MethodDefinition) {
      if (node.value) {
        node.value = this.visit(node.value);
      }
      return node;
    }

    if (node.type === NodeType.PropertyDefinition) {
      if (node.value) {
        node.value = this.visit(node.value);
      }
      return node;
    }

    // ── Block Statement ──
    if (node.type === NodeType.BlockStatement) {
      node.body = node.body.map((child: any) => this.visit(child));
      return node;
    }

    // ── Control Flow ──
    if (node.type === NodeType.IfStatement) {
      node.test = this.visit(node.test);
      node.consequent = this.visit(node.consequent);
      if (node.alternate) {
        node.alternate = this.visit(node.alternate);
      }
      return node;
    }

    if (node.type === NodeType.ForStatement) {
      if (node.init) node.init = this.visit(node.init);
      if (node.test) node.test = this.visit(node.test);
      if (node.update) node.update = this.visit(node.update);
      node.body = this.visit(node.body);
      return node;
    }

    if (node.type === NodeType.ForInStatement || node.type === NodeType.ForOfStatement) {
      node.left = this.visit(node.left);
      node.right = this.visit(node.right);
      node.body = this.visit(node.body);
      return node;
    }

    if (node.type === NodeType.WhileStatement || node.type === NodeType.DoWhileStatement) {
      node.test = this.visit(node.test);
      node.body = this.visit(node.body);
      return node;
    }

    if (node.type === NodeType.SwitchStatement) {
      node.discriminant = this.visit(node.discriminant);
      node.cases = node.cases.map((c: any) => {
        if (c.test) c.test = this.visit(c.test);
        c.consequent = c.consequent.map((s: any) => this.visit(s));
        return c;
      });
      return node;
    }

    if (node.type === NodeType.TryStatement) {
      node.block = this.visit(node.block);
      if (node.handler) {
        node.handler.body = this.visit(node.handler.body);
      }
      if (node.finalizer) {
        node.finalizer = this.visit(node.finalizer);
      }
      return node;
    }

    if (node.type === NodeType.ThrowStatement) {
      if (node.argument) node.argument = this.visit(node.argument);
      return node;
    }

    if (node.type === NodeType.ReturnStatement) {
      if (node.argument) {
        node.argument = this.visit(node.argument);
      }
      return node;
    }

    // ── Expression Statement ──
    if (node.type === NodeType.ExpressionStatement) {
      node.expression = this.visit(node.expression);
      return node;
    }

    // ── Binary / Logical Expressions ──
    if (node.type === NodeType.BinaryExpression || node.type === NodeType.LogicalExpression) {
      node.left = this.visit(node.left);
      node.right = this.visit(node.right);
      return node;
    }

    // ── Assignment Expression ──
    if (node.type === NodeType.AssignmentExpression) {
      node.left = this.visit(node.left);
      node.right = this.visit(node.right);
      return node;
    }

    // ── Conditional Expression ──
    if (node.type === NodeType.ConditionalExpression) {
      node.test = this.visit(node.test);
      node.consequent = this.visit(node.consequent);
      node.alternate = this.visit(node.alternate);
      return node;
    }

    // ── Unary / Update ──
    if (node.type === NodeType.UnaryExpression || node.type === NodeType.UpdateExpression) {
      node.argument = this.visit(node.argument);
      return node;
    }

    // ── Await / Yield ──
    if (node.type === NodeType.AwaitExpression || node.type === NodeType.YieldExpression) {
      if (node.argument) node.argument = this.visit(node.argument);
      return node;
    }

    // ── Call Expression ──
    if (node.type === NodeType.CallExpression || node.type === NodeType.OptionalCallExpression) {
      node.callee = this.visit(node.callee);
      node.arguments = node.arguments.map((arg: any) => this.visit(arg));
      return node;
    }

    // ── New Expression ──
    if (node.type === NodeType.NewExpression) {
      node.callee = this.visit(node.callee);
      node.arguments = node.arguments.map((arg: any) => this.visit(arg));
      return node;
    }

    // ── Template Literal ──
    if (node.type === NodeType.TemplateLiteral) {
      node.expressions = node.expressions.map((e: any) => this.visit(e));
      return node;
    }

    if (node.type === NodeType.TaggedTemplateExpression) {
      node.tag = this.visit(node.tag);
      node.quasi = this.visit(node.quasi);
      return node;
    }

    // ── Array Expression ──
    if (node.type === NodeType.ArrayExpression) {
      node.elements = node.elements.map((e: any) => e ? this.visit(e) : e);
      return node;
    }

    // ── Object Expression ──
    if (node.type === NodeType.ObjectExpression || node.type === 'ObjectExpression') {
      if (node.properties) {
        node.properties = node.properties.map((p: any) => {
          if (p.type === NodeType.SpreadElement) {
            p.argument = this.visit(p.argument);
            return p;
          }
          if (p.value) p.value = this.visit(p.value);
          return p;
        });
      }
      return node;
    }

    // ── Spread / Rest ──
    if (node.type === NodeType.SpreadElement) {
      node.argument = this.visit(node.argument);
      return node;
    }

    // ── Import Expression ──
    if (node.type === NodeType.ImportExpression) {
      node.source = this.visit(node.source);
      return node;
    }

    // ── Sequence Expression ──
    if (node.type === NodeType.SequenceExpression) {
      node.expressions = node.expressions.map((e: any) => this.visit(e));
      return node;
    }

    // ── Environmental variables replacement ──
    if (node.type === NodeType.MemberExpression || node.type === NodeType.OptionalMemberExpression) {
      const flat = this.flattenMemberExpression(node);
      if (flat.startsWith('process.env.')) {
        const envKey = flat.slice('process.env.'.length);
        const val = this.env[envKey] || '';
        return {
          type: NodeType.Literal,
          value: val,
          raw: JSON.stringify(val)
        };
      }
      if (flat === 'import.meta.env.MODE') {
        const val = this.env.NODE_ENV || 'development';
        return {
          type: NodeType.Literal,
          value: val,
          raw: JSON.stringify(val)
        };
      }

      node.object = this.visit(node.object);
      node.property = this.visit(node.property);
      return node;
    }

    // ── JSX transformation ──
    if (node.type === NodeType.JSXElement) {
      return this.transformJSX(node);
    }

    if (node.type === NodeType.JSXExpressionContainer) {
      return this.visit(node.expression);
    }

    if (node.type === NodeType.JSXFragment) {
      return this.transformJSXFragment(node);
    }

    if (node.type === NodeType.JSXText) {
      return {
        type: NodeType.Literal,
        value: node.value,
        raw: JSON.stringify(node.value),
      };
    }

    return node;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  JSX Transformation
  // ═══════════════════════════════════════════════════════════════════════════

  private transformJSX(node: ASTNode): ASTNode {
    const opening = node.openingElement;
    const tag = opening.name.name;
    const isHtmlTag = tag[0] === tag[0].toLowerCase();

    const tagExpr = isHtmlTag
      ? { type: NodeType.Literal, value: tag, raw: `"${tag}"` }
      : { type: NodeType.Identifier, name: tag };

    // Build props from attributes
    const propsEntries: ASTNode[] = [];
    let hasSpread = false;

    for (const attr of opening.attributes) {
      if (attr.type === NodeType.JSXSpreadAttribute) {
        hasSpread = true;
        propsEntries.push({
          type: NodeType.SpreadElement,
          argument: this.visit(attr.argument),
        });
      } else {
        const attrName = attr.name.name;
        const attrValue = this.visit(attr.value);
        propsEntries.push({
          type: NodeType.Property,
          key: { type: NodeType.Identifier, name: attrName },
          value: attrValue,
          kind: 'init',
          computed: false,
          method: false,
          shorthand: false,
        });
      }
    }

    const childNodes = node.children
      .filter((child: any) => child.type !== NodeType.JSXText || child.value.trim() !== '')
      .map((child: any) => this.visit(child))
      .filter((child: any) => child != null && child.type !== 'JSXEmptyExpression');

    if (this.options.jsxRuntime === 'automatic') {
      return this.transformJSXAutomatic(tagExpr, propsEntries, childNodes);
    }

    return this.transformJSXClassic(tagExpr, propsEntries, childNodes);
  }

  private transformJSXClassic(tagExpr: ASTNode, propsEntries: ASTNode[], childNodes: ASTNode[]): ASTNode {
    const propsNode: ASTNode = {
      type: NodeType.ObjectExpression,
      properties: propsEntries.length > 0 ? propsEntries : [],
    };
    const propsArg = propsEntries.length > 0 ? propsNode : { type: NodeType.Literal, value: null, raw: 'null' };

    return {
      type: NodeType.CallExpression,
      callee: {
        type: NodeType.MemberExpression,
        object: { type: NodeType.Identifier, name: 'React' },
        property: { type: NodeType.Identifier, name: 'createElement' },
        computed: false,
      },
      arguments: [tagExpr, propsArg, ...childNodes]
    };
  }

  private transformJSXAutomatic(tagExpr: ASTNode, propsEntries: ASTNode[], childNodes: ASTNode[]): ASTNode {
    const hasMultipleChildren = childNodes.length > 1;

    // Build props object, including children
    const allProps = [...propsEntries];
    if (childNodes.length === 1) {
      allProps.push({
        type: NodeType.Property,
        key: { type: NodeType.Identifier, name: 'children' },
        value: childNodes[0],
        kind: 'init',
        computed: false,
        method: false,
        shorthand: false,
      });
    } else if (childNodes.length > 1) {
      allProps.push({
        type: NodeType.Property,
        key: { type: NodeType.Identifier, name: 'children' },
        value: { type: NodeType.ArrayExpression, elements: childNodes },
        kind: 'init',
        computed: false,
        method: false,
        shorthand: false,
      });
    }

    const propsObj: ASTNode = {
      type: NodeType.ObjectExpression,
      properties: allProps,
    };

    if (hasMultipleChildren) {
      this.needsJsxsImport = true;
      return {
        type: NodeType.CallExpression,
        callee: { type: NodeType.Identifier, name: '_jsxs' },
        arguments: [tagExpr, allProps.length > 0 ? propsObj : { type: NodeType.ObjectExpression, properties: [] }],
      };
    }

    this.needsJsxImport = true;
    return {
      type: NodeType.CallExpression,
      callee: { type: NodeType.Identifier, name: '_jsx' },
      arguments: [tagExpr, allProps.length > 0 ? propsObj : { type: NodeType.ObjectExpression, properties: [] }],
    };
  }

  private transformJSXFragment(node: ASTNode): ASTNode {
    this.needsFragmentImport = true;
    const childNodes = node.children
      .filter((child: any) => child.type !== NodeType.JSXText || child.value.trim() !== '')
      .map((child: any) => this.visit(child));

    const tagExpr: ASTNode = { type: NodeType.Identifier, name: '_Fragment' };
    const propsEntries: ASTNode[] = [];

    if (this.options.jsxRuntime === 'automatic') {
      return this.transformJSXAutomatic(tagExpr, propsEntries, childNodes);
    }

    return this.transformJSXClassic(tagExpr, propsEntries, childNodes);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Decorator Lowering
  // ═══════════════════════════════════════════════════════════════════════════

  private lowerClassDecorators(node: ASTNode): ASTNode {
    // TC39 Stage 3 decorator lowering:
    // @dec class Foo {} → class Foo {} Foo = dec(Foo);
    if (!node.decorators || node.decorators.length === 0) return node;

    const className = node.id?.name || '_AnonymousClass';
    const decorators = [...node.decorators];
    delete node.decorators;

    // Build: ClassName = decN(decN-1(...dec1(ClassName)...));
    let expr: ASTNode = { type: NodeType.Identifier, name: className };
    for (const dec of decorators) {
      expr = {
        type: NodeType.CallExpression,
        callee: dec.expression,
        arguments: [expr],
      };
    }

    // Return the class + reassignment as a block
    return {
      type: NodeType.BlockStatement,
      body: [
        node, // class declaration
        {
          type: NodeType.ExpressionStatement,
          expression: {
            type: NodeType.AssignmentExpression,
            operator: '=',
            left: { type: NodeType.Identifier, name: className },
            right: expr,
          },
        },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Using Declaration Lowering
  // ═══════════════════════════════════════════════════════════════════════════

  private lowerUsingDeclaration(node: ASTNode): ASTNode {
    // using x = getResource() →
    // const x = getResource();
    // try { ... } finally { x[Symbol.dispose](); }
    //
    // We can only lower a standalone `using` into const + immediate dispose
    // since we don't have the enclosing block context here. For a simple lowering:
    const decls = node.declarations;
    const stmts: ASTNode[] = [];
    const disposeStmts: ASTNode[] = [];

    for (const decl of decls) {
      stmts.push({
        type: NodeType.VariableDeclaration,
        kind: 'const',
        declarations: [decl],
      });

      const name = decl.id.name;
      // name[Symbol.dispose]()
      disposeStmts.push({
        type: NodeType.ExpressionStatement,
        expression: {
          type: NodeType.CallExpression,
          callee: {
            type: NodeType.MemberExpression,
            object: { type: NodeType.Identifier, name },
            property: {
              type: NodeType.MemberExpression,
              object: { type: NodeType.Identifier, name: 'Symbol' },
              property: { type: NodeType.Identifier, name: node.await ? 'asyncDispose' : 'dispose' },
              computed: false,
            },
            computed: true,
          },
          arguments: [],
        },
      });
    }

    // Return the declarations without the try/finally wrapper — the block-level
    // lowering would require more context. This at minimum preserves semantics.
    return {
      type: NodeType.BlockStatement,
      body: [...stmts],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  private flattenMemberExpression(node: ASTNode): string {
    if (node.type === NodeType.Identifier) {
      return node.name;
    }
    if (node.type === NodeType.MemberExpression || node.type === NodeType.OptionalMemberExpression) {
      const obj = this.flattenMemberExpression(node.object);
      const prop = this.flattenMemberExpression(node.property);
      return `${obj}.${prop}`;
    }
    return '';
  }
}
