import { Location, Position } from './types.js';
import { ImportResolver } from './ImportResolver.js';

export class DefinitionProvider {
  private importResolver: ImportResolver;

  constructor(projectRoot: string) {
    this.importResolver = new ImportResolver(projectRoot);
  }

  getDefinition(uri: string, position: Position, content: string): Location | null {
    const lines = content.split('\n');
    const lineText = lines[position.line] || '';
    const match = /(?:import|from)\s+['"]([^'"]+)['"]/.exec(lineText);

    if (match) {
      const impPath = match[1];
      const resolved = this.importResolver.resolveImport(impPath, uri);
      if (resolved) {
        return {
          uri: resolved,
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        };
      }
    }

    return null;
  }
}
