import { TestAdapter } from './types.js';

export abstract class BaseTestAdapter implements TestAdapter {
  abstract name: string;
  abstract executeSuite(filepath: string, ctx?: any): Promise<any>;
}
