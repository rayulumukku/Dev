import { SvelteCompileResult, SveltePluginOptions } from './types.js';
import { SvelteDescriptorParser } from './Descriptor.js';
import { SvelteDependencyScanner } from './DependencyScanner.js';
import { SvelteCSSProcessor } from './CSSProcessor.js';
import { SvelteHMRInjector } from './HMR.js';
import { SvelteSSRRenderer } from './SSR.js';

export class SvelteCompiler {
  static compile(code: string, id: string, options: SveltePluginOptions = {}): SvelteCompileResult {
    const descriptor = SvelteDescriptorParser.parse(code);
    const dependencies = SvelteDependencyScanner.scan(code);

    if (options.isServer) {
      const ssrCode = SvelteSSRRenderer.compileSSR(descriptor, id);
      return {
        js: { code: ssrCode },
        dependencies,
      };
    }

    const scriptCode = descriptor.script ? descriptor.script.code : '';
    const templateHtml = descriptor.template.code;
    const styleCode = descriptor.style ? descriptor.style.code : '';

    let compiledJS = `
${scriptCode}
export default class Component {
  constructor(options = {}) {
    this.target = options.target;
    this.props = options.props || {};
    this.render();
  }
  render() {
    if (this.target) {
      this.target.innerHTML = ${JSON.stringify(templateHtml)};
    }
  }
}
`;

    if (styleCode) {
      compiledJS += SvelteCSSProcessor.processStyle(styleCode, id);
    }

    compiledJS = SvelteHMRInjector.inject(compiledJS, id);

    return {
      js: {
        code: compiledJS,
        map: { version: 3, sources: [id], mappings: '' },
      },
      css: styleCode ? { code: styleCode } : undefined,
      dependencies,
    };
  }
}
