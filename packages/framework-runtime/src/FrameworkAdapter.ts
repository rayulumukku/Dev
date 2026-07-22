import { FrameworkAdapter } from './types.js';
import { RuntimeRegistry } from './RuntimeRegistry.js';

export function defineFramework(config: FrameworkAdapter): FrameworkAdapter {
  RuntimeRegistry.registerAdapter(config);
  return config;
}
