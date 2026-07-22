export function preserveVueState(instance, newModule) {
  if (!instance || !newModule || !newModule.default) return;
  const newDef = newModule.default;
  if (newDef.template !== undefined) {
    instance.template = newDef.template;
  }
  if (typeof instance.$forceUpdate === 'function') {
    instance.$forceUpdate();
  }
}
