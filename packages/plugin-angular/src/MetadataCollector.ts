export class AngularMetadataCollector {
  static collect(code: string): { selector?: string; standalone?: boolean } {
    const selectorMatch = code.match(/selector:\s*['"]([^'"]+)['"]/);
    const standaloneMatch = code.match(/standalone:\s*(true|false)/);

    return {
      selector: selectorMatch ? selectorMatch[1] : undefined,
      standalone: standaloneMatch ? standaloneMatch[1] === 'true' : true,
    };
  }
}
