import { ReleaseConfig, ReleasePlan } from './types.js';
import { ChangeDetector } from './ChangeDetector.js';
import { VersionPlanner } from './VersionPlanner.js';
import { PublishPlanner } from './PublishPlanner.js';
import { ChangelogGenerator } from './ChangelogGenerator.js';
import { ReleaseValidator } from './ReleaseValidator.js';
import { CompatibilityChecker } from './CompatibilityChecker.js';

export class ReleaseManager {
  static createPlan(config: ReleaseConfig = {}): ReleasePlan {
    const changes = ChangeDetector.getChangedPackages();
    const packages = VersionPlanner.planPackageReleases(changes, config.strategy || 'independent');
    const publishOrder = PublishPlanner.computePublishOrder(packages.map(p => p.name));

    return {
      strategy: config.strategy || 'independent',
      packages,
      publishOrder,
      planTime: Date.now(),
    };
  }

  static validate(plan: ReleasePlan): { valid: boolean; errors: string[] } {
    const vResult = ReleaseValidator.validateWorkspace();
    const cResult = CompatibilityChecker.verifyCompatibility(plan.publishOrder);

    const errors = [...vResult.errors, ...cResult.issues];
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static generateChangelog(plan: ReleasePlan): string {
    return ChangelogGenerator.generateMarkdown(plan.packages);
  }
}
