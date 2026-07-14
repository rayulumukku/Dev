import { describe, it, expect } from 'vitest';
import { transformJsx } from '../../packages/transform/src/index.js';

describe('Transformer Unit Tests', () => {
  it('should transform JS code directly', async () => {
    const raw = 'const x = 42; console.log(x);';
    const result = await transformJsx(raw, 'file.js');
    expect(result).toContain('const x = 42;');
    expect(result).toContain('//# sourceMappingURL=data:application/json;base64,');
  });

  it('should transform JSX to React.createElement', async () => {
    const raw = 'export const App = () => <div>Hello</div>;';
    const result = await transformJsx(raw, 'App.jsx');
    expect(result).toContain('React.createElement("div", null, "Hello")');
  });

  it('should compile TypeScript syntax', async () => {
    const raw = 'export interface Info { name: string; } export const getInfo = (x: Info) => x.name;';
    const result = await transformJsx(raw, 'info.ts');
    expect(result).toContain('getInfo = (x) => x.name');
    expect(result).toContain('export');
  });

  it('should compile TSX syntax', async () => {
    const raw = 'export const Comp = (props: { val: string }) => <span>{props.val}</span>;';
    const result = await transformJsx(raw, 'Comp.tsx');
    expect(result).toContain('React.createElement("span", null, props.val)');
  });
});
