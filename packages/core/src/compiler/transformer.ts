import { ASTNode, NodeType } from './ast.js';

export class Transformer {
  private env: Record<string, string>;

  constructor(env: Record<string, string> = {}) {
    this.env = env;
  }

  transform(node: ASTNode): ASTNode {
    return this.visit(node);
  }

  private visit(node: ASTNode): ASTNode {
    if (!node) return node;

    // Recurse children based on node fields
    if (node.type === NodeType.Program) {
      node.body = node.body.map((child: any) => this.visit(child));
      return node;
    }

    if (node.type === NodeType.ExportNamedDeclaration) {
      if (node.declaration) {
        node.declaration = this.visit(node.declaration);
      }
      return node;
    }

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

    if (node.type === NodeType.FunctionDeclaration) {
      if (node.body) {
        node.body = this.visit(node.body);
      }
      return node;
    }

    if (node.type === NodeType.BlockStatement) {
      node.body = node.body.map((child: any) => this.visit(child));
      return node;
    }

    if (node.type === NodeType.IfStatement) {
      node.test = this.visit(node.test);
      node.consequent = this.visit(node.consequent);
      if (node.alternate) {
        node.alternate = this.visit(node.alternate);
      }
      return node;
    }

    if (node.type === NodeType.ReturnStatement) {
      if (node.argument) {
        node.argument = this.visit(node.argument);
      }
      return node;
    }

    if (node.type === NodeType.ExpressionStatement) {
      node.expression = this.visit(node.expression);
      return node;
    }

    if (node.type === NodeType.BinaryExpression) {
      node.left = this.visit(node.left);
      node.right = this.visit(node.right);
      return node;
    }

    if (node.type === NodeType.CallExpression) {
      node.callee = this.visit(node.callee);
      node.arguments = node.arguments.map((arg: any) => this.visit(arg));
      return node;
    }

    // Environmental variables replacement: e.g. process.env.NODE_ENV
    if (node.type === NodeType.MemberExpression) {
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

    // JSX transformation: JSXElement -> React.createElement(...) CallExpression
    if (node.type === NodeType.JSXElement) {
      const opening = node.openingElement;
      const tag = opening.name.name;
      const isHtmlTag = tag[0] === tag[0].toLowerCase();

      const tagExpr = isHtmlTag 
        ? { type: NodeType.Literal, value: tag, raw: `"${tag}"` }
        : { type: NodeType.Identifier, name: tag };

      const attrsObj: Record<string, any> = {};
      opening.attributes.forEach((attr: any) => {
        const attrName = attr.name.name;
        attrsObj[attrName] = this.visit(attr.value);
      });

      // Map dynamic object attribute structure
      const propsNode = {
        type: 'ObjectExpression',
        properties: Object.keys(attrsObj).map(key => ({
          type: 'Property',
          key: { type: NodeType.Identifier, name: key },
          value: attrsObj[key]
        }))
      };

      const childNodes = node.children
        .filter((child: any) => child.type !== NodeType.JSXText || child.value.trim() !== '')
        .map((child: any) => this.visit(child));

      return {
        type: NodeType.CallExpression,
        callee: {
          type: NodeType.MemberExpression,
          object: { type: NodeType.Identifier, name: 'React' },
          property: { type: NodeType.Identifier, name: 'createElement' }
        },
        arguments: [tagExpr, propsNode, ...childNodes]
      };
    }

    if (node.type === NodeType.JSXExpressionContainer) {
      return this.visit(node.expression);
    }

    return node;
  }

  private flattenMemberExpression(node: ASTNode): string {
    if (node.type === NodeType.Identifier) {
      return node.name;
    }
    if (node.type === NodeType.MemberExpression) {
      const obj = this.flattenMemberExpression(node.object);
      const prop = this.flattenMemberExpression(node.property);
      return `${obj}.${prop}`;
    }
    return '';
  }
}
