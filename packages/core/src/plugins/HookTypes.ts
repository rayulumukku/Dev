import { RayPlugin } from './Plugin.js';

export type ResolveIdHook = NonNullable<RayPlugin['resolveId']>;
export type LoadHook = NonNullable<RayPlugin['load']>;
export type TransformHook = NonNullable<RayPlugin['transform']>;

export type OnModuleDiscoveredHook = NonNullable<RayPlugin['onModuleDiscovered']>;
export type OnDependencyResolvedHook = NonNullable<RayPlugin['onDependencyResolved']>;
export type OnGraphInvalidatedHook = NonNullable<RayPlugin['onGraphInvalidated']>;
export type OnGraphUpdatedHook = NonNullable<RayPlugin['onGraphUpdated']>;
