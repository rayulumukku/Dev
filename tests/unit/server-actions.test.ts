import { describe, it, expect, beforeEach } from 'vitest';
import { ActionRegistry } from '../../packages/server-actions/src/ActionRegistry.js';
import { ActionSecurity } from '../../packages/server-actions/src/ActionSecurity.js';
import { ActionSerializer } from '../../packages/server-actions/src/ActionSerializer.js';
import { ActionManifestGenerator } from '../../packages/server-actions/src/ActionManifest.js';
import { ActionDispatcher } from '../../packages/server-actions/src/ActionDispatcher.js';
import { ActionCompiler } from '../../packages/server-actions/src/ActionCompiler.js';
import { ActionValidator } from '../../packages/server-actions/src/ActionValidator.js';
import { ActionRuntime } from '../../packages/server-actions/src/ActionRuntime.js';

describe('Experimental Server Actions Support (PR-40)', () => {
  beforeEach(() => {
    ActionRegistry.clear();
  });

  it('1. should discover and compile "use server" action functions', () => {
    const actionCode = `"use server";\nexport async function updateTodo() {}`;
    const res = ActionCompiler.compile(actionCode, 'actions.js');

    expect(res.actionsCount).toBe(1);
    const registered = ActionRegistry.get('actions.js#updateTodo');
    expect(registered).toBeDefined();
    expect(registered?.name).toBe('updateTodo');
  });

  it('2. should generate server actions manifest JSON', () => {
    ActionRegistry.register({
      id: 'actions.js#addItem',
      name: 'addItem',
      filepath: 'actions.js',
    });

    const manifest = ActionManifestGenerator.generateManifest();
    expect(manifest['actions.js#addItem']).toBeDefined();

    const json = ActionManifestGenerator.toJSON();
    expect(json).toContain('actions.js#addItem');
  });

  it('3. should validate CSRF token, payload size, and action IDs', () => {
    expect(ActionSecurity.validateCSRF('token123', 'token123')).toBe(true);
    expect(ActionSecurity.validateCSRF('wrong', 'token123')).toBe(false);

    expect(ActionSecurity.validatePayloadSize(500, '2mb')).toBe(true);
    expect(ActionSecurity.validatePayloadSize(5000000, '2mb')).toBe(false);

    expect(ActionSecurity.validateActionId('actions.js#updateTodo')).toBe(true);
    expect(ActionSecurity.validateActionId('')).toBe(false);
  });

  it('4. should serialize and deserialize action arguments', () => {
    const data = { title: 'New Action' };
    const serialized = ActionSerializer.serialize(data);
    expect(typeof serialized).toBe('string');

    const deserialized = ActionSerializer.deserialize(serialized);
    expect(deserialized.title).toBe('New Action');
  });

  it('5. should dispatch action and handle invocation execution', async () => {
    ActionRegistry.register({
      id: 'actions.js#multiply',
      name: 'multiply',
      filepath: 'actions.js',
      handler: async (a: number, b: number) => a * b,
    });

    const res = await ActionDispatcher.dispatch('actions.js#multiply', [3, 4]);
    expect(res.success).toBe(true);
    expect(res.result).toBe(12);
  });

  it('6. should handle action invocation errors gracefully', async () => {
    ActionRegistry.register({
      id: 'actions.js#fail',
      name: 'fail',
      filepath: 'actions.js',
      handler: async () => {
        throw new Error('Action execution failed');
      },
    });

    const res = await ActionDispatcher.dispatch('actions.js#fail', []);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Action execution failed');
  });

  it('7. should validate action exports', () => {
    const valid = ActionValidator.validateActionExport('updateTodo', 'actions.js');
    expect(valid.valid).toBe(true);

    const invalid = ActionValidator.validateActionExport('invalid-action-@', 'actions.js');
    expect(invalid.valid).toBe(false);
  });

  it('8. should process action HTTP runtime request', async () => {
    ActionRegistry.register({
      id: 'actions.js#greet',
      name: 'greet',
      filepath: 'actions.js',
      handler: async (name: string) => `Hello ${name}`,
    });

    const res = await ActionRuntime.handleActionRequest('actions.js#greet', JSON.stringify(['Ray User']));
    expect(res.success).toBe(true);
    expect(res.result).toBe('Hello Ray User');
  });
});
