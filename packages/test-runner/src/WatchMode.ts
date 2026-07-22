import { TestGraph } from './TestGraph.js';

export class WatchMode {
  static onFileChange(changedFile: string, rerunCallback: (tests: string[]) => void): void {
    const affected = TestGraph.getAffectedTests(changedFile);
    rerunCallback(affected.length > 0 ? affected : [changedFile]);
  }
}
