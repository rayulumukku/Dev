import vm from 'vm';

export async function ssrLoadModule(transformedCode: string, filename: string): Promise<any> {
  const exports: Record<string, any> = {};
  const module = { exports };

  const context = vm.createContext({
    module,
    exports,
    console,
    process,
    require: (id: string) => {
      if (id === 'react') return { createElement: (type: any, props: any, ...children: any[]) => ({ type, props, children }) };
      return {};
    },
  });

  const script = new vm.Script(transformedCode, { filename });
  script.runInContext(context);

  return module.exports;
}
