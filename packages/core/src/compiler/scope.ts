import { ASTNode, NodeType } from './ast.js';

export class Scope {
  parent: Scope | null;
  bindings: Map<string, { node: ASTNode; referencesCount: number }> = new Map();

  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  declare(name: string, node: ASTNode) {
    this.bindings.set(name, { node, referencesCount: 0 });
  }

  reference(name: string): boolean {
    const binding = this.bindings.get(name);
    if (binding) {
      binding.referencesCount++;
      return true;
    }
    if (this.parent) {
      return this.parent.reference(name);
    }
    return false;
  }

  getBinding(name: string): { node: ASTNode; referencesCount: number } | null {
    const binding = this.bindings.get(name);
    if (binding) return binding;
    if (this.parent) return this.parent.getBinding(name);
    return null;
  }
}

export class ScopeAnalyzer {
  analyze(ast: ASTNode): Scope {
    const globalScope = new Scope();
    this.visit(ast, globalScope);
    return globalScope;
  }

  private visit(node: ASTNode, currentScope: Scope) {
    if (!node) return;

    if (node.type === NodeType.Program) {
      node.body.forEach((child: any) => this.visit(child, currentScope));
    } else if (node.type === NodeType.ImportDeclaration) {
      node.specifiers.forEach((spec: any) => {
        const name = spec.local.name;
        currentScope.declare(name, spec);
      });
    } else if (node.type === NodeType.VariableDeclaration || node.type === NodeType.UsingDeclaration) {
      node.declarations.forEach((decl: any) => {
        this.declarePattern(decl.id, currentScope, decl);
        if (decl.init) this.visit(decl.init, currentScope);
      });
    } else if (node.type === NodeType.FunctionDeclaration) {
      if (node.id && node.id.name) {
        currentScope.declare(node.id.name, node);
      }
      const funcScope = new Scope(currentScope);
      if (node.params) {
        node.params.forEach((p: any) => {
          this.declarePattern(p, funcScope, p);
        });
      }
      if (node.body) this.visit(node.body, funcScope);
    } else if (node.type === NodeType.ArrowFunctionExpression) {
      const funcScope = new Scope(currentScope);
      if (node.params) {
        node.params.forEach((p: any) => {
          this.declarePattern(p, funcScope, p);
        });
      }
      this.visit(node.body, funcScope);
    } else if (node.type === NodeType.ClassDeclaration) {
      if (node.id && node.id.name) {
        currentScope.declare(node.id.name, node);
      }
      if (node.superClass) this.visit(node.superClass, currentScope);
      if (node.body) this.visit(node.body, currentScope);
    } else if (node.type === NodeType.ClassBody) {
      node.body.forEach((child: any) => this.visit(child, currentScope));
    } else if (node.type === NodeType.MethodDefinition) {
      if (node.value) this.visit(node.value, currentScope);
    } else if (node.type === NodeType.PropertyDefinition) {
      if (node.value) this.visit(node.value, currentScope);
    } else if (node.type === NodeType.BlockStatement) {
      const blockScope = new Scope(currentScope);
      node.body.forEach((child: any) => this.visit(child, blockScope));
    } else if (node.type === NodeType.IfStatement) {
      this.visit(node.test, currentScope);
      this.visit(node.consequent, currentScope);
      if (node.alternate) this.visit(node.alternate, currentScope);
    } else if (node.type === NodeType.ForStatement) {
      const forScope = new Scope(currentScope);
      if (node.init) this.visit(node.init, forScope);
      if (node.test) this.visit(node.test, forScope);
      if (node.update) this.visit(node.update, forScope);
      this.visit(node.body, forScope);
    } else if (node.type === NodeType.ForInStatement || node.type === NodeType.ForOfStatement) {
      const forScope = new Scope(currentScope);
      this.visit(node.left, forScope);
      this.visit(node.right, forScope);
      this.visit(node.body, forScope);
    } else if (node.type === NodeType.WhileStatement || node.type === NodeType.DoWhileStatement) {
      this.visit(node.test, currentScope);
      this.visit(node.body, currentScope);
    } else if (node.type === NodeType.SwitchStatement) {
      this.visit(node.discriminant, currentScope);
      node.cases.forEach((c: any) => {
        if (c.test) this.visit(c.test, currentScope);
        c.consequent.forEach((s: any) => this.visit(s, currentScope));
      });
    } else if (node.type === NodeType.TryStatement) {
      this.visit(node.block, currentScope);
      if (node.handler) {
        const catchScope = new Scope(currentScope);
        if (node.handler.param) {
          this.declarePattern(node.handler.param, catchScope, node.handler.param);
        }
        this.visit(node.handler.body, catchScope);
      }
      if (node.finalizer) this.visit(node.finalizer, currentScope);
    } else if (node.type === NodeType.ReturnStatement || node.type === NodeType.ThrowStatement) {
      if (node.argument) this.visit(node.argument, currentScope);
    } else if (node.type === NodeType.ExpressionStatement) {
      this.visit(node.expression, currentScope);
    } else if (node.type === NodeType.BinaryExpression || node.type === NodeType.LogicalExpression) {
      this.visit(node.left, currentScope);
      this.visit(node.right, currentScope);
    } else if (node.type === NodeType.AssignmentExpression) {
      this.visit(node.left, currentScope);
      this.visit(node.right, currentScope);
    } else if (node.type === NodeType.ConditionalExpression) {
      this.visit(node.test, currentScope);
      this.visit(node.consequent, currentScope);
      this.visit(node.alternate, currentScope);
    } else if (node.type === NodeType.UnaryExpression || node.type === NodeType.UpdateExpression) {
      this.visit(node.argument, currentScope);
    } else if (node.type === NodeType.AwaitExpression || node.type === NodeType.YieldExpression) {
      if (node.argument) this.visit(node.argument, currentScope);
    } else if (node.type === NodeType.CallExpression || node.type === NodeType.OptionalCallExpression || node.type === NodeType.NewExpression) {
      this.visit(node.callee, currentScope);
      node.arguments.forEach((arg: any) => this.visit(arg, currentScope));
    } else if (node.type === NodeType.MemberExpression || node.type === NodeType.OptionalMemberExpression) {
      this.visit(node.object, currentScope);
      // Property of MemberExpression is not usually a lookup variable
    } else if (node.type === NodeType.Identifier) {
      currentScope.reference(node.name);
    } else if (node.type === NodeType.TemplateLiteral) {
      node.expressions.forEach((e: any) => this.visit(e, currentScope));
    } else if (node.type === NodeType.TaggedTemplateExpression) {
      this.visit(node.tag, currentScope);
      this.visit(node.quasi, currentScope);
    } else if (node.type === NodeType.ArrayExpression) {
      (node.elements || []).forEach((e: any) => { if (e) this.visit(e, currentScope); });
    } else if (node.type === NodeType.ObjectExpression || node.type === 'ObjectExpression') {
      (node.properties || []).forEach((p: any) => {
        if (p.type === NodeType.SpreadElement) {
          this.visit(p.argument, currentScope);
        } else {
          if (p.value) this.visit(p.value, currentScope);
        }
      });
    } else if (node.type === NodeType.SpreadElement) {
      this.visit(node.argument, currentScope);
    } else if (node.type === NodeType.SequenceExpression) {
      node.expressions.forEach((e: any) => this.visit(e, currentScope));
    } else if (node.type === NodeType.ImportExpression) {
      this.visit(node.source, currentScope);
    } else if (node.type === 'ExportDefaultDeclaration') {
      if (node.declaration) {
        this.visit(node.declaration, currentScope);
      }
    } else if (node.type === NodeType.ExportNamedDeclaration || node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        this.visit(node.declaration, currentScope);
      }
      if (node.specifiers) {
        node.specifiers.forEach((spec: any) => {
          if (spec.local) currentScope.reference(spec.local.name);
        });
      }
    } else if (node.type === NodeType.ExportAllDeclaration || node.type === 'ExportAllDeclaration') {
      // export * from '...' — no local binding references
    }
  }

  /**
   * Declares all identifiers from a pattern (destructuring or simple identifier).
   */
  private declarePattern(pattern: ASTNode, scope: Scope, node: ASTNode) {
    if (!pattern) return;

    if (pattern.type === NodeType.Identifier) {
      scope.declare(pattern.name, node);
    } else if (pattern.type === NodeType.ObjectPattern) {
      for (const prop of pattern.properties || []) {
        if (prop.type === NodeType.RestElement) {
          this.declarePattern(prop.argument, scope, node);
        } else {
          this.declarePattern(prop.value || prop.key, scope, node);
        }
      }
    } else if (pattern.type === NodeType.ArrayPattern) {
      for (const elem of pattern.elements || []) {
        if (elem) {
          if (elem.type === NodeType.RestElement) {
            this.declarePattern(elem.argument, scope, node);
          } else {
            this.declarePattern(elem, scope, node);
          }
        }
      }
    } else if (pattern.type === NodeType.AssignmentPattern) {
      this.declarePattern(pattern.left, scope, node);
    } else if (pattern.type === NodeType.RestElement) {
      this.declarePattern(pattern.argument, scope, node);
    }
  }
}
