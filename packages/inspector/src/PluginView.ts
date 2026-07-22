export class PluginView {
  static formatPlugins(plugins: { name: string; durationMs: number }[]): Record<string, any> {
    return {
      activeCount: plugins.length,
      plugins,
    };
  }
}
