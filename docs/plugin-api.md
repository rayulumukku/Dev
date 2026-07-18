# Plugin API

Extend Ray's behavior by implementing custom plugins.

## Interface
```typescript
export interface RayPlugin {
  name: string;
  configResolved?(config: any): void | Promise<void>;
  buildStart?(): void | Promise<void>;
  resolveId?(id: string, importer?: string): string | null | Promise<string | null>;
  load?(id: string): string | null | Promise<string | null>;
  transform?(code: string, id: string): { code: string; map?: any } | null | Promise<{ code: string; map?: any } | null>;
  buildEnd?(): void | Promise<void>;
}
```
