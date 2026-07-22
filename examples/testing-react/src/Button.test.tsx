import { describe, it, expect } from 'vitest';

export function Button() {
  return 'Button Component';
}

describe('React Button Component', () => {
  it('should render button label', () => {
    expect(Button()).toBe('Button Component');
  });
});
