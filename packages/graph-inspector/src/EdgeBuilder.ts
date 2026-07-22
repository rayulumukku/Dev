import { InspectorEdge } from './types.js';

export function buildInspectorEdge(source: string, target: string, isDynamic: boolean = false): InspectorEdge {
  return {
    source,
    target,
    isDynamic,
  };
}
