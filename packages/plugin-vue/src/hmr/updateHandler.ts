import { UpdateType } from './descriptorCache.js';

export interface HMRUpdatePayload {
  file: string;
  type: UpdateType;
  timestamp: number;
}

export function handleVueUpdate(payload: HMRUpdatePayload): { action: string; file: string } {
  switch (payload.type) {
    case 'style-only':
      return { action: 'reload-styles', file: payload.file };
    case 'template-only':
      return { action: 'rerender', file: payload.file };
    case 'script-only':
    case 'multiple':
    default:
      return { action: 'reload-module', file: payload.file };
  }
}
