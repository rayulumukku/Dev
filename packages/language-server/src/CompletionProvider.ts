import { CompletionItem, CompletionItemKind, Position } from './types.js';
import { ConfigProvider } from './ConfigProvider.js';

export class CompletionProvider {
  private configProvider = new ConfigProvider();

  getCompletions(uri: string, position: Position, content: string): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // Ray config options completion
    if (uri.endsWith('ray.config.ts') || uri.endsWith('ray.config.js')) {
      const options = this.configProvider.getConfigOptions();
      for (const opt of options) {
        completions.push({
          label: opt.name,
          kind: CompletionItemKind.Property,
          detail: opt.type,
          documentation: opt.description,
          insertText: `${opt.name}: `,
        });
      }

      // Built-in plugin completions
      const plugins = ['mdx()', 'analyzer()', 'vue()', 'svelte()', 'solid()', 'css()', 'banner()', 'importAlias()'];
      for (const p of plugins) {
        completions.push({
          label: p,
          kind: CompletionItemKind.Function,
          detail: 'Official Ray Plugin',
          documentation: `Official Ray ${p} plugin.`,
        });
      }
    }

    return completions;
  }
}
