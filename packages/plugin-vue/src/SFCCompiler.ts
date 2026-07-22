import { SFCDescriptor, SFCCompileResult } from './types.js';

export function compileSFC(descriptor: SFCDescriptor): SFCCompileResult {
  const scriptContent = descriptor.script ? descriptor.script.content : 'export default {}';
  const templateHtml = descriptor.template ? descriptor.template.content : '';

  // Extract script default export or convert to _sfc_main
  let jsCode = scriptContent;

  if (/export\s+default\s+/.test(jsCode)) {
    jsCode = jsCode.replace(/export\s+default\s+/, 'const _sfc_main = ');
  } else {
    jsCode += '\nconst _sfc_main = {};';
  }

  let compiled = `/* Vue SFC compiled: ${descriptor.filename} */\n${jsCode}\n`;
  compiled += `_sfc_main.template = ${JSON.stringify(templateHtml)};\n`;

  // Process and inject styles if present
  if (descriptor.styles.length > 0) {
    const cssCode = descriptor.styles.map((s) => s.content).join('\n');
    compiled += `\nif (typeof document !== 'undefined') {\n  const style = document.createElement('style');\n  style.setAttribute('data-vue-sfc', ${JSON.stringify(descriptor.filename)});\n  style.innerHTML = ${JSON.stringify(cssCode)};\n  document.head.appendChild(style);\n}\n`;
  }

  compiled += `export default _sfc_main;\n`;

  return {
    code: compiled,
  };
}
