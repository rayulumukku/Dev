import { RayPlugin } from './Plugin.js';

export type ResolveIdHook = NonNullable<RayPlugin['resolveId']>;
export type LoadHook = NonNullable<RayPlugin['load']>;
export type TransformHook = NonNullable<RayPlugin['transform']>;
