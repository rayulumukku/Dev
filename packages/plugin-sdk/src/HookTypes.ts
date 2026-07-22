import { SDKPluginContext } from './types.js';

export interface TransformResult {
  code: string;
  map?: any;
}

export type ResolveIdHook = (this: SDKPluginContext, id: string, importer?: string) => Promise<string | null> | string | null;
export type LoadHook = (this: SDKPluginContext, id: string) => Promise<string | null> | string | null;
export type TransformHook = (this: SDKPluginContext, code: string, id: string, context?: any) => Promise<TransformResult | string | null> | TransformResult | string | null;
export type HotUpdateHook = (this: SDKPluginContext, ctx: { file: string; timestamp: number }) => Promise<void> | void;
export type BuildHook = (this: SDKPluginContext) => Promise<void> | void;
export type BundleHook = (this: SDKPluginContext, bundle: any) => Promise<void> | void;
