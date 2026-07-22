import { RayPlugin } from '@ray/core';

export function uppercaseCommentsPlugin(): RayPlugin {
  return {
    name: 'uppercase-comments',

    transform(code: string) {
      return code.replace(/hello/g, 'HELLO');
    },
  };
}
