import { describe, it, expect, beforeEach } from 'vitest';
import {
  defineDeploymentAdapter,
  DeploymentRegistry,
  DeploymentPlanner,
  BuildArtifactCollector,
  CapabilityResolver,
  Validation,
  DeploymentManifest,
  createDeploymentContext,
} from '../../packages/deployment/src/index.js';

describe('Deployment Adapter Framework (PR-47)', () => {
  beforeEach(() => {
    DeploymentRegistry.clear();
  });

  it('1. should register and retrieve custom deployment adapters', () => {
    const adapter = defineDeploymentAdapter({
      name: 'cloudflare',
      capabilities: { static: true, node: false, edge: true, ssr: true, ssg: true },
      async prepare() {},
      async validate() { return true; },
      async bundle() {},
      async generateManifest() { return { adapter: 'cloudflare' }; },
      async finalize() {},
    });

    DeploymentRegistry.register(adapter);
    expect(DeploymentRegistry.get('cloudflare')).toBeDefined();
    expect(DeploymentRegistry.get('cloudflare')?.capabilities.edge).toBe(true);
  });

  it('2. should negotiate capabilities against required features', () => {
    const caps = { static: true, node: true, edge: false, ssr: true, ssg: true };
    expect(CapabilityResolver.resolveCapabilities(caps, { static: true })).toBe(true);
    expect(CapabilityResolver.resolveCapabilities(caps, { edge: true })).toBe(false);
  });

  it('3. should generate structured deployment plan from context', () => {
    const ctx = createDeploymentContext(process.cwd(), process.cwd(), 'node');
    const plan = DeploymentPlanner.createPlan(ctx);

    expect(plan.adapter).toBe('node');
    expect(Array.isArray(plan.runtimeTargets)).toBe(true);
  });

  it('4. should collect build artifacts without rebuilding', () => {
    const artifacts = BuildArtifactCollector.collectArtifacts(process.cwd());
    expect(artifacts).toBeDefined();
    expect(Array.isArray(artifacts.assets)).toBe(true);
  });

  it('5. should validate build output directory existence', () => {
    const validCtx = createDeploymentContext(process.cwd(), process.cwd(), 'generic');
    expect(Validation.validateContext(validCtx).valid).toBe(true);

    const invalidCtx = createDeploymentContext(process.cwd(), '/non/existent/path', 'generic');
    expect(Validation.validateContext(invalidCtx).valid).toBe(false);
  });

  it('6. should generate deployment manifest', () => {
    const ctx = createDeploymentContext(process.cwd(), process.cwd(), 'generic');
    const plan = DeploymentPlanner.createPlan(ctx);
    const manifest = DeploymentManifest.generateManifest(ctx, plan);

    expect(manifest.adapter).toBe('generic');
    expect(manifest.plan).toBeDefined();
  });
});
