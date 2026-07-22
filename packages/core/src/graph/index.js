import { ModuleNode } from './moduleNode.js';
export class DependencyGraph {
    modules = new Map();
    getModule(id) {
        return this.modules.get(id);
    }
    registerModule(id, file, url) {
        let node = this.modules.get(id);
        if (!node) {
            node = new ModuleNode(id, file, url);
            this.modules.set(id, node);
        }
        else {
            // Update properties if it was a placeholder
            node.file = file;
            node.url = url;
        }
        return node;
    }
    /**
     * Updates the dependency list for a node.
     * Removes stale edges, creates placeholder nodes if a dependency is untracked,
     * and preserves importer relationships.
     */
    updateDependencies(nodeId, depIds, resolveDepMeta) {
        const node = this.modules.get(nodeId);
        if (!node)
            return;
        // Clean up current dependencies (remove edges where node is the importer)
        for (const oldDep of node.dependencies) {
            oldDep.importers.delete(node);
        }
        node.dependencies.clear();
        // Rebuild dependency links
        for (const depId of depIds) {
            let depNode = this.modules.get(depId);
            if (!depNode) {
                const meta = resolveDepMeta(depId);
                depNode = new ModuleNode(depId, meta.file, meta.url);
                this.modules.set(depId, depNode);
            }
            node.dependencies.add(depNode);
            depNode.importers.add(node);
        }
    }
    getImporters(id) {
        const node = this.modules.get(id);
        if (!node)
            return new Set();
        return new Set(Array.from(node.importers).map((m) => m.id));
    }
    getDependencies(id) {
        const node = this.modules.get(id);
        if (!node)
            return new Set();
        return new Set(Array.from(node.dependencies).map((m) => m.id));
    }
    invalidate(id) {
        const node = this.modules.get(id);
        if (node) {
            node.lastTransformTime = 0;
        }
    }
    /**
     * Serializes the graph to JSON format for diagnostics endpoint.
     */
    toJSON() {
        return {
            modules: Array.from(this.modules.values()).map((m) => ({
                id: m.id,
                url: m.url,
                deps: Array.from(m.dependencies).map((d) => d.id),
                importers: Array.from(m.importers).map((i) => i.id),
            })),
        };
    }
}
//# sourceMappingURL=index.js.map