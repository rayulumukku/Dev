import { startDevServer } from '@ray/dev-server';

const args = process.argv.slice(2);
const command = args[0];

if (command === 'dev') {
  let port = 3000;

  // Simple parser to check for "--port <number>" flag
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    const parsedPort = parseInt(args[portIdx + 1], 10);
    if (!isNaN(parsedPort)) {
      port = parsedPort;
    }
  }

  startDevServer({ port });
} else if (command === 'build') {
  console.log('[Ray CLI] "build" command is not yet implemented (Milestone 2).');
} else {
  console.log(`
⚡ Ray CLI ⚡

Usage:
  ray dev           Start the live dev server (Milestone 1)
  ray dev --port N  Start the dev server on port N

Options:
  --port            Specify custom server port (default: 3000)
`);
  process.exit(1);
}
