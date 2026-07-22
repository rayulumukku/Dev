import { APIDiff, APIManifest } from './types.js';
import { SignatureComparator } from './SignatureComparator.js';

export class CompatibilityChecker {
  static diffManifests(oldManifest: APIManifest, newManifest: APIManifest): APIDiff {
    const oldMap = new Map(oldManifest.symbols.map(s => [s.name, s]));
    const newMap = new Map(newManifest.symbols.map(s => [s.name, s]));

    const added = newManifest.symbols.filter(s => !oldMap.has(s.name));
    const removed = oldManifest.symbols.filter(s => !newMap.has(s.name));
    const modified: APIDiff['modified'] = [];

    for (const [name, oldSym] of oldMap.entries()) {
      const newSym = newMap.get(name);
      if (newSym && oldSym.signature !== newSym.signature) {
        const severity = SignatureComparator.compare(oldSym, newSym);
        modified.push({
          symbol: newSym,
          oldSignature: oldSym.signature,
          newSignature: newSym.signature,
          severity,
        });
      }
    }

    return {
      packageName: newManifest.packageName,
      added,
      removed,
      modified,
    };
  }
}
