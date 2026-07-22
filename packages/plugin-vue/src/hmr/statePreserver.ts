export function preserveVueState(instance: any, newModule: any): void {
  if (!instance || !newModule || !newModule.default) return;
  const newDef = newModule.default;
  if (newDef.template !== undefined) {
    instance.template = newDef.template;
  }
  if (typeof instance.$forceUpdate === 'function') {
    instance.$forceUpdate();
  }
}
