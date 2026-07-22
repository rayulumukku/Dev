function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export class DescriptorCache {
  constructor() {
    this.cache = new Map();
  }

  get(filename) {
    return this.cache.get(filename);
  }

  set(filename, descriptor) {
    const templateHash = simpleHash(descriptor.template?.content || '');
    const scriptHash = simpleHash(descriptor.script?.content || '');
    const styleHash = simpleHash(descriptor.styles.map((s) => s.content).join('\n'));
    const customBlockHash = simpleHash(descriptor.customBlocks.map((c) => c.content).join('\n'));

    const prev = this.cache.get(filename);
    const entry = {
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

  clear() {
    this.cache.clear();
  }
}

export const globalDescriptorCache = new DescriptorCache();
