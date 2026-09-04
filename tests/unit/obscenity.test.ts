import { describe, it, expect } from 'vitest';
import { hasObscenity, censorObscenity } from '../../packages/core/src/index.js';

describe('Obscenity and Content Moderation Filter (PR-50)', () => {
  it('should detect vulgar/profane words accurately', () => {
    expect(hasObscenity('fuck')).toBe(true);
    expect(hasObscenity('asshole')).toBe(true);
    expect(hasObscenity('This is a fuck test')).toBe(true);
    expect(hasObscenity('You are an asshole')).toBe(true);
  });

  it('should not flag benign words and common package names', () => {
    expect(hasObscenity('my-cool-app')).toBe(false);
    expect(hasObscenity('button-component')).toBe(false);
    expect(hasObscenity('ray-dashboard')).toBe(false);
    expect(hasObscenity('hello world')).toBe(false);
  });

  it('should censor vulgar words with grawlix masking', () => {
    const censored = censorObscenity('This is a fuck test with asshole');
    expect(censored).not.toContain('fuck');
    expect(censored).not.toContain('asshole');
    expect(hasObscenity(censored)).toBe(false);
  });

  it('should return original text when no profanity is present', () => {
    const clean = 'Welcome to the Ray platform!';
    expect(censorObscenity(clean)).toBe(clean);
  });
});
