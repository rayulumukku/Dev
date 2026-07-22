import { BuildManifest } from './types.js';

export class ManifestComparer {
  compare(prev: BuildManifest, next: BuildManifest): { equal: boolean; differences: string[] } {
    const diffs: string[] = [];

    if (prev.version !== next.version) {
      diffs.push(`Version mismatch: ${prev.version} vs ${next.version}`);
    }
    if (prev.configHash !== next.configHash) {
      diffs.push(`Config hash mismatch`);
    }
    if (prev.envHash !== next.envHash) {
      diffs.push(`Environment hash mismatch`);
    }
    if (prev.pluginsHash !== next.pluginsHash) {
      diffs.push(`Plugins hash mismatch`);
    }

    for (const [file, meta] of Object.entries(next.files)) {
      const prevFile = prev.files[file];
      if (!prevFile) {
        diffs.push(`New file added: ${file}`);
      } else if (prevFile.hash !== meta.hash) {
        diffs.push(`File changed: ${file}`);
      }
    }

    for (const file of Object.keys(prev.files)) {
      if (!next.files[file]) {
        diffs.push(`File removed: ${file}`);
      }
    }

    return {
      equal: diffs.length === 0,
      differences: diffs,
    };
  }
}
