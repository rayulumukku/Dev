import { ASTNode, NodeType } from './ast.js';

export class Optimizer {
  optimize(node: ASTNode): ASTNode {
    return this.visit(node);
  }

  private visit(node: ASTNode): ASTNode {
    if (!node) return node;

    // Recurse children
    if (node.type === NodeType.Program) {
      node.body = node.body.map((child: any) => this.visit(child)).filter(Boolean);
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
      node.body = node.body.map((child: any) => this.visit(child)).filter(Boolean);
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

    if (node.type === NodeType.CallExpression) {
      node.callee = this.visit(node.callee);
      node.arguments = node.arguments.map((arg: any) => this.visit(arg));
      return node;
    }

    // Binary Expression Constant Folding
    if (node.type === NodeType.BinaryExpression) {
      node.left = this.visit(node.left);
      node.right = this.visit(node.right);

      if (node.left.type === NodeType.Literal && node.right.type === NodeType.Literal) {
        const leftVal = node.left.value;
        const rightVal = node.right.value;
        let foldedValue: any = null;
        let shouldFold = false;

        if (node.operator === '+') {
          foldedValue = leftVal + rightVal;
          shouldFold = true;
        } else if (node.operator === '-') {
          foldedValue = leftVal - rightVal;
          shouldFold = true;
        } else if (node.operator === '*') {
          foldedValue = leftVal * rightVal;
          shouldFold = true;
        } else if (node.operator === '/') {
          foldedValue = leftVal / rightVal;
          shouldFold = true;
        } else if (node.operator === '===' || node.operator === '==') {
          foldedValue = leftVal === rightVal;
          shouldFold = true;
        }

        if (shouldFold) {
          return {
            type: NodeType.Literal,
            value: foldedValue,
            raw: JSON.stringify(foldedValue)
          };
        }
      }
      return node;
    }

    // Dead Code Elimination on IfStatements
    if (node.type === NodeType.IfStatement) {
      node.test = this.visit(node.test);
      node.consequent = this.visit(node.consequent);
      if (node.alternate) {
        node.alternate = this.visit(node.alternate);
      }

      if (node.test.type === NodeType.Literal) {
        const testValue = !!node.test.value;
        if (testValue) {
          // If statement test is always true, replace with consequent block or statement
          return node.consequent;
        } else {
          // If statement test is always false, replace with alternate or null
          return node.alternate || { type: NodeType.BlockStatement, body: [] };
        }
      }
    }

    return node;
  }
}
