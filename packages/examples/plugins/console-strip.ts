import { RayPlugin } from '@ray/core';

export function consoleStripPlugin(): RayPlugin {
  return {
    name: 'console-strip',

    transform(code: string) {
      // Strip console.log(...) statements
      return code.replace(/console\.log\([^)]*\);?/g, '');
    },
  };
}
