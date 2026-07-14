import { RayPlugin } from '../index.js';
import path from 'path';

/**
 * Official Ray plugin for WebAssembly files.
 * Provides streaming instantiations falling back to ArrayBuffer compilations.
 */
export function wasmPlugin(): RayPlugin {
  return {
    name: '@ray/plugin-wasm',

    async transform(code, id) {
      if (!id.endsWith('.wasm')) return null;

      const cleanId = id.split('?')[0];
      const relPath = '/' + path.relative(this.projectRoot, cleanId).replace(/\\/g, '/');

      const componentCode = `
export default async function loadWasm(imports = {}) {
  const response = await fetch(${JSON.stringify(relPath)});
  if (WebAssembly.instantiateStreaming) {
    const { instance } = await WebAssembly.instantiateStreaming(response, imports);
    return instance.exports;
  } else {
    const binary = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(binary, imports);
    return instance.exports;
  }
}
`;
      return { code: componentCode };
    },
  };
}
