import { describe, it, expect } from 'vitest';
import {
  VersionPlanner,
  PublishPlanner,
  ChangelogGenerator,
  ReleaseValidator,
  CompatibilityChecker,
  ReleaseManager,
} from '../../packages/release/src/index.js';

describe('Release Management & Versioning System (PR-48)', () => {
  it('1. should calculate version bumps correctly (patch, minor, major)', () => {
    expect(VersionPlanner.bumpVersion('1.0.0', 'patch')).toBe('1.0.1');
    expect(VersionPlanner.bumpVersion('1.0.0', 'minor')).toBe('1.1.0');
    expect(VersionPlanner.bumpVersion('1.0.0', 'major')).toBe('2.0.0');
  });

  it('2. should plan package releases from detected changes', () => {
    const changes = {
      '@ray/core': ['feat: new build engine'],
      '@ray/cli': ['fix: resolve command parsing'],
    };

    const plan = VersionPlanner.planPackageReleases(changes, 'independent');
    expect(plan.length).toBe(2);
    expect(plan.find(p => p.name === '@ray/core')?.nextVersion).toBe('1.1.0');
    expect(plan.find(p => p.name === '@ray/cli')?.nextVersion).toBe('1.0.1');
  });

  it('3. should compute topological publish order based on dependency relationships', () => {
    const pkgs = ['@ray/cli', '@ray/core', '@ray/plugin-sdk'];
    const order = PublishPlanner.computePublishOrder(pkgs);

    expect(order[0]).toBe('@ray/core');
  });

  it('4. should generate structured Markdown changelogs', () => {
    const plan = ReleaseManager.createPlan();
    const markdown = ChangelogGenerator.generateMarkdown(plan.packages);

    expect(markdown).toContain('# Release Changelog');
    expect(markdown).toContain('@ray/core');
  });

  it('5. should validate workspace state and check component compatibility', () => {
    const plan = ReleaseManager.createPlan();
    const validation = ReleaseManager.validate(plan);

    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });
});
