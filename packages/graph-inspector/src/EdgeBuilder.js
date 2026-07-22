export function buildInspectorEdge(source, target, isDynamic = false) {
  return {
    source,
    target,
    isDynamic,
  };
}
