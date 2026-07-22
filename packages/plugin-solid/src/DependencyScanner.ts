export class SolidDependencyScanner {
  static scan(code: string): string[] {
    const deps: string[] = [];
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      deps.push(match[1]);
    }

    return Array.from(new Set(deps));
  }
}
