import { LockfileData, LockfileEntry } from './types.js';
import fs from 'fs';
import path from 'path';

export class LockfileManager {
  private lockfilePath: string;

  constructor(projectRoot: string) {
    this.lockfilePath = path.join(projectRoot, 'ray-plugin.lock');
  }

  load(): LockfileData {
    if (!fs.existsSync(this.lockfilePath)) {
      return { lockfileVersion: 1, plugins: {} };
    }
    try {
      const text = fs.readFileSync(this.lockfilePath, 'utf-8');
      return JSON.parse(text) as LockfileData;
    } catch {
      return { lockfileVersion: 1, plugins: {} };
    }
  }

  save(data: LockfileData): void {
    fs.writeFileSync(this.lockfilePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  addEntry(name: string, entry: LockfileEntry): LockfileData {
    const data = this.load();
    data.plugins[name] = entry;
    this.save(data);
    return data;
  }

  removeEntry(name: string): LockfileData {
    const data = this.load();
    delete data.plugins[name];
    this.save(data);
    return data;
  }
}
