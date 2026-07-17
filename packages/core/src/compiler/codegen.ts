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

    const s = this.minified ? '' : ' ';
    const nl = this.minified ? '' : '\n';

    switch (node.type) {
      case NodeType.Program:
        return this.emit(node.body.map((child: any) => this.generate(child)).join(nl));

      // ── Imports ──────────────────────────────────────────────────────────
      case NodeType.ImportDeclaration: {
        if (node._tsTypeOnly) return '';
        const specs = node.specifiers;
        const srcStr = this.generate(node.source);
        const attrStr = this.generateImportAttributes(node.attributes);

        if (specs.length === 0) {
          return this.emit(`import${s}${srcStr}${attrStr};`);
        }

        const defaultSpec = specs.find((s: any) => s.type === NodeType.ImportDefaultSpecifier);
        const nsSpec = specs.find((s: any) => s.type === NodeType.ImportNamespaceSpecifier);
        const namedSpecs = specs.filter((s: any) => s.type === NodeType.ImportSpecifier);

        let importsPart = '';
        if (defaultSpec) {
          importsPart += this.generate(defaultSpec.local);
          if (nsSpec || namedSpecs.length > 0) importsPart += `,${s}`;
        }
        if (nsSpec) {
          importsPart += `*${s}as${s}${this.generate(nsSpec.local)}`;
        }
        if (namedSpecs.length > 0) {
          const specParts = namedSpecs.map((spec: any) => {
            const imported = this.generate(spec.imported);
            const local = this.generate(spec.local);
            return imported === local ? imported : `${imported}${s}as${s}${local}`;
          }).join(`,${s}`);
          importsPart += `{${s}${specParts}${s}}`;
        }

        return this.emit(`import${s}${importsPart}${s}from${s}${srcStr}${attrStr};`);
      }

      case NodeType.ImportExpression: {
        const src = this.generate(node.source);
        if (node.attributes) {
          return this.emit(`import(${src},${s}${this.generate(node.attributes)})`);
        }
        return this.emit(`import(${src})`);
      }

      // ── Exports ─────────────────────────────────────────────────────────
      case NodeType.ExportNamedDeclaration: {
        if (node._tsTypeOnly) return '';
        // export { a, b } [from '...']
        if (node.specifiers && node.specifiers.length > 0 && !node.declaration) {
          const specs = (node.specifiers as any[]).map((sp: any) => {
            const local = this.generate(sp.local);
            const exported = sp.exported ? this.generate(sp.exported) : local;
            return local === exported ? local : `${local}${s}as${s}${exported}`;
          }).join(`,${s}`);
          const src = node.source ? `${s}from${s}${this.generate(node.source)}` : '';
          const attrStr = this.generateImportAttributes(node.attributes);
          return this.emit(`export${s}{${s}${specs}${s}}${src}${attrStr};`);
        }
        if (node.declaration) {
          const prefix = node.isDefault ? `export${s}default${s}` : `export${s}`;
          const decl = this.generate(node.declaration);
          // Don't add extra semicolon if declaration already ends with }
          const needsSemicolon = node.isDefault && !decl.trimEnd().endsWith('}');
          return this.emit(`${prefix}${decl}${needsSemicolon ? ';' : ''}`);
        }
        if (node.isDefault) {
          return this.emit(`export${s}default${s}${this.generate(node.expression ?? node.declaration)};`);
        }
        return this.emit('');
      }

      case NodeType.ExportAllDeclaration: {
        const exported = node.exported ? `${s}as${s}${this.generate(node.exported)}` : '';
        const attrStr = this.generateImportAttributes(node.attributes);
        return this.emit(`export${s}*${exported}${s}from${s}${this.generate(node.source)}${attrStr};`);
      }

      // ── Variable Declarations ──────────────────────────────────────────
      case NodeType.VariableDeclaration: {
        const decls = node.declarations.map((d: any) => this.generate(d)).join(`,${s}`);
        return this.emit(`${node.kind}${s}${decls};`);
      }

      case NodeType.VariableDeclarator: {
        const id = this.generate(node.id);
        const init = node.init ? `${s}=${s}${this.generate(node.init)}` : '';
        return this.emit(`${id}${init}`);
      }

      case NodeType.UsingDeclaration: {
        const prefix = node.await ? 'await using' : 'using';
        const decls = node.declarations.map((d: any) => this.generate(d)).join(`,${s}`);
        return this.emit(`${prefix}${s}${decls};`);
      }

      // ── Functions ──────────────────────────────────────────────────────
      case NodeType.FunctionDeclaration: {
        const asyncPrefix = node.async ? `async${s}` : '';
        const genStar = node.generator ? '*' : '';
        const id = node.id ? this.generate(node.id) : '';
        const params = node.params.map((p: any) => this.generate(p)).join(`,${s}`);
        const body = this.generate(node.body);
        return this.emit(`${asyncPrefix}function${genStar}${s}${id}(${params})${s}${body}`);
      }

      case NodeType.ArrowFunctionExpression: {
        const asyncPrefix = node.async ? `async${s}` : '';
        const params = node.params.length === 1 && node.params[0].type === NodeType.Identifier
          ? this.generate(node.params[0])
          : `(${node.params.map((p: any) => this.generate(p)).join(`,${s}`)})`;
        const body = node.expression
          ? this.generate(node.body)
          : this.generate(node.body);
        return this.emit(`${asyncPrefix}${params}${s}=>${s}${body}`);
      }

      // ── Classes ────────────────────────────────────────────────────────
      case NodeType.ClassDeclaration: {
        let out = '';
        if (node.decorators) {
          for (const dec of node.decorators) {
            out += this.generate(dec) + nl;
          }
        }
        out += 'class';
        if (node.id && node.id.name) out += `${s}${this.generate(node.id)}`;
        if (node.superClass) out += `${s}extends${s}${this.generate(node.superClass)}`;
        out += `${s}${this.generate(node.body)}`;
        return this.emit(out);
      }

      case NodeType.ClassBody: {
        const members = node.body.map((m: any) => this.generate(m)).join(nl);
        if (this.minified) return this.emit(`{${members}}`);
        const indented = members.split('\n').map((line: string) => '  ' + line).join('\n');
        return this.emit(`{\n${indented}\n}`);
      }

      case NodeType.MethodDefinition: {
        let out = '';
        if (node.decorators) {
          for (const dec of node.decorators) {
            out += this.generate(dec) + nl;
          }
        }
        if (node.static) out += `static${s}`;
        if (node.kind === 'get') out += `get${s}`;
        if (node.kind === 'set') out += `set${s}`;
        if (node.value?.async) out += `async${s}`;
        if (node.value?.generator) out += '*';
        if (node.computed) {
          out += `[${this.generate(node.key)}]`;
        } else {
          out += this.generate(node.key);
        }
        const params = node.value?.params?.map((p: any) => this.generate(p)).join(`,${s}`) ?? '';
        const body = this.generate(node.value?.body);
        return this.emit(`${out}(${params})${s}${body}`);
      }

      case NodeType.PropertyDefinition: {
        let out = '';
        if (node.decorators) {
          for (const dec of node.decorators) {
            out += this.generate(dec) + nl;
          }
        }
        if (node.static) out += `static${s}`;
        if (node.computed) {
          out += `[${this.generate(node.key)}]`;
        } else {
          out += this.generate(node.key);
        }
        if (node.value) out += `${s}=${s}${this.generate(node.value)}`;
        out += ';';
        return this.emit(out);
      }

      case NodeType.Decorator: {
        return this.emit(`@${this.generate(node.expression)}`);
      }

      // ── Control Flow ──────────────────────────────────────────────────
      case NodeType.BlockStatement: {
        const body = node.body.map((stmt: any) => this.generate(stmt)).join(nl);
        if (this.minified) return this.emit(`{${body}}`);
        const indented = body.split('\n').map((line: string) => '  ' + line).join('\n');
        return this.emit(`{\n${indented}\n}`);
      }

      case NodeType.IfStatement: {
        const test = this.generate(node.test);
        const cons = this.generate(node.consequent);
        const alt = node.alternate ? `${s}else${s}${this.generate(node.alternate)}` : '';
        return this.emit(`if${s}(${test})${s}${cons}${alt}`);
      }

      case NodeType.ForStatement: {
        const init = node.init ? this.generate(node.init).replace(/;$/, '') : '';
        const test = node.test ? this.generate(node.test) : '';
        const update = node.update ? this.generate(node.update) : '';
        const body = this.generate(node.body);
        return this.emit(`for${s}(${init};${s}${test};${s}${update})${s}${body}`);
      }

      case NodeType.ForInStatement: {
        const left = this.generate(node.left).replace(/;$/, '');
        const right = this.generate(node.right);
        const body = this.generate(node.body);
        return this.emit(`for${s}(${left}${s}in${s}${right})${s}${body}`);
      }

      case NodeType.ForOfStatement: {
        const awaitStr = node.await ? `${s}await` : '';
        const left = this.generate(node.left).replace(/;$/, '');
        const right = this.generate(node.right);
        const body = this.generate(node.body);
        return this.emit(`for${awaitStr}${s}(${left}${s}of${s}${right})${s}${body}`);
      }

      case NodeType.WhileStatement: {
        const test = this.generate(node.test);
        const body = this.generate(node.body);
        return this.emit(`while${s}(${test})${s}${body}`);
      }

      case NodeType.DoWhileStatement: {
        const body = this.generate(node.body);
        const test = this.generate(node.test);
        return this.emit(`do${s}${body}${s}while${s}(${test});`);
      }

      case NodeType.SwitchStatement: {
        const disc = this.generate(node.discriminant);
        const cases = node.cases.map((c: any) => this.generate(c)).join(nl);
        if (this.minified) return this.emit(`switch(${disc}){${cases}}`);
        const indented = cases.split('\n').map((line: string) => '  ' + line).join('\n');
        return this.emit(`switch${s}(${disc})${s}{\n${indented}\n}`);
      }

      case NodeType.SwitchCase: {
        const header = node.test ? `case${s}${this.generate(node.test)}:` : 'default:';
        const body = node.consequent.map((c: any) => this.generate(c)).join(nl);
        if (this.minified) return this.emit(`${header}${body}`);
        const indented = body.split('\n').map((line: string) => '  ' + line).join('\n');
        return this.emit(`${header}\n${indented}`);
      }

      case NodeType.TryStatement: {
        const block = this.generate(node.block);
        const handler = node.handler ? `${s}${this.generate(node.handler)}` : '';
        const finalizer = node.finalizer ? `${s}finally${s}${this.generate(node.finalizer)}` : '';
        return this.emit(`try${s}${block}${handler}${finalizer}`);
      }

      case NodeType.CatchClause: {
        const param = node.param ? `${s}(${this.generate(node.param)})` : '';
        const body = this.generate(node.body);
        return this.emit(`catch${param}${s}${body}`);
      }

      case NodeType.ThrowStatement: {
        return this.emit(`throw${s}${this.generate(node.argument)};`);
      }

      case NodeType.ReturnStatement: {
        const arg = node.argument ? `${s}${this.generate(node.argument)}` : '';
        return this.emit(`return${arg};`);
      }

      case NodeType.BreakStatement: {
        const label = node.label ? `${s}${this.generate(node.label)}` : '';
        return this.emit(`break${label};`);
      }

      case NodeType.ContinueStatement: {
        const label = node.label ? `${s}${this.generate(node.label)}` : '';
        return this.emit(`continue${label};`);
      }

      // ── Expressions ────────────────────────────────────────────────────
      case NodeType.ExpressionStatement:
        return this.emit(`${this.generate(node.expression)};`);

      case NodeType.AssignmentExpression: {
        const left = this.generate(node.left);
        const right = this.generate(node.right);
        return this.emit(`${left}${s}${node.operator}${s}${right}`);
      }

      case NodeType.ConditionalExpression: {
        const test = this.generate(node.test);
        const cons = this.generate(node.consequent);
        const alt = this.generate(node.alternate);
        return this.emit(`${test}${s}?${s}${cons}${s}:${s}${alt}`);
      }

      case NodeType.LogicalExpression:
      case NodeType.BinaryExpression: {
        const left = this.generate(node.left);
        const right = this.generate(node.right);
        return this.emit(`${left}${s}${node.operator}${s}${right}`);
      }

      case NodeType.UnaryExpression: {
        const arg = this.generate(node.argument);
        // Keywords like typeof, void, delete need a space
        if (/[a-z]/.test(node.operator)) {
          return node.prefix
            ? this.emit(`${node.operator}${s}${arg}`)
            : this.emit(`${arg}${s}${node.operator}`);
        }
        return node.prefix
          ? this.emit(`${node.operator}${arg}`)
          : this.emit(`${arg}${node.operator}`);
      }

      case NodeType.UpdateExpression: {
        const arg = this.generate(node.argument);
        return node.prefix
          ? this.emit(`${node.operator}${arg}`)
          : this.emit(`${arg}${node.operator}`);
      }

      case NodeType.AwaitExpression:
        return this.emit(`await${s}${this.generate(node.argument)}`);

      case NodeType.YieldExpression: {
        const delegate = node.delegate ? '*' : '';
        const arg = node.argument ? `${s}${this.generate(node.argument)}` : '';
        return this.emit(`yield${delegate}${arg}`);
      }

      case NodeType.CallExpression: {
        const callee = this.generate(node.callee);
        const args = node.arguments.map((arg: any) => this.generate(arg)).join(`,${s}`);
        return this.emit(`${callee}(${args})`);
      }

      case NodeType.NewExpression: {
        const callee = this.generate(node.callee);
        const args = node.arguments.map((arg: any) => this.generate(arg)).join(`,${s}`);
        return this.emit(`new${s}${callee}(${args})`);
      }

      case NodeType.MemberExpression: {
        const obj = this.generate(node.object);
        if (node.computed) {
          const prop = this.generate(node.property);
          return this.emit(`${obj}[${prop}]`);
        }
        const prop = this.generate(node.property);
        return this.emit(`${obj}.${prop}`);
      }

      case NodeType.OptionalMemberExpression: {
        const obj = this.generate(node.object);
        if (node.computed) {
          return this.emit(`${obj}?.[${this.generate(node.property)}]`);
        }
        return this.emit(`${obj}?.${this.generate(node.property)}`);
      }

      case NodeType.OptionalCallExpression: {
        const callee = this.generate(node.callee);
        const args = node.arguments.map((a: any) => this.generate(a)).join(`,${s}`);
        return this.emit(`${callee}?.(${args})`);
      }

      case NodeType.SequenceExpression: {
        return this.emit(node.expressions.map((e: any) => this.generate(e)).join(`,${s}`));
      }

      case NodeType.SpreadElement: {
        return this.emit(`...${this.generate(node.argument)}`);
      }

      case NodeType.RestElement: {
        return this.emit(`...${this.generate(node.argument)}`);
      }

      // ── Literals & Identifiers ──────────────────────────────────────────
      case NodeType.Identifier:
        return this.emit(node.name);

      case NodeType.PrivateIdentifier:
        return this.emit(node.name);

      case NodeType.Literal:
        return this.emit(node.raw !== undefined ? node.raw : JSON.stringify(node.value));

      // ── Template Literals ──────────────────────────────────────────────
      case NodeType.TemplateLiteral: {
        let out = '`';
        for (let i = 0; i < node.quasis.length; i++) {
          out += node.quasis[i].value.raw;
          if (i < node.expressions.length) {
            out += '${' + this.generate(node.expressions[i]) + '}';
          }
        }
        out += '`';
        return this.emit(out);
      }

      case NodeType.TaggedTemplateExpression: {
        const tag = this.generate(node.tag);
        const quasi = this.generate(node.quasi);
        return this.emit(`${tag}${quasi}`);
      }

      case NodeType.TemplateElement:
        return this.emit(node.value.raw);

      // ── Arrays & Objects ──────────────────────────────────────────────
      case NodeType.ArrayExpression: {
        const elems = (node.elements as any[]).map((e: any) => e ? this.generate(e) : '').join(`,${s}`);
        return this.emit(`[${elems}]`);
      }

      case NodeType.ObjectExpression: {
        if (!node.properties || node.properties.length === 0) {
          return this.emit('{}');
        }
        const props = (node.properties as any[]).map((p: any) => {
          if (p.type === NodeType.SpreadElement) return this.generate(p);
          return this.generate(p);
        }).join(`,${s}`);
        return this.emit(`{${s}${props}${s}}`);
      }

      case NodeType.Property: {
        let key = node.computed ? `[${this.generate(node.key)}]` : this.generate(node.key);
        if (!node.computed && typeof key === 'string' && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
          key = JSON.stringify(key);
        }

        if (node.method) {
          const asyncStr = node.value?.async ? `async${s}` : '';
          const genStr = node.value?.generator ? '*' : '';
          const params = node.value?.params?.map((p: any) => this.generate(p)).join(`,${s}`) ?? '';
          const body = this.generate(node.value?.body);
          const kindPrefix = node.kind === 'get' ? `get${s}` : node.kind === 'set' ? `set${s}` : '';
          return this.emit(`${kindPrefix}${asyncStr}${genStr}${key}(${params})${s}${body}`);
        }
        if (node.shorthand) {
          const val = this.generate(node.value);
          // If shorthand with default: x = 5
          if (node.value.type === NodeType.AssignmentPattern) {
            return this.emit(val);
          }
          return this.emit(val);
        }
        const val = this.generate(node.value);
        return this.emit(`${key}:${s}${val}`);
      }

      // ── Destructuring Patterns ─────────────────────────────────────────
      case NodeType.ObjectPattern: {
        const props = (node.properties as any[]).map((p: any) => this.generate(p)).join(`,${s}`);
        return this.emit(`{${s}${props}${s}}`);
      }

      case NodeType.ArrayPattern: {
        const elems = (node.elements as any[]).map((e: any) => e ? this.generate(e) : '').join(`,${s}`);
        return this.emit(`[${elems}]`);
      }

      case NodeType.AssignmentPattern: {
        return this.emit(`${this.generate(node.left)}${s}=${s}${this.generate(node.right)}`);
      }

      default:
        return '';
    }
  }

  private generateImportAttributes(attrs: ASTNode[] | undefined): string {
    if (!attrs || attrs.length === 0) return '';
    const s = this.minified ? '' : ' ';
    const parts = attrs.map((a: any) => `${a.key.name}:${s}${a.value.raw}`).join(`,${s}`);
    return `${s}with${s}{${s}${parts}${s}}`;
  }
}
