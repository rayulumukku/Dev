import { definePlugin } from '@ray/plugin-sdk';

export const test = definePlugin(() => ({
  name: 'test',
  async buildStart() {
    this.logger.info('test initialized!');
  }
}));
