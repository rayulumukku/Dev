import { SFCDescriptor } from '../types.js';

export interface SFCDescriptorCacheEntry {
  descriptor: SFCDescriptor;
  templateHash: string;
  scriptHash: string;
  styleHash: string;
  customBlockHash: string;
  timestamp: number;
}

export type UpdateType = 'template-only' | 'style-only' | 'script-only' | 'multiple';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export class DescriptorCache {
  private cache = new Map<string, SFCDescriptorCacheEntry>();

  get(filename: string): SFCDescriptorCacheEntry | undefined {
    return this.cache.get(filename);
  }

  set(filename: string, descriptor: SFCDescriptor): { type: UpdateType; entry: SFCDescriptorCacheEntry } {
    const templateHash = simpleHash(descriptor.template?.content || '');
    const scriptHash = simpleHash(descriptor.script?.content || '');
    const styleHash = simpleHash(descriptor.styles.map((s) => s.content).join('\n'));
    const customBlockHash = simpleHash(descriptor.customBlocks.map((c) => c.content).join('\n'));

    const prev = this.cache.get(filename);
    const entry: SFCDescriptorCacheEntry = {
      descriptor,
      templateHash,
      scriptHash,
      styleHash,
      customBlockHash,
      timestamp: Date.now(),
    };

    this.cache.set(filename, entry);

    if (!prev) {
      return { type: 'multiple', entry };
    }

    const templateChanged = prev.templateHash !== templateHash;
    const scriptChanged = prev.scriptHash !== scriptHash;
    const styleChanged = prev.styleHash !== styleHash;

    if (templateChanged && !scriptChanged && !styleChanged) {
      return { type: 'template-only', entry };
    }
    if (styleChanged && !scriptChanged && !templateChanged) {
      return { type: 'style-only', entry };
    }
    if (scriptChanged && !templateChanged && !styleChanged) {
      return { type: 'script-only', entry };
    }
    return { type: 'multiple', entry };
  }

  clear(): void {
    this.cache.clear();
  }
}

export const globalDescriptorCache = new DescriptorCache();
