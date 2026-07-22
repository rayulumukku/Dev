import { SolidCompileResult, SolidPluginOptions } from './types.js';
import { SolidJSXTransform } from './JSXTransform.js';
import { SolidDependencyScanner } from './DependencyScanner.js';
import { SolidHMRInjector } from './HMR.js';
import { SolidSSRRenderer } from './SSR.js';

export class SolidCompiler {
  static compile(code: string, id: string, options: SolidPluginOptions = {}): SolidCompileResult {
    const dependencies = SolidDependencyScanner.scan(code);
    let transformed = SolidJSXTransform.transform(code, id, options.hydratable);

    if (options.generate === 'ssr') {
      transformed = SolidSSRRenderer.compileSSR(transformed, id);
    } else if (options.dev !== false) {
      transformed = SolidHMRInjector.inject(transformed, id);
    }

    return {
      code: transformed,
      map: { version: 3, sources: [id], mappings: '' },
      dependencies,
    };
  }
}
