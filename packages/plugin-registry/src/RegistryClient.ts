import { PluginSearchEngine } from './Search.js';
import { RegistrySearchResult } from './types.js';

export class RegistryClient {
  private searchEngine = new PluginSearchEngine();

  async search(query: string): Promise<RegistrySearchResult[]> {
    return this.searchEngine.search(query);
  }

  async getPluginDetails(name: string): Promise<RegistrySearchResult | null> {
    const results = await this.search(name);
    return results.find(r => r.name === name) || null;
  }
}
