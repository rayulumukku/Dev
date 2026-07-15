import fs from 'fs';
import path from 'path';

export interface WatcherOptions {
  ignored?: Array<string | RegExp>;
  persistent?: boolean;
}

export type WatchEvent = 'add' | 'change' | 'unlink';

export interface WatcherDiagnostics {
  platform: string;
  watcherCount: number;
  cpuUsagePercent: number;
  memoryMB: number;
  totalEventsProcessed: number;
  avgLatencyMs: number;
}

export class RayFSWatcher {
  private watchedPaths: Set<string> = new Set();
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private ignored: Array<string | RegExp>;
  private persistent: boolean;
  private changeCallbacks: Set<(event: WatchEvent, filePath: string) => void> = new Set();

  // Diagnostics counters
  private startTime = Date.now();
  private totalEventsProcessed = 0;
  private latencies: number[] = [];

  // Debouncing / Batching queues
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingEvents: Map<string, { event: WatchEvent; time: number }> = new Map();

  constructor(paths: string[], options: WatcherOptions = {}) {
    this.ignored = options.ignored || [];
    this.persistent = options.persistent !== false;

    for (const p of paths) {
      this.watchPathRecursive(path.resolve(p));
    }
  }

  private isIgnored(filePath: string): boolean {
    const base = path.basename(filePath);
    if (base.startsWith('.')) return true; // dotfiles
    
    // Ignore common build directories
    if (filePath.includes('node_modules') || filePath.includes('dist') || filePath.includes('.git')) {
      return true;
    }

    for (const pattern of this.ignored) {
      if (typeof pattern === 'string') {
        if (filePath.includes(pattern)) return true;
      } else if (pattern instanceof RegExp) {
        if (pattern.test(filePath)) return true;
      }
    }
    return false;
  }

  private watchPathRecursive(targetPath: string) {
    if (this.isIgnored(targetPath) || this.watchedPaths.has(targetPath)) return;

    if (!fs.existsSync(targetPath)) return;
    const stat = fs.statSync(targetPath);

    if (stat.isDirectory()) {
      // Windows supports recursive natively, but macOS FSEvents/Linux inotify fallbacks benefit from recursive watcher registration.
      // We manually bind subdirectories for maximal reliability across all OS architectures.
      this.watchedPaths.add(targetPath);
      try {
        const watcher = fs.watch(targetPath, { persistent: this.persistent, recursive: true }, (event, filename) => {
          if (!filename) return;
          const fullPath = path.join(targetPath, filename);
          this.handleRawEvent(fullPath);
        });
        this.watchers.set(targetPath, watcher);
      } catch (err) {
        // Suppress descriptor limits or permission errors
      }

      // Scan subdirs
      try {
        const children = fs.readdirSync(targetPath);
        for (const child of children) {
          const childPath = path.join(targetPath, child);
          if (fs.statSync(childPath).isDirectory()) {
            this.watchPathRecursive(childPath);
          }
        }
      } catch {}
    } else {
      this.watchedPaths.add(targetPath);
      try {
        const watcher = fs.watch(targetPath, { persistent: this.persistent }, () => {
          this.handleRawEvent(targetPath);
        });
        this.watchers.set(targetPath, watcher);
      } catch {}
    }
  }

  private handleRawEvent(filePath: string) {
    if (this.isIgnored(filePath)) return;

    this.totalEventsProcessed++;
    const startEventTime = Date.now();

    // Determine event classification incrementally
    let eventType: WatchEvent = 'change';
    if (!fs.existsSync(filePath)) {
      eventType = 'unlink';
    } else {
      // Check if newly created directory to recursively watch it
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          if (this.watchedPaths.has(filePath)) {
            return;
          }
          eventType = 'add';
          this.watchPathRecursive(filePath);
        }
      } catch {}
    }

    // Atomic Rename Handling / Debouncing
    this.pendingEvents.set(filePath, { event: eventType, time: startEventTime });

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Batch and debounce triggers (40ms aggregate latency limit)
    this.debounceTimer = setTimeout(() => {
      this.flushBatch();
    }, 40);
  }

  private flushBatch() {
    this.debounceTimer = null;
    const now = Date.now();

    for (const [filePath, info] of this.pendingEvents.entries()) {
      // Record latency metrics
      this.latencies.push(now - info.time);
      if (this.latencies.length > 50) this.latencies.shift();

      // Trigger callbacks
      for (const cb of this.changeCallbacks) {
        try {
          cb(info.event, filePath);
        } catch {}
      }
    }
    this.pendingEvents.clear();
  }

  on(event: 'all', cb: (eventType: WatchEvent, filePath: string) => void) {
    this.changeCallbacks.add(cb);
  }

  off(event: 'all', cb: (eventType: WatchEvent, filePath: string) => void) {
    this.changeCallbacks.delete(cb);
  }

  close() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    for (const watcher of this.watchers.values()) {
      try {
        watcher.close();
      } catch {}
    }
    this.watchers.clear();
    this.watchedPaths.clear();
    this.changeCallbacks.clear();
  }

  getDiagnostics(): WatcherDiagnostics {
    const avgLatency = this.latencies.length > 0
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
      : 0;

    const memory = process.memoryUsage().heapUsed / 1024 / 1024;

    return {
      platform: process.platform,
      watcherCount: this.watchers.size,
      cpuUsagePercent: Number((process.cpuUsage().user / 1000000).toFixed(2)),
      memoryMB: Number(memory.toFixed(2)),
      totalEventsProcessed: this.totalEventsProcessed,
      avgLatencyMs: Number(avgLatency.toFixed(2))
    };
  }
}
