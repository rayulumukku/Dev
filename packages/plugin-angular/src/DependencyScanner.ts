export class AngularDependencyScanner {
  static scan(code: string): string[] {
    const deps: string[] = [];

    // Scan ES imports
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      deps.push(match[1]);
    }

    // Scan templateUrl references
    const templateUrlRegex = /templateUrl:\s*['"]([^'"]+)['"]/g;
    while ((match = templateUrlRegex.exec(code)) !== null) {
      deps.push(match[1]);
    }

    // Scan lazy-loaded route imports (loadComponent / loadChildren)
    const lazyRegex = /load(?:Component|Children):\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g;
    while ((match = lazyRegex.exec(code)) !== null) {
      deps.push(match[1]);
    }

    return Array.from(new Set(deps));
  }
}
