import { ASTNode, NodeType } from './ast.js';

export class CodeGenerator {
  private minified: boolean;

  constructor(minified = false) {
    this.minified = minified;
  }

  generate(node: ASTNode): string {
    if (!node) return '';

    const space = this.minified ? '' : ' ';
    const newline = this.minified ? '' : '\n';

    switch (node.type) {
      case NodeType.Program:
        return node.body.map((child: any) => this.generate(child)).join(newline);

      case NodeType.ImportDeclaration: {
        const specs = node.specifiers;
        if (specs.length === 0) {
          return `import${space}${this.generate(node.source)};`;
        }

        const specStrs = specs.map((spec: any) => {
          if (spec.type === NodeType.ImportDefaultSpecifier) {
            return this.generate(spec.local);
          }
          if (spec.type === NodeType.ImportNamespaceSpecifier) {
            return `*${space}as${space}${this.generate(spec.local)}`;
          }
          // Named import specifier
          const imported = this.generate(spec.imported);
          const local = this.generate(spec.local);
          if (imported === local) return imported;
          return `${imported}${space}as${space}${local}`;
        });

        // Detect default vs named lists
        const defaultSpec = specs.find((s: any) => s.type === NodeType.ImportDefaultSpecifier);
        const nonDefaultSpecs = specs.filter((s: any) => s.type !== NodeType.ImportDefaultSpecifier);

        let importsPart = '';
        if (defaultSpec) {
          importsPart += this.generate(defaultSpec.local);
          if (nonDefaultSpecs.length > 0) {
            importsPart += `,${space}`;
          }
        }
        if (nonDefaultSpecs.length > 0) {
          if (nonDefaultSpecs[0].type === NodeType.ImportNamespaceSpecifier) {
            importsPart += specStrs.find((s: string) => s.startsWith('*')) || '';
          } else {
            importsPart += `{${space}${nonDefaultSpecs.map((s: any) => {
              const parts = s.split(/\s+/);
              if (parts.length === 3) return `${parts[0]}${space}as${space}${parts[2]}`;
              return parts[0];
            }).join(`,${space}`)}${space}}`;
          }
        }

        return `import${space}${importsPart}${space}from${space}${this.generate(node.source)};`;
      }

      case NodeType.ExportNamedDeclaration: {
        const prefix = node.isDefault ? `export${space}default${space}` : `export${space}`;
        return `${prefix}${this.generate(node.declaration)}`;
      }

      case NodeType.VariableDeclaration: {
        const decls = node.declarations.map((d: any) => this.generate(d)).join(`,${space}`);
        return `${node.kind}${space}${decls};`;
      }

      case NodeType.VariableDeclarator: {
        const id = this.generate(node.id);
        const init = node.init ? `${space}=${space}${this.generate(node.init)}` : '';
        return `${id}${init}`;
      }

      case NodeType.FunctionDeclaration: {
        const id = this.generate(node.id);
        const params = node.params.map((p: any) => this.generate(p)).join(`,${space}`);
        const body = this.generate(node.body);
        return `function${space}${id}(${params})${space}${body}`;
      }

      case NodeType.BlockStatement: {
        const body = node.body.map((s: any) => this.generate(s)).join(newline);
        if (this.minified) {
          return `{${body}}`;
        }
        const indented = body.split('\n').map((line: string) => '  ' + line).join('\n');
        return `{\n${indented}\n}`;
      }

      case NodeType.IfStatement: {
        const test = this.generate(node.test);
        const cons = this.generate(node.consequent);
        const alt = node.alternate ? `${space}else${space}${this.generate(node.alternate)}` : '';
        return `if${space}(${test})${space}${cons}${alt}`;
      }

      case NodeType.ReturnStatement: {
        const arg = node.argument ? `${space}${this.generate(node.argument)}` : '';
        return `return${arg};`;
      }

      case NodeType.ExpressionStatement: {
        return `${this.generate(node.expression)};`;
      }

      case NodeType.CallExpression: {
        const callee = this.generate(node.callee);
        const args = node.arguments.map((arg: any) => this.generate(arg)).join(`,${space}`);
        return `${callee}(${args})`;
      }

      case NodeType.MemberExpression: {
        const obj = this.generate(node.object);
        const prop = this.generate(node.property);
        return `${obj}.${prop}`;
      }

      case NodeType.BinaryExpression: {
        const left = this.generate(node.left);
        const right = this.generate(node.right);
        const op = node.operator === '=>' ? `${space}=>${space}` : `${space}${node.operator}${space}`;
        return `${left}${op}${right}`;
      }

      case NodeType.Identifier:
        return node.name;

      case NodeType.Literal:
        return node.raw !== undefined ? node.raw : JSON.stringify(node.value);

      case 'ObjectExpression': {
        const props = node.properties.map((p: any) => this.generate(p)).join(`,${space}`);
        return `{${space}${props}${space}}`;
      }

      case 'Property': {
        const key = this.generate(node.key);
        const val = this.generate(node.value);
        return `${key}:${space}${val}`;
      }

      default:
        // Fallback safety
        return '';
    }
  }
}
