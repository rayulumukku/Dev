import { APIManifest, APISymbol } from './types.js';

export class APIScanner {
  static scanPackage(packageName: string, exportsList: string[]): APIManifest {
    const symbols: APISymbol[] = exportsList.map(name => {
      let kind: APISymbol['kind'] = 'function';
      if (name.startsWith('I') || name.endsWith('Type') || name.endsWith('Config')) kind = 'interface';
      else if (name[0] === name[0].toUpperCase() && !name.startsWith('use')) kind = 'class';

      return {
        name,
        kind,
        stability: name.startsWith('_') ? 'internal' : name.includes('Experimental') ? 'experimental' : 'public',
        signature: `export function ${name}(): void;`,
      };
    });

    return {
      packageName,
      symbols,
      scannedAt: Date.now(),
    };
  }
}
