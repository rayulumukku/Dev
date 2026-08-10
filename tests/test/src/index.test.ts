import { describe, it, expect } from 'vitest';
import { test } from './index.js';

describe('test', () => {
  it('should instantiate successfully', () => {
    const plugin = test();
    expect(plugin.name).toBe('test');
  });
});
