export class HydrationRuntime {
  static getHydrationMetadata(adapterName: string): Record<string, any> {
    return {
      hydratable: true,
      adapter: adapterName,
    };
  }
}
