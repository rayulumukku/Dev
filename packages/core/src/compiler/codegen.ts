import { ASTNode, NodeType } from './ast.js';

export interface SourceMap {
  version: number;
  file: string;
  sources: string[];
  mappings: string;
  names: string[];
}

export class CodeGenerator {
  private minified: boolean;
  private currentLine = 1;
  private currentCol = 0;
  private mappings: Array<{ genLine: number; genCol: number; origLine: number; origCol: number }> = [];

  constructor(minified = false) {
    this.minified = minified;
  }

  private record(node: ASTNode) {
    if (node && node.loc) {
      this.mappings.push({
        genLine: this.currentLine,
        genCol: this.currentCol,
        origLine: node.loc.line,
        origCol: node.loc.column
      });
    }
  }

  private emit(str: string): string {
    const lines = str.split('\n');
    if (lines.length > 1) {
      this.currentLine += lines.length - 1;
      this.currentCol = lines[lines.length - 1].length;
    } else {
      this.currentCol += str.length;
    }
    return str;
  }

  generateWithSourceMap(node: ASTNode, sourceFile: string): { code: string; map: SourceMap } {
    this.currentLine = 1;
    this.currentCol = 0;
    this.mappings = [];

    const code = this.generate(node);

    // Encode source map mappings to Base64 VLQ
    let mappingsStr = '';
    let lastSourceLine = 0;
    let lastSourceCol = 0;
    let lastGenCol = 0;

    const lines: Record<number, any[]> = {};
    for (const m of this.mappings) {
      if (!lines[m.genLine]) lines[m.genLine] = [];
      lines[m.genLine].push(m);
    }

    const genLinesCount = code.split('\n').length;
    for (let i = 1; i <= genLinesCount; i++) {
      if (i > 1) mappingsStr += ';';
      const segs = lines[i] || [];
      lastGenCol = 0;
      const segStrs = segs.map(m => {
        const dGenCol = m.genCol - lastGenCol;
        const dSourceIndex = 0;
        const dOrigLine = m.origLine - lastSourceLine;
        const dOrigCol = m.origCol - lastSourceCol;

        lastGenCol = m.genCol;
        lastSourceLine = m.origLine;
        lastSourceCol = m.origCol;

        return this.encodeVLQ(dGenCol) + this.encodeVLQ(dSourceIndex) + this.encodeVLQ(dOrigLine) + this.encodeVLQ(dOrigCol);
      });
      mappingsStr += segStrs.join(',');
    }

    return {
      code,
      map: {
        version: 3,
        file: sourceFile,
        sources: [sourceFile],
        mappings: mappingsStr,
        names: []
      }
    };
  }

  private encodeVLQ(value: number): string {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let sign = value < 0 ? 1 : 0;
    let abs = Math.abs(value);
    let vlq = (abs << 1) | sign;
    let encoded = '';
    do {
      let digit = vlq & 31;
      vlq >>>= 5;
      if (vlq > 0) {
        digit |= 32;
      }
      encoded += CHARS[digit];
    } while (vlq > 0);
    return encoded;
  }

  generate(node: ASTNode): string {
    if (!node) return '';
    this.record(node);

    const space = this.minified ? '' : ' ';
    const newline = this.minified ? '' : '\n';

    switch (node.type) {
      case NodeType.Program:
        return this.emit(node.body.map((child: any) => this.generate(child)).join(newline));

      case NodeType.ImportDeclaration: {
        const specs = node.specifiers;
        if (specs.length === 0) {
          return this.emit(`import${space}${this.generate(node.source)};`);
        }

        const specStrs = specs.map((spec: any) => {
          if (spec.type === NodeType.ImportDefaultSpecifier) {
            return this.generate(spec.local);
          }
          if (spec.type === NodeType.ImportNamespaceSpecifier) {
            return `*${space}as${space}${this.generate(spec.local)}`;
          }
          const imported = this.generate(spec.imported);
          const local = this.generate(spec.local);
          if (imported === local) return imported;
          return `${imported}${space}as${space}${local}`;
        });

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
            const specifiersPart = nonDefaultSpecs.map((spec: any) => {
              const imported = this.generate(spec.imported);
              const local = this.generate(spec.local);
              if (imported === local) return imported;
              return `${imported}${space}as${space}${local}`;
            }).join(`,${space}`);
            importsPart += `{${space}${specifiersPart}${space}}`;
          }
        }

        return this.emit(`import${space}${importsPart}${space}from${space}${this.generate(node.source)};`);
      }

      case NodeType.ExportNamedDeclaration: {
        // export const x = ... / export function f() {}
        if (node.declaration) {
          const prefix = node.isDefault ? `export${space}default${space}` : `export${space}`;
          return this.emit(`${prefix}${this.generate(node.declaration)}`);
        }
        // export { a, b } or export { a } from 'module'
        if (node.specifiers && node.specifiers.length > 0) {
          const specs = (node.specifiers as any[]).map((s: any) => {
            const local = this.generate(s.local);
            const exported = s.exported ? this.generate(s.exported) : local;
            return local === exported ? local : `${local}${space}as${space}${exported}`;
          }).join(`,${space}`);
          const src = node.source ? `${space}from${space}${this.generate(node.source)}` : '';
          return this.emit(`export${space}{${space}${specs}${space}}${src};`);
        }
        // export default <expr>
        if (node.isDefault) {
          return this.emit(`export${space}default${space}${this.generate(node.expression ?? node.declaration)};`);
        }
        return this.emit('');
      }

      case NodeType.VariableDeclaration: {
        const decls = node.declarations.map((d: any) => this.generate(d)).join(`,${space}`);
        return this.emit(`${node.kind}${space}${decls};`);
      }

      case NodeType.VariableDeclarator: {
        const id = this.generate(node.id);
        const init = node.init ? `${space}=${space}${this.generate(node.init)}` : '';
        return this.emit(`${id}${init}`);
      }

      case NodeType.FunctionDeclaration: {
        const asyncPrefix = node.async ? `async${space}` : '';
        const id = this.generate(node.id);
        const params = node.params.map((p: any) => this.generate(p)).join(`,${space}`);
        const body = this.generate(node.body);
        return this.emit(`${asyncPrefix}function${space}${id}(${params})${space}${body}`);
      }

      case NodeType.BlockStatement: {
        const body = node.body.map((s: any) => this.generate(s)).join(newline);
        if (this.minified) {
          return this.emit(`{${body}}`);
        }
        const indented = body.split('\n').map((line: string) => '  ' + line).join('\n');
        return this.emit(`{\n${indented}\n}`);
      }

      case NodeType.IfStatement: {
        const test = this.generate(node.test);
        const cons = this.generate(node.consequent);
        const alt = node.alternate ? `${space}else${space}${this.generate(node.alternate)}` : '';
        return this.emit(`if${space}(${test})${space}${cons}${alt}`);
      }

      case NodeType.ReturnStatement: {
        const arg = node.argument ? `${space}${this.generate(node.argument)}` : '';
        return this.emit(`return${arg};`);
      }

      case NodeType.ExpressionStatement: {
        return this.emit(`${this.generate(node.expression)};`);
      }

      case NodeType.CallExpression: {
        const callee = this.generate(node.callee);
        const args = node.arguments.map((arg: any) => this.generate(arg)).join(`,${space}`);
        return this.emit(`${callee}(${args})`);
      }

      case NodeType.MemberExpression: {
        const obj = this.generate(node.object);
        const prop = this.generate(node.property);
        return this.emit(`${obj}.${prop}`);
      }

      case NodeType.BinaryExpression: {
        const left = this.generate(node.left);
        const right = this.generate(node.right);
        const op = node.operator === '=>' ? `${space}=>${space}` : `${space}${node.operator}${space}`;
        return this.emit(`${left}${op}${right}`);
      }

      case NodeType.Identifier:
        return this.emit(node.name);

      case NodeType.Literal:
        return this.emit(node.raw !== undefined ? node.raw : JSON.stringify(node.value));

      case 'ObjectExpression': {
        const props = (node.properties as any[]).map((p: any) => {
          // Parser stores as { key: ASTNode, value: ASTNode }
          // External ASTs may use { type: 'Property', key, value }
          const keyNode = p.key ?? p.name;
          const valNode = p.value;
          const key = this.generate(keyNode);
          const val = this.generate(valNode);
          return `${key}:${space}${val}`;
        }).join(`,${space}`);
        return this.emit(`{${space}${props}${space}}`);
      }

      case 'Property': {
        const key = this.generate(node.key);
        const val = this.generate(node.value);
        return this.emit(`${key}:${space}${val}`);
      }

      default:
        return '';
    }
  }
}
