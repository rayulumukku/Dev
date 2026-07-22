import { PluginContext } from './PluginContext.js';

export interface RayPlugin {
  name: string;
  enforce?: 'pre' | 'post';

  resolveId?(
    this: PluginContext,
    id: string,
    importer?: string
  ): Promise<string | null> | string | null;

  load?(
    this: PluginContext,
    id: string
  ): Promise<string | null> | string | null;

  transform?(
    this: PluginContext,
    code: string,
    id: string
  ): Promise<{ code: string; map?: any } | string | null> | { code: string; map?: any } | string | null;
}
