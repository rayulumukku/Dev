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
          if (parentType !== NodeType.ExportNamedDeclaration && decl.id.type === NodeType.Identifier) {
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
      if (parentType !== NodeType.ExportNamedDeclaration && node.id?.name) {
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

    if (node.type === NodeType.ArrowFunctionExpression) {
      node.body = this.visit(node.body, scope, node.type);
      return node;
    }

    if (node.type === NodeType.ClassDeclaration) {
      if (parentType !== NodeType.ExportNamedDeclaration && node.id?.name) {
        const binding = scope.getBinding(node.id.name);
        if (binding && binding.referencesCount === 0) {
          console.log(`[Ray Tree Shaking] Pruned unreferenced class: ${node.id.name}`);
          return null as any;
        }
      }
      if (node.body) {
        node.body = this.visit(node.body, scope, node.type);
      }
      return node;
    }

    if (node.type === NodeType.ClassBody) {
      node.body = node.body.map((child: any) => this.visit(child, scope, node.type)).filter(Boolean);
      return node;
    }

    if (node.type === NodeType.MethodDefinition || node.type === NodeType.PropertyDefinition) {
      if (node.value) node.value = this.visit(node.value, scope, node.type);
      return node;
    }

    if (node.type === NodeType.BlockStatement) {
      node.body = node.body.map((child: any) => this.visit(child, scope, node.type)).filter(Boolean);
      return node;
    }

    if (node.type === NodeType.ReturnStatement || node.type === NodeType.ThrowStatement) {
      if (node.argument) {
        node.argument = this.visit(node.argument, scope, node.type);
      }
      return node;
    }

    if (node.type === NodeType.ExpressionStatement) {
      node.expression = this.visit(node.expression, scope, node.type);
      return node;
    }

    if (node.type === NodeType.CallExpression || node.type === NodeType.OptionalCallExpression || node.type === NodeType.NewExpression) {
      node.callee = this.visit(node.callee, scope, node.type);
      node.arguments = node.arguments.map((arg: any) => this.visit(arg, scope, node.type));
      return node;
    }

    if (node.type === NodeType.MemberExpression || node.type === NodeType.OptionalMemberExpression) {
      node.object = this.visit(node.object, scope, node.type);
      if (node.computed) node.property = this.visit(node.property, scope, node.type);
      return node;
    }

    if (node.type === NodeType.AssignmentExpression) {
      node.left = this.visit(node.left, scope, node.type);
      node.right = this.visit(node.right, scope, node.type);
      return node;
    }

    if (node.type === NodeType.ConditionalExpression) {
      node.test = this.visit(node.test, scope, node.type);
      node.consequent = this.visit(node.consequent, scope, node.type);
      node.alternate = this.visit(node.alternate, scope, node.type);

      // Constant-fold conditional
      if (node.test.type === NodeType.Literal) {
        return node.test.value ? node.consequent : node.alternate;
      }
      return node;
    }

    if (node.type === NodeType.UnaryExpression || node.type === NodeType.UpdateExpression) {
      node.argument = this.visit(node.argument, scope, node.type);
      return node;
    }

    if (node.type === NodeType.AwaitExpression || node.type === NodeType.YieldExpression) {
      if (node.argument) node.argument = this.visit(node.argument, scope, node.type);
      return node;
    }

    // ── Loops ──
    if (node.type === NodeType.ForStatement) {
      if (node.init) node.init = this.visit(node.init, scope, node.type);
      if (node.test) node.test = this.visit(node.test, scope, node.type);
      if (node.update) node.update = this.visit(node.update, scope, node.type);
      node.body = this.visit(node.body, scope, node.type);
      return node;
    }

    if (node.type === NodeType.ForInStatement || node.type === NodeType.ForOfStatement) {
      node.left = this.visit(node.left, scope, node.type);
      node.right = this.visit(node.right, scope, node.type);
      node.body = this.visit(node.body, scope, node.type);
      return node;
    }

    if (node.type === NodeType.WhileStatement || node.type === NodeType.DoWhileStatement) {
      node.test = this.visit(node.test, scope, node.type);
      node.body = this.visit(node.body, scope, node.type);
      return node;
    }

    // ── Switch ──
    if (node.type === NodeType.SwitchStatement) {
      node.discriminant = this.visit(node.discriminant, scope, node.type);
      node.cases = node.cases.map((c: any) => {
        if (c.test) c.test = this.visit(c.test, scope, node.type);
        c.consequent = c.consequent.map((s: any) => this.visit(s, scope, node.type)).filter(Boolean);
        return c;
      });
      return node;
    }

    // ── Try / Catch ──
    if (node.type === NodeType.TryStatement) {
      node.block = this.visit(node.block, scope, node.type);
      if (node.handler) node.handler.body = this.visit(node.handler.body, scope, node.type);
      if (node.finalizer) node.finalizer = this.visit(node.finalizer, scope, node.type);
      return node;
    }

    // ── Template Literal ──
    if (node.type === NodeType.TemplateLiteral) {
      node.expressions = node.expressions.map((e: any) => this.visit(e, scope, node.type));
      return node;
    }

    if (node.type === NodeType.TaggedTemplateExpression) {
      node.tag = this.visit(node.tag, scope, node.type);
      node.quasi = this.visit(node.quasi, scope, node.type);
      return node;
    }

    // ── Array / Object / Spread ──
    if (node.type === NodeType.ArrayExpression) {
      node.elements = (node.elements || []).map((e: any) => e ? this.visit(e, scope, node.type) : e);
      return node;
    }

    if (node.type === NodeType.ObjectExpression || node.type === 'ObjectExpression') {
      if (node.properties) {
        node.properties = node.properties.map((p: any) => {
          if (p.type === NodeType.SpreadElement) {
            p.argument = this.visit(p.argument, scope, node.type);
            return p;
          }
          if (p.value) p.value = this.visit(p.value, scope, node.type);
          return p;
        });
      }
      return node;
    }

    if (node.type === NodeType.SpreadElement) {
      node.argument = this.visit(node.argument, scope, node.type);
      return node;
    }

    if (node.type === NodeType.SequenceExpression) {
      node.expressions = node.expressions.map((e: any) => this.visit(e, scope, node.type));
      return node;
    }

    // ── Logical Expression Constant Folding ──
    if (node.type === NodeType.LogicalExpression) {
      node.left = this.visit(node.left, scope, node.type);
      node.right = this.visit(node.right, scope, node.type);

      if (node.left.type === NodeType.Literal && node.right.type === NodeType.Literal) {
        const l = node.left.value;
        const r = node.right.value;
        let folded: any;
        if (node.operator === '&&') folded = l && r;
        else if (node.operator === '||') folded = l || r;
        else if (node.operator === '??') folded = l ?? r;
        if (folded !== undefined) {
          return { type: NodeType.Literal, value: folded, raw: JSON.stringify(folded) };
        }
      }
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
        } else if (node.operator === '**') {
          foldedValue = leftVal ** rightVal;
          shouldFold = true;
        } else if (node.operator === '%') {
          foldedValue = leftVal % rightVal;
          shouldFold = true;
        } else if (node.operator === '===' || node.operator === '==') {
          foldedValue = leftVal === rightVal;
          shouldFold = true;
        } else if (node.operator === '!==' || node.operator === '!=') {
          foldedValue = leftVal !== rightVal;
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
