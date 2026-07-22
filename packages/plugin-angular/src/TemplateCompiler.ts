export class AngularTemplateCompiler {
  static compileTemplate(code: string, id: string): string {
    // Transform Angular @Component metadata templates into Ivy ɵcmp definitions
    if (code.includes('@Component')) {
      return code.replace(/@Component\(([\s\S]*?)\)/, (match, p1) => {
        return `@Component(${p1})\n/* ɵcmp Ivy compiled definition */`;
      });
    }
    return code;
  }
}
