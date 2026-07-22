export interface OptionDoc {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export class ConfigProvider {
  private configDocs: OptionDoc[] = [
    { name: 'mode', type: "'development' | 'production'", default: "'development'", description: 'Compilation and execution mode targeting dev HMR or production minification.' },
    { name: 'plugins', type: 'RayPlugin[]', default: '[]', description: 'Array of Ray bundler plugins.' },
    { name: 'build.outDir', type: 'string', default: "'dist'", description: 'Output directory for production build artifacts.' },
    { name: 'build.minify', type: 'boolean', default: 'true', description: 'Enable production code minification and tree shaking.' },
    { name: 'build.sourcemap', type: "boolean | 'external' | 'inline'", default: "'external'", description: 'Generate source maps for build outputs.' },
    { name: 'build.lib', type: 'LibraryConfig', description: 'Configure reusable package Library Mode build outputs.' },
    { name: 'build.incremental', type: 'boolean', default: 'false', description: 'Enable production incremental build engine.' },
    { name: 'build.validateOutputs', type: 'boolean', default: 'true', description: 'Validate incremental output hashes against clean builds.' },
  ];

  getConfigOptions(): OptionDoc[] {
    return this.configDocs;
  }

  getOptionDoc(name: string): OptionDoc | null {
    return this.configDocs.find(c => c.name === name) || null;
  }
}
