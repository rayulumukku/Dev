import { ASTNode, NodeType } from './ast.js';
import { ScopeAnalyzer, Scope } from './scope.js';

export class Optimizer {
  optimize(node: ASTNode): ASTNode {
    const analyzer = new ScopeAnalyzer();
    const globalScope = analyzer.analyze(node);
    return this.visit(node, globalScope);
  }

  private visit(node: ASTNode, scope: Scope, parentType?: string): ASTNode {
    if (!node) return node;

    // Recurse children
    if (node.type === NodeType.Program) {
      node.body = node.body.map((child: any) => this.visit(child, scope, node.type)).filter(Boolean);
      return node;
    }

    if (node.type === NodeType.ExportNamedDeclaration) {
      if (node.declaration) {
        node.declaration = this.visit(node.declaration, scope, node.type);
      }
      return node;
    }

    if (node.type === NodeType.VariableDeclaration) {
      node.declarations = node.declarations
        .map((decl: any) => {
          if (parentType !== NodeType.ExportNamedDeclaration) {
            const binding = scope.getBinding(decl.id.name);
            if (binding && binding.referencesCount === 0) {
              console.log(`[Ray Tree Shaking] Pruned unreferenced variable: ${decl.id.name}`);
              return null;
            }
          }
          return this.visit(decl, scope, node.type);
        })
        .filter(Boolean);

      if (node.declarations.length === 0) {
        return null as any;
      }
      return node;
    }

    if (node.type === NodeType.VariableDeclarator) {
      if (node.init) {
        node.init = this.visit(node.init, scope, node.type);
      }
      return node;
    }

    if (node.type === NodeType.FunctionDeclaration) {
      if (parentType !== NodeType.ExportNamedDeclaration) {
        const binding = scope.getBinding(node.id.name);
        if (binding && binding.referencesCount === 0) {
          console.log(`[Ray Tree Shaking] Pruned unreferenced function: ${node.id.name}`);
          return null as any;
        }
      }

      if (node.body) {
        node.body = this.visit(node.body, scope, node.type);
      }
      return node;
    }

    if (node.type === NodeType.BlockStatement) {
      node.body = node.body.map((child: any) => this.visit(child, scope, node.type)).filter(Boolean);
      return node;
    }

    if (node.type === NodeType.ReturnStatement) {
      if (node.argument) {
        node.argument = this.visit(node.argument, scope, node.type);
      }
      return node;
    }

    if (node.type === NodeType.ExpressionStatement) {
      node.expression = this.visit(node.expression, scope, node.type);
      return node;
    }

    if (node.type === NodeType.CallExpression) {
      node.callee = this.visit(node.callee, scope, node.type);
      node.arguments = node.arguments.map((arg: any) => this.visit(arg, scope, node.type));
      return node;
    }

    // Binary Expression Constant Folding
    if (node.type === NodeType.BinaryExpression) {
      node.left = this.visit(node.left, scope, node.type);
      node.right = this.visit(node.right, scope, node.type);

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
      node.test = this.visit(node.test, scope, node.type);
      node.consequent = this.visit(node.consequent, scope, node.type);
      if (node.alternate) {
        node.alternate = this.visit(node.alternate, scope, node.type);
      }

      if (node.test.type === NodeType.Literal) {
        const testValue = !!node.test.value;
        if (testValue) {
          return node.consequent;
        } else {
          return node.alternate || { type: NodeType.BlockStatement, body: [] };
        }
      }
    }

    return node;
  }
}
