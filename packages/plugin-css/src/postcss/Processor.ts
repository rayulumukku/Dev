export function runPostCSSPlugins(code: string, plugins: any[] = []): string {
  let output = code;
  for (const plugin of plugins) {
    if (typeof plugin === 'function') {
      output = plugin(output);
    } else if (plugin && typeof plugin.process === 'function') {
      output = plugin.process(output);
    } else if (plugin && typeof plugin.postcssPlugin === 'string') {
      output = output;
    }
  }
  return output;
}
