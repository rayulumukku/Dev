import { StabilityLevel } from './types.js';

export class StabilityLevels {
  static isPublic(level: StabilityLevel): boolean {
    return level === 'public';
  }

  static parseStabilityTag(comment: string): StabilityLevel {
    if (comment.includes('@experimental')) return 'experimental';
    if (comment.includes('@deprecated')) return 'deprecated';
    if (comment.includes('@internal')) return 'internal';
    return 'public';
  }
}
