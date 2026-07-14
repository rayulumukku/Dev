import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { parseEnv, loadEnv } from '../../packages/core/src/plugin/env.js';
import { envPlugin } from '../../packages/core/src/plugin/builtins/envPlugin.js';

describe('Environment Variables Integration Tests', () => {
  describe('parseEnv', () => {
    it('should parse key-value pairs and trim quotes', () => {
      const content = `
        # This is a comment
        RAY_PORT=3000
        RAY_NAME="Ray Framework"
        RAY_SECRET='shhh'
        INVALID_LINE
      `;
      const env = parseEnv(content);
      expect(env.RAY_PORT).toBe('3000');
      expect(env.RAY_NAME).toBe('Ray Framework');
      expect(env.RAY_SECRET).toBe('shhh');
      expect(env.INVALID_LINE).toBeUndefined();
    });
  });

  describe('loadEnv & envPlugin Substitutions', () => {
    const mockRoot = path.resolve(process.cwd(), 'tests/fixtures/env-project');

    it('should load env files by precedence', () => {
      // Create mock env files
      fs.mkdirSync(mockRoot, { recursive: true });
      fs.writeFileSync(path.join(mockRoot, '.env'), 'RAY_API=base\nRAY_PORT=80');
      fs.writeFileSync(path.join(mockRoot, '.env.development'), 'RAY_API=dev');
      fs.writeFileSync(path.join(mockRoot, '.env.development.local'), 'RAY_API=dev-local');

      const devEnv = loadEnv('development', mockRoot);
      expect(devEnv.RAY_API).toBe('dev-local'); // Highest override
      expect(devEnv.RAY_PORT).toBe('80'); // Fallback to base
    });

    it('should substitute env variables and filter unexposed variables', async () => {
      const env = {
        RAY_API: 'http://api.com',
        SECRET_KEY: 'super-secret-key-do-not-leak'
      };

      const plugin = envPlugin(env, 'development');
      const mockCode = `
        const api = import.meta.env.RAY_API;
        const secret = import.meta.env.SECRET_KEY;
        const isDev = import.meta.env.DEV;
        console.log(import.meta.env);
      `;

      // Mock context
      const context = { buildMode: 'development' } as any;
      const res = await plugin.transform!.call(context, mockCode, 'main.js');

      expect(res).not.toBeNull();
      if (res) {
        expect(res.code).toContain('"http://api.com"');
        expect(res.code).toContain('undefined'); // SECRET_KEY must be replaced by undefined
        expect(res.code).not.toContain('super-secret-key-do-not-leak');
        expect(res.code).toContain('true'); // DEV mode is true
      }
    });

    it('should substitute define constants', async () => {
      const plugin = envPlugin({}, 'development', 'RAY_', {
        __VERSION__: '"1.2.3"'
      });
      const code = 'const version = __VERSION__;';
      const res = await plugin.transform!.call({ buildMode: 'development' } as any, code, 'main.js');
      expect(res?.code).toContain('const version = "1.2.3";');
    });

    // Cleanup mock folders after test runs
    it('cleanup env mock folder', () => {
      fs.rmSync(mockRoot, { recursive: true, force: true });
    });
  });
});
