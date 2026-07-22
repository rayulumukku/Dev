export interface RayPluginManifest {
  name: string;
  version: string;
  sdk: string;
  description?: string;
  author?: string;
  keywords?: string[];
  hooks?: string[];
  dependencies?: Record<string, string>;
  ray: {
    minimum: string;
    recommended?: string;
  };
}

export interface RegistrySearchResult {
  name: string;
  version: string;
  description: string;
  author: string;
  keywords: string[];
  popularityScore: number;
}

export interface IntegrityCheckResult {
  valid: boolean;
  checksum: string;
  errors: string[];
  warnings: string[];
}
