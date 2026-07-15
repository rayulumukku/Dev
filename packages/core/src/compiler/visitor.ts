import { ASTNode, NodeType } from './ast.js';

export type VisitorCallback = (node: ASTNode, parent: ASTNode | null) => ASTNode | null | ASTNode[];

export interface VisitorHooks {
  enter?: VisitorCallback;
  leave?: VisitorCallback;
  [nodeType: string]: VisitorCallback | VisitorHooks[keyof VisitorHooks] | undefined;
}

export class ASTVisitor {
  private hooks: VisitorHooks;

  constructor(hooks: VisitorHooks) {
    this.hooks = hooks;
  }

  traverse(node: ASTNode, parent: ASTNode | null = null): ASTNode | null | ASTNode[] {
    if (!node) return node;

    // 1. Enter hook
    let current: ASTNode | null | ASTNode[] = node;
    if (this.hooks.enter) {
      current = this.hooks.enter(node, parent);
      if (current === null) return null;
      if (Array.isArray(current)) {
        return current.map(item => this.traverse(item, parent)).filter(Boolean) as ASTNode[];
      }
    }

    // Type-specific entering hook
    const typeHook = this.hooks[current.type];
    if (typeof typeHook === 'function') {
      current = typeHook(current, parent);
      if (current === null) return null;
      if (Array.isArray(current)) {
        return current.map(item => this.traverse(item, parent)).filter(Boolean) as ASTNode[];
      }
    }

    // 2. Traversal of child properties
    const activeNode = current as ASTNode;
    
    if (activeNode.type === NodeType.Program) {
      activeNode.body = this.traverseList(activeNode.body, activeNode);
    } else if (activeNode.type === NodeType.BlockStatement) {
      activeNode.body = this.traverseList(activeNode.body, activeNode);
    } else if (activeNode.type === NodeType.ExportNamedDeclaration) {
      if (activeNode.declaration) {
        const res = this.traverse(activeNode.declaration, activeNode);
        activeNode.declaration = Array.isArray(res) ? res[0] : res;
      }
    } else if (activeNode.type === NodeType.VariableDeclaration) {
      activeNode.declarations = this.traverseList(activeNode.declarations, activeNode);
    } else if (activeNode.type === NodeType.VariableDeclarator) {
      const id = this.traverse(activeNode.id, activeNode);
      activeNode.id = Array.isArray(id) ? id[0] : id;
      if (activeNode.init) {
        const res = this.traverse(activeNode.init, activeNode);
        activeNode.init = Array.isArray(res) ? res[0] : res;
      }
    } else if (activeNode.type === NodeType.FunctionDeclaration) {
      const id = this.traverse(activeNode.id, activeNode);
      activeNode.id = Array.isArray(id) ? id[0] : id;
      activeNode.params = this.traverseList(activeNode.params, activeNode);
      if (activeNode.body) {
        const res = this.traverse(activeNode.body, activeNode);
        activeNode.body = Array.isArray(res) ? res[0] : res;
      }
    } else if (activeNode.type === NodeType.IfStatement) {
      const test = this.traverse(activeNode.test, activeNode);
      activeNode.test = Array.isArray(test) ? test[0] : test;
      const cons = this.traverse(activeNode.consequent, activeNode);
      activeNode.consequent = Array.isArray(cons) ? cons[0] : cons;
      if (activeNode.alternate) {
        const alt = this.traverse(activeNode.alternate, activeNode);
        activeNode.alternate = Array.isArray(alt) ? alt[0] : alt;
      }
    } else if (activeNode.type === NodeType.ReturnStatement) {
      if (activeNode.argument) {
        const res = this.traverse(activeNode.argument, activeNode);
        activeNode.argument = Array.isArray(res) ? res[0] : res;
      }
    } else if (activeNode.type === NodeType.ExpressionStatement) {
      const res = this.traverse(activeNode.expression, activeNode);
      activeNode.expression = Array.isArray(res) ? res[0] : res;
    } else if (activeNode.type === NodeType.BinaryExpression) {
      const left = this.traverse(activeNode.left, activeNode);
      activeNode.left = Array.isArray(left) ? left[0] : left;
      const right = this.traverse(activeNode.right, activeNode);
      activeNode.right = Array.isArray(right) ? right[0] : right;
    } else if (activeNode.type === NodeType.CallExpression) {
      const callee = this.traverse(activeNode.callee, activeNode);
      activeNode.callee = Array.isArray(callee) ? callee[0] : callee;
      activeNode.arguments = this.traverseList(activeNode.arguments, activeNode);
    } else if (activeNode.type === NodeType.MemberExpression) {
      const obj = this.traverse(activeNode.object, activeNode);
      activeNode.object = Array.isArray(obj) ? obj[0] : obj;
      const prop = this.traverse(activeNode.property, activeNode);
      activeNode.property = Array.isArray(prop) ? prop[0] : prop;
    } else if (activeNode.type === NodeType.JSXElement) {
      activeNode.children = this.traverseList(activeNode.children, activeNode);
    }

    // 3. Leave hook
    if (this.hooks.leave) {
      const finalNode = this.hooks.leave(activeNode, parent);
      return finalNode;
    }

    return activeNode;
  }

  private traverseList(list: ASTNode[], parent: ASTNode): ASTNode[] {
    const res: ASTNode[] = [];
    for (const item of list) {
      const traversed = this.traverse(item, parent);
      if (traversed === null) continue;
      if (Array.isArray(traversed)) {
        res.push(...traversed);
      } else {
        res.push(traversed);
      }
    }
    return res;
  }
}
