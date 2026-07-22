import { EdgeCapabilities } from './types.js';

export class RuntimeCapabilities {
  static analyzeCode(sourceCode: string): EdgeCapabilities {
    const unsupportedNodeBuiltins = ['fs', 'net', 'tls', 'child_process', 'dgram'];
    const detectedUnsupported: string[] = [];

    for (const mod of unsupportedNodeBuiltins) {
      if (
        sourceCode.includes(`require('${mod}')`) ||
        sourceCode.includes(`require("${mod}")`) ||
        sourceCode.includes(`from '${mod}'`) ||
        sourceCode.includes(`from "${mod}"`) ||
        sourceCode.includes(`node:${mod}`)
      ) {
        detectedUnsupported.push(mod);
      }
    }

    return {
      streams: true,
      fetch: true,
      webCrypto: true,
      unsupportedNodeModules: detectedUnsupported,
    };
  }
}
