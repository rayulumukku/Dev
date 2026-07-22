export class DownloadQueue {
  async fetch<T>(task: () => Promise<T>): Promise<T | null> {
    try {
      return await task();
    } catch {
      return null;
    }
  }
}
