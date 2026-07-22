import fs from 'fs';
import path from 'path';

export class SnapshotManager {
  static getSnapshotPath(testFile: string): string {
    const dir = path.dirname(testFile);
    const base = path.basename(testFile);
    return path.join(dir, '__snapshots__', `${base}.snap`);
  }

  static matchSnapshot(testFile: string, snapshotName: string, actual: any, update = false): { pass: boolean; expected?: any; actual?: any } {
    const snapPath = this.getSnapshotPath(testFile);
    let snapshots: Record<string, any> = {};

    if (fs.existsSync(snapPath)) {
      try {
        snapshots = JSON.parse(fs.readFileSync(snapPath, 'utf-8'));
      } catch {}
    }

    if (update || !(snapshotName in snapshots)) {
      snapshots[snapshotName] = actual;
      fs.mkdirSync(path.dirname(snapPath), { recursive: true });
      fs.writeFileSync(snapPath, JSON.stringify(snapshots, null, 2));
      return { pass: true };
    }

    const expected = snapshots[snapshotName];
    const pass = JSON.stringify(expected) === JSON.stringify(actual);
    return { pass, expected, actual };
  }
}
