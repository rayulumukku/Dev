import { RegistrySearchResult } from './types.js';

export class PluginSearchEngine {
  private catalog: RegistrySearchResult[] = [
    { name: '@ray/plugin-mdx', version: '1.0.0', description: 'Official Ray MDX compilation plugin.', author: 'Ray Core Team', keywords: ['mdx', 'markdown', 'jsx'], popularityScore: 100 },
    { name: '@ray/plugin-analyzer', version: '1.0.0', description: 'Official Ray interactive bundle analyzer plugin.', author: 'Ray Core Team', keywords: ['analyzer', 'bundle', 'treemap'], popularityScore: 95 },
    { name: '@ray/plugin-vue', version: '1.0.0', description: 'Official Ray Vue 3 SFC compilation plugin.', author: 'Ray Core Team', keywords: ['vue', 'sfc'], popularityScore: 90 },
    { name: '@ray/plugin-svelte', version: '1.0.0', description: 'Official Ray Svelte compilation plugin.', author: 'Ray Core Team', keywords: ['svelte'], popularityScore: 85 },
    { name: '@ray/plugin-solid', version: '1.0.0', description: 'Official Ray SolidJS compilation plugin.', author: 'Ray Core Team', keywords: ['solid', 'jsx'], popularityScore: 80 },
  ];

  search(query: string): RegistrySearchResult[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.catalog;

    return this.catalog.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.keywords.some(k => k.toLowerCase().includes(q)) ||
      p.author.toLowerCase().includes(q)
    );
  }

  registerPlugin(plugin: RegistrySearchResult) {
    this.catalog.push(plugin);
  }
}
