import vm from 'vm';

export async function ssrLoadModule(transformedCode, filename) {
  const exports = {};
  const module = { exports };

  const context = vm.createContext({
    module,
    exports,
    console,
    process,
    require: (id) => {
      if (id === 'react') return { createElement: (type, props, ...children) => ({ type, props, children }) };
      return {};
    },
  });

  const script = new vm.Script(transformedCode, { filename });
  script.runInContext(context);

  return module.exports;
}
