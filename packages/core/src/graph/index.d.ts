import { ModuleNode } from './moduleNode.js';
export declare class DependencyGraph {
    modules: Map<string, ModuleNode>;
    getModule(id: string): ModuleNode | undefined;
    registerModule(id: string, file: string, url: string): ModuleNode;
    /**
     * Updates the dependency list for a node.
     * Removes stale edges, creates placeholder nodes if a dependency is untracked,
     * and preserves importer relationships.
     */
    updateDependencies(nodeId: string, depIds: Set<string>, resolveDepMeta: (depId: string) => {
        file: string;
        url: string;
    }): void;
    getImporters(id: string): Set<string>;
    getDependencies(id: string): Set<string>;
    invalidate(id: string): void;
    /**
     * Serializes the graph to JSON format for diagnostics endpoint.
     */
    toJSON(): {
        modules: {
            id: string;
            url: string;
            deps: string[];
            importers: string[];
        }[];
    };
}
//# sourceMappingURL=index.d.ts.map