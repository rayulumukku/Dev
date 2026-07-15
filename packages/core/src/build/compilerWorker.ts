import { parentPort, workerData } from 'worker_threads';
import { transform } from 'esbuild';

if (parentPort) {
  parentPort.on('message', async (message) => {
    const { code, file, options } = message;
    try {
      // Execute esbuild transform concurrently inside worker threads
      const result = await transform(code, {
        loader: file.endsWith('.tsx') ? 'tsx' : file.endsWith('.ts') ? 'ts' : file.endsWith('.jsx') ? 'jsx' : 'js',
        format: 'esm',
        sourcemap: true,
        minify: options?.minify || false,
        define: options?.define || {}
      });

      parentPort!.postMessage({
        success: true,
        code: result.code,
        map: result.map
      });
    } catch (err: any) {
      parentPort!.postMessage({
        success: false,
        error: err.message
      });
    }
  });
}
