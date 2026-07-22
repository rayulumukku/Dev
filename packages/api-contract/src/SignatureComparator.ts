import { ChangeSeverity, APISymbol } from './types.js';

export class SignatureComparator {
  static compare(oldSym: APISymbol, newSym: APISymbol): ChangeSeverity {
    if (oldSym.signature === newSym.signature) return 'patch-safe';
    if (oldSym.stability === 'experimental') return 'minor-safe';
    return 'major-required';
  }
}
