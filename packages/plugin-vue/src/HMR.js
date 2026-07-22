import { generateVueHMRAccept } from './hmr/accept.js';

export * from './hmr/descriptorCache.js';
export * from './hmr/statePreserver.js';
export * from './hmr/boundary.js';
export * from './hmr/updateHandler.js';
export * from './hmr/accept.js';

export function generateVueHMR(filename, updateType = 'multiple') {
  return generateVueHMRAccept(filename, updateType);
}
