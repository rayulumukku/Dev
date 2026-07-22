import { RSCCompileResult, RSCOptions } from './types.js';
import { BoundaryResolver } from './BoundaryResolver.js';

export class RSCCompiler {
  static compile(code: string, id: string, options: RSCOptions = {}): RSCCompileResult {
    const boundary = BoundaryResolver.resolveBoundary(code);

    let transformedCode = code;

    if (boundary === 'client') {
      // In RSC client component proxying, exports are wrapped into Client References ($id)
      transformedCode = `
/* Ray RSC Client Reference Proxy */
import { createClientReference } from '@ray/react-server';
${code}
export const __rsc_client_ref__ = createClientReference(${JSON.stringify(id)});
`;
    }

    return {
      code: transformedCode,
      boundary,
      map: { version: 3, sources: [id], mappings: '' },
      dependencies: [],
    };
  }
}

export function createClientReference(id: string) {
  return {
    $$typeof: Symbol.for('react.client.reference'),
    filepath: id,
    name: 'default',
  };
}
