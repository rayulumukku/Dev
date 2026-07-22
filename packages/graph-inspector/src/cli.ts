import { GraphInspectorServer } from './Server.js';

export async function runCLI(): Promise<void> {
  const args = process.argv.slice(2);
  const open = args.includes('--open');
  const portIndex = args.indexOf('--port');
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 4000;

  const server = new GraphInspectorServer({ port, open });
  await server.start();
}

if (process.argv[1]?.endsWith('cli.js')) {
  runCLI();
}
