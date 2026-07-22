export class RuntimeRegistry {
    static adapters = new Map();
    static registerAdapter(adapter) {
        this.adapters.set(adapter.name, adapter);
    }
    static getAdapter(name) {
        return this.adapters.get(name);
    }
    static getAdapters() {
        return Array.from(this.adapters.values());
    }
    static resolveActiveAdapters(id) {
        if (!id)
            return this.getAdapters();
        const matched = this.getAdapters().filter(adapter => {
            if (id.endsWith('.svelte') && adapter.name.includes('svelte'))
                return true;
            if ((id.endsWith('.jsx') || id.endsWith('.tsx') || id.endsWith('.solid.tsx')) && adapter.name.includes('solid'))
                return true;
            if ((id.endsWith('.ts') || id.endsWith('.html')) && adapter.name.includes('angular'))
                return true;
            if (id.endsWith('.vue') && adapter.name.includes('vue'))
                return true;
            if (adapter.name.includes('react') && (id.endsWith('.jsx') || id.endsWith('.tsx')))
                return true;
            return false;
        });
        return matched.length > 0 ? matched : this.getAdapters();
    }
    static clear() {
        this.adapters.clear();
    }
}
//# sourceMappingURL=RuntimeRegistry.js.map