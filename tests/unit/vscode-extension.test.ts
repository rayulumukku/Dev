import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { isRayProject } from '../../packages/vscode-extension/src/utils/ProjectDetector.js';
import { getCompletions } from '../../packages/vscode-extension/src/completion/CompletionProvider.js';
import { getHoverDoc } from '../../packages/vscode-extension/src/providers/HoverProvider.js';
import { validateConfigText } from '../../packages/vscode-extension/src/diagnostics/ConfigDiagnostics.js';
import { executeCommand, RAY_EXTENSION_COMMANDS } from '../../packages/vscode-extension/src/commands/CommandRegistry.js';
import { activateExtension } from '../../packages/vscode-extension/src/extension.js';

const testTmpDir = path.resolve(process.cwd(), 'temp-vscode-ext-test');

describe('Official Ray VS Code Extension (PR-22)', () => {
  beforeEach(() => {
    if (fs.existsSync(testTmpDir)) {
      fs.rmSync(testTmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testTmpDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testTmpDir)) {
      fs.rmSync(testTmpDir, { recursive: true, force: true });
    }
  });

  it('should detect Ray projects via configuration file or dependency manifest', () => {
    expect(isRayProject(testTmpDir)).toBe(false);

    fs.writeFileSync(path.join(testTmpDir, 'ray.config.ts'), 'export default {};');
    expect(isRayProject(testTmpDir)).toBe(true);
  });

  it('should provide IntelliSense completions for Ray configuration options', () => {
    const completions = getCompletions();

    expect(completions.length).toBeGreaterThan(0);
    expect(completions.some((c) => c.key === 'root')).toBe(true);
    expect(completions.some((c) => c.key === 'build.outDir')).toBe(true);
  });

  it('should provide hover documentation for configuration keys', () => {
    const hover = getHoverDoc('port');

    expect(hover).not.toBeNull();
    expect(hover).toContain('Development server listening port');
  });

  it('should flag unknown configuration properties as diagnostics', () => {
    const configText = `export default {\n  server: {\n    port: 3000,\n    invalidUnknownProp: true\n  }\n};`;
    const diagnostics = validateConfigText(configText);

    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].message).toContain("Unknown Ray configuration key: 'invalidUnknownProp'");
  });

  it('should map Command Palette entries to CLI commands', () => {
    const cliCmd = executeCommand('ray.startDevServer');

    expect(cliCmd).toBe('ray dev');
    expect(RAY_EXTENSION_COMMANDS.length).toBe(6);
  });

  it('should activate extension correctly for a Ray workspace', () => {
    fs.writeFileSync(path.join(testTmpDir, 'ray.config.ts'), 'export default {};');
    const api = activateExtension(testTmpDir);

    expect(api.active).toBe(true);
  });
});
