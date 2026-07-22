import { describe, it, expect } from 'vitest';
import { angularPlugin } from '../../packages/plugin-angular/src/AngularPlugin.js';
import { AngularCompiler } from '../../packages/plugin-angular/src/AngularCompiler.js';
import { AngularWorkspace } from '../../packages/plugin-angular/src/AngularWorkspace.js';
import { AngularTemplateCompiler } from '../../packages/plugin-angular/src/TemplateCompiler.js';
import { AngularStylesCompiler } from '../../packages/plugin-angular/src/StylesCompiler.js';
import { AngularDependencyScanner } from '../../packages/plugin-angular/src/DependencyScanner.js';
import { AngularMetadataCollector } from '../../packages/plugin-angular/src/MetadataCollector.js';
import { AngularHMRInjector } from '../../packages/plugin-angular/src/HMR.js';
import { AngularSSRRenderer } from '../../packages/plugin-angular/src/SSR.js';
import path from 'path';

describe('Official @ray/plugin-angular Package (PR-38)', () => {
  const sampleComponent = `
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-app';
}
`;

  it('1. should parse angular.json workspace structure', () => {
    const wsPath = path.join(process.cwd(), 'examples/angular-basic');
    const ws = AngularWorkspace.parseWorkspace(wsPath);
    expect(ws).not.toBeNull();
    expect(ws?.version).toBe(1);
    expect(ws?.projects['angular-basic']).toBeDefined();
  });

  it('2. should compile Angular templates into Ivy definitions', () => {
    const compiled = AngularTemplateCompiler.compileTemplate(sampleComponent, 'app.component.ts');
    expect(compiled).toContain('ɵcmp');
  });

  it('3. should process component styleUrls', () => {
    const styleCompiled = AngularStylesCompiler.processComponentStyles(sampleComponent, 'app.component.ts');
    expect(styleCompiled).toContain('Ray CSS pipeline');
  });

  it('4. should scan templateUrl and lazy-loaded routes for dependency graph', () => {
    const deps = AngularDependencyScanner.scan(sampleComponent);
    expect(deps).toContain('@angular/core');
    expect(deps).toContain('./app.component.html');
  });

  it('5. should collect component metadata', () => {
    const meta = AngularMetadataCollector.collect(sampleComponent);
    expect(meta.selector).toBe('app-root');
    expect(meta.standalone).toBe(true);
  });

  it('6. should inject Angular HMR runtime code', () => {
    const hmrCode = AngularHMRInjector.inject('class AppComponent {}', 'app.component.ts');
    expect(hmrCode).toContain('import.meta.hot');
    expect(hmrCode).toContain('Ray Angular HMR');
  });

  it('7. should compile SSR renderer module emitting render() helper', () => {
    const ssrCode = AngularSSRRenderer.compileSSR('class AppComponent {}', 'app.component.ts');
    expect(ssrCode).toContain('export async function render');
    expect(ssrCode).toContain('angular-ssr');
  });

  it('8. should compile client component with source map', () => {
    const res = AngularCompiler.compile(sampleComponent, 'app.component.ts');
    expect(res.code).toContain('ɵcmp');
    expect(res.map).toBeDefined();
    expect(res.dependencies.length).toBeGreaterThan(0);
  });

  it('9. should run plugin transform hook cleanly and utilize cache & graph', async () => {
    const plugin = angularPlugin();
    const mockCache = new Map<string, any>();
    const mockGraph = { addDependency: (src: string, dep: string) => {} };

    const ctx = {
      buildMode: 'development',
      cache: {
        get: (k: string) => mockCache.get(k),
        set: (k: string, v: any) => mockCache.set(k, v),
      },
      graph: mockGraph,
    };

    const res1 = await plugin.transform.call(ctx, sampleComponent, 'app.component.ts');
    expect(res1).toBeDefined();
    expect(res1.code).toContain('ɵcmp');

    // Second call should hit cache
    const res2 = await plugin.transform.call(ctx, sampleComponent, 'app.component.ts');
    expect(res2).toBe(res1);
  });

  it('10. should handle hot update notifications', async () => {
    const plugin = angularPlugin();
    expect(typeof plugin.handleHotUpdate).toBe('function');
  });
});
