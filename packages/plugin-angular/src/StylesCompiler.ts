export class AngularStylesCompiler {
  static processComponentStyles(code: string, id: string): string {
    const styleUrlRegex = /styleUrls:\s*\[(.*?)\]/g;
    return code.replace(styleUrlRegex, (match, p1) => {
      return `styleUrls: [${p1}] /* processed by Ray CSS pipeline */`;
    });
  }
}
