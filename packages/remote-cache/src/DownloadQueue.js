export class DownloadQueue {
  async fetch(task) {
    try {
      return await task();
    } catch {
      return null;
    }
  }
}
