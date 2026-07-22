import { AngularCompileResult, AngularPluginOptions } from './types.js';
import { AngularTemplateCompiler } from './TemplateCompiler.js';
import { AngularStylesCompiler } from './StylesCompiler.js';
import { AngularDependencyScanner } from './DependencyScanner.js';
import { AngularHMRInjector } from './HMR.js';
import { AngularSSRRenderer } from './SSR.js';

export class AngularCompiler {
  static compile(code: string, id: string, options: AngularPluginOptions = {}): AngularCompileResult {
    const dependencies = AngularDependencyScanner.scan(code);
    let compiled = AngularTemplateCompiler.compileTemplate(code, id);
    compiled = AngularStylesCompiler.processComponentStyles(compiled, id);

    if (options.isServer) {
      compiled = AngularSSRRenderer.compileSSR(compiled, id);
    } else {
      compiled = AngularHMRInjector.inject(compiled, id);
    }

    return {
      code: compiled,
      map: { version: 3, sources: [id], mappings: '' },
      dependencies,
    };
  }
}
