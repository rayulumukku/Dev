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
    } else if (node.type === NodeType.VariableDeclaration) {
      node.declarations.forEach((decl: any) => {
        const name = decl.id.name;
        currentScope.declare(name, decl);
        if (decl.init) this.visit(decl.init, currentScope);
      });
    } else if (node.type === NodeType.FunctionDeclaration) {
      const name = node.id.name;
      currentScope.declare(name, node);

      const funcScope = new Scope(currentScope);
      node.params.forEach((p: any) => {
        funcScope.declare(p.name, p);
      });
      this.visit(node.body, funcScope);
    } else if (node.type === NodeType.BlockStatement) {
      const blockScope = new Scope(currentScope);
      node.body.forEach((child: any) => this.visit(child, blockScope));
    } else if (node.type === NodeType.IfStatement) {
      this.visit(node.test, currentScope);
      this.visit(node.consequent, currentScope);
      if (node.alternate) this.visit(node.alternate, currentScope);
    } else if (node.type === NodeType.ReturnStatement) {
      if (node.argument) this.visit(node.argument, currentScope);
    } else if (node.type === NodeType.ExpressionStatement) {
      this.visit(node.expression, currentScope);
    } else if (node.type === NodeType.BinaryExpression) {
      this.visit(node.left, currentScope);
      this.visit(node.right, currentScope);
    } else if (node.type === NodeType.CallExpression) {
      this.visit(node.callee, currentScope);
      node.arguments.forEach((arg: any) => this.visit(arg, currentScope));
    } else if (node.type === NodeType.MemberExpression) {
      this.visit(node.object, currentScope);
      // Property of MemberExpression (e.g. obj.prop) is not usually a lookup variable
    } else if (node.type === NodeType.Identifier) {
      currentScope.reference(node.name);
    } else if (node.type === 'ExportDefaultDeclaration') {
      // export default <expression|identifier|function>
      // The exported value is a reference that must be counted
      if (node.declaration) {
        this.visit(node.declaration, currentScope);
      }
    } else if (node.type === 'ExportNamedDeclaration') {
      // export { a, b } or export const x = ...
      if (node.declaration) {
        this.visit(node.declaration, currentScope);
      }
      // export { foo, bar } — each exported specifier references the local binding
      if (node.specifiers) {
        node.specifiers.forEach((spec: any) => {
          if (spec.local) currentScope.reference(spec.local.name);
        });
      }
    } else if (node.type === 'ExportAllDeclaration') {
      // export * from '...' — no local binding references
    }
  }
}
