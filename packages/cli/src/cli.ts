import { startDevServer } from '@ray/dev-server';
import { buildProject } from '@ray/core';

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
  const options = {
    outDir: 'dist',
    minify: true,
    sourcemap: 'external' as any,
    watch: false,
    analyze: false,
  };

  // Parse watch & analyze boolean flags
  if (args.includes('--watch')) {
    options.watch = true;
  }
  if (args.includes('--analyze')) {
    options.analyze = true;
  }

  // Parse outDir
  const outDirIdx = args.indexOf('--outDir');
  if (outDirIdx !== -1 && args[outDirIdx + 1]) {
    options.outDir = args[outDirIdx + 1];
  }

  // Parse minify (defaults to true; can be disabled with --minify false)
  const minifyIdx = args.indexOf('--minify');
  if (minifyIdx !== -1 && args[minifyIdx + 1] === 'false') {
    options.minify = false;
  }

  // Parse sourcemap (inline, external, hidden, true, false; defaults to external)
  const sourcemapIdx = args.indexOf('--sourcemap');
  if (sourcemapIdx !== -1 && args[sourcemapIdx + 1]) {
    const val = args[sourcemapIdx + 1];
    options.sourcemap = val === 'true' ? true : val === 'false' ? false : val;
  }

  buildProject(options).catch((err) => {
    console.error('\n❌ Build Failed:', err.message);
    process.exit(1);
  });
} else {
  console.log(`
⚡ Ray CLI (Milestone 6) ⚡

Usage:
  ray dev             Start the live dev server
  ray dev --port N    Start the dev server on port N
  ray build           Compile the project for production

Options for build:
  --outDir <path>     Specify production output directory (default: dist)
  --minify <boolean>  Toggle output minification (default: true)
  --sourcemap <type>  Specify sourcemap mode (inline, external, hidden; default: external)
  --watch             Incrementally watch and rebuild on changes
  --analyze           Print visual bundle file analysis report
`);
  process.exit(1);
}
