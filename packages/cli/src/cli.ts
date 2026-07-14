import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { startDevServer } from '@ray/dev-server';
import { buildProject } from '@ray/core';
import { runCreateProject } from './create.js';

const args = process.argv.slice(2);
const command = args[0];

// Resolve mode override flag
let mode = 'development';
const modeIdx = args.indexOf('--mode');
if (modeIdx !== -1 && args[modeIdx + 1]) {
  mode = args[modeIdx + 1];
}

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

  const ssr = args.includes('--ssr');
  startDevServer({ port, ssr, mode });
} else if (command === 'studio') {
  let port = 3000;
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    const parsedPort = parseInt(args[portIdx + 1], 10);
    if (!isNaN(parsedPort)) {
      port = parsedPort;
    }
  }

  (async () => {
    try {
      console.log(`[Ray Studio] Launching visual developer dashboard on port ${port}...`);
      await startDevServer({ port, ssr: false, mode });

      const studioUrl = `http://localhost:${port}/__ray/studio`;
      try {
        if (process.platform === 'win32') {
          exec(`start "" "${studioUrl}"`);
        } else if (process.platform === 'darwin') {
          exec(`open "${studioUrl}"`);
        } else {
          exec(`xdg-open "${studioUrl}"`);
        }
        console.log(`[Ray Studio] Automatically opened browser to ${studioUrl}`);
      } catch (err: any) {
        console.warn(`[Ray Studio Warning] Could not open browser automatically: ${err.message}`);
      }
    } catch (err: any) {
      console.error('[Ray Studio Error] Failed to launch:', err.message);
      process.exit(1);
    }
  })();
} else if (command === 'build') {
  let buildMode = 'production';
  const modeIdx = args.indexOf('--mode');
  if (modeIdx !== -1 && args[modeIdx + 1]) {
    buildMode = args[modeIdx + 1];
  }

  const options = {
    outDir: 'dist',
    minify: true,
    sourcemap: 'external' as any,
    watch: false,
    analyze: false,
    ssr: false,
    ssg: false,
    lib: false,
    entry: undefined as string | undefined,
    name: undefined as string | undefined,
    formats: undefined as string | undefined,
    external: undefined as string | undefined,
    dts: undefined as boolean | undefined,
    mode: buildMode,
  };

  // Parse watch, analyze, ssr & ssg boolean flags
  if (args.includes('--watch')) {
    options.watch = true;
  }
  if (args.includes('--analyze')) {
    options.analyze = true;
  }
  if (args.includes('--ssr')) {
    options.ssr = true;
  }
  if (args.includes('--ssg')) {
    options.ssg = true;
  }
  if (args.includes('--lib')) {
    options.lib = true;
  }

  // Parse library mode arguments
  const entryIdx = args.indexOf('--entry');
  if (entryIdx !== -1 && args[entryIdx + 1]) {
    options.entry = args[entryIdx + 1];
  }
  const nameIdx = args.indexOf('--name');
  if (nameIdx !== -1 && args[nameIdx + 1]) {
    options.name = args[nameIdx + 1];
  }
  const formatsIdx = args.indexOf('--formats');
  if (formatsIdx !== -1 && args[formatsIdx + 1]) {
    options.formats = args[formatsIdx + 1];
  }
  const extIdx = args.indexOf('--external');
  if (extIdx !== -1 && args[extIdx + 1]) {
    options.external = args[extIdx + 1];
  }
  const dtsIdx = args.indexOf('--dts');
  if (dtsIdx !== -1 && args[dtsIdx + 1]) {
    options.dts = args[dtsIdx + 1] !== 'false';
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
} else if (command === 'preview') {
  let port = 3000;
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    const parsedPort = parseInt(args[portIdx + 1], 10);
    if (!isNaN(parsedPort)) {
      port = parsedPort;
    }
  }
  console.log('[Ray CLI] Serving production build preview...');
  startDevServer({ port, preview: true } as any);
} else if (command === 'optimize') {
  (async () => {
    try {
      const { RayCore } = await import('@ray/core');
      const core = new RayCore(process.cwd());
      await core.init();

      const force = args.includes('--force');
      const clear = args.includes('--clear');

      console.log(`[Ray CLI] Running manual dependency optimization...`);
      const result = await core.optimize({ force, clear });

      if (!clear) {
        console.log(`[Ray CLI] Optimized packages:`, Object.keys(result.optimized));
        console.log(`[Ray CLI] Optimization completed in ${result.optimizationTimeMs}ms (Scan: ${result.scanTimeMs}ms).`);
      }
      process.exit(0);
    } catch (err: any) {
      console.error('Optimize command failed:', err.message);
      process.exit(1);
    }
  })();
} else if (command === 'inspect' && args.includes('--lib')) {
  (async () => {
    try {
      const { RayCore } = await import('@ray/core');
      const core = new RayCore(process.cwd());
      await core.init();
      const buildConfig = core.config.build || {};
      const libConfig = buildConfig.lib || {};

      const diagnostics = {
        entry: libConfig.entry || 'src/index.ts',
        formats: libConfig.formats || ['esm', 'cjs', 'umd'],
        externals: libConfig.external || [],
        types: libConfig.dts !== false,
      };

      console.log(JSON.stringify(diagnostics, null, 2));
      process.exit(0);
    } catch (err: any) {
      console.error('Inspect command failed:', err.message);
      process.exit(1);
    }
  })();
} else if (command === 'create') {
  if (args[1] === 'plugin') {
    const pluginName = args[2] || 'my-plugin';
    const targetDir = path.resolve(process.cwd(), pluginName);

    console.log(`[Ray CLI] Scaffolding new plugin: ${pluginName} at ${targetDir} ...`);

    fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

    const pkgJson = {
      name: pluginName,
      version: '1.0.0',
      type: 'module',
      main: './dist/index.js',
      peerDependencies: {
        '@ray/core': '>=1.0.0'
      }
    };

    const tsconfig = {
      compilerOptions: {
        target: 'ESNext',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true
      },
      include: ['src/**/*']
    };

    const srcCode = `import { RayPlugin } from '@ray/core';

export function ${pluginName.replace(/[^a-zA-Z0-9]/g, '')}(): RayPlugin {
  return {
    name: '${pluginName}',
    async transform(code, id) {
      // Add custom code transformations here
      return null;
    }
  };
}
`;

    const testCode = `import { ${pluginName.replace(/[^a-zA-Z0-9]/g, '')} } from './index.js';

describe('${pluginName}', () => {
  it('should instantiate correctly', () => {
    const p = ${pluginName.replace(/[^a-zA-Z0-9]/g, '')}();
    if (p.name !== '${pluginName}') {
      throw new Error('Plugin name mismatch');
    }
    console.log('Test passed!');
  });
});
`;

    const readme = `# ${pluginName}

Ray plugin template.

## Usage
Add to \`ray.config.ts\`:
\`\`\`typescript
import { ${pluginName.replace(/[^a-zA-Z0-9]/g, '')} } from '${pluginName}';

export default defineConfig({
  plugins: [
    ${pluginName.replace(/[^a-zA-Z0-9]/g, '')}()
  ]
});
\`\`\`
`;

    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
    fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
    fs.writeFileSync(path.join(targetDir, 'src/index.ts'), srcCode);
    fs.writeFileSync(path.join(targetDir, 'src/index.test.ts'), testCode);
    fs.writeFileSync(path.join(targetDir, 'README.md'), readme);

    console.log(`[Ray CLI] Plugin "${pluginName}" created successfully!`);
    process.exit(0);
  } else {
    const name = args[1];
    if (!name) {
      console.error('Error: Please specify a project name. E.g. ray create my-app');
      process.exit(1);
    }
    const templateIdx = args.indexOf('--template');
    const template = templateIdx !== -1 && args[templateIdx + 1] ? args[templateIdx + 1] : 'react-ts';
    try {
      runCreateProject(process.cwd(), name, template);
      process.exit(0);
    } catch (err: any) {
      console.error('Scaffolding failed:', err.message);
      process.exit(1);
    }
  }
} else if (command === 'doctor') {
  (async () => {
    try {
      const { runDoctor, printDoctorReport } = await import('@ray/core');
      const report = await runDoctor(process.cwd());
      printDoctorReport(report);
      process.exit(report.nodeOk && report.configOk ? 0 : 1);
    } catch (err: any) {
      console.error('Doctor command failed:', err.message);
      process.exit(1);
    }
  })();
} else if (command === 'stats') {
  (async () => {
    try {
      const { displayStats } = await import('@ray/core');
      displayStats(process.cwd());
      process.exit(0);
    } catch (err: any) {
      console.error('Stats command failed:', err.message);
      process.exit(1);
    }
  })();
} else if (command === 'benchmark') {
  (async () => {
    try {
      const { runBenchmark } = await import('@ray/core');
      const runsIdx = args.indexOf('--runs');
      const runs = runsIdx !== -1 && args[runsIdx + 1] ? parseInt(args[runsIdx + 1], 10) : 5;

      const compareIdx = args.indexOf('--compare');
      const compare = compareIdx !== -1 ? args[compareIdx + 1] : 'vite,webpack,parcel,rspack';

      const projectIdx = args.indexOf('--project');
      const project = projectIdx !== -1 ? args[projectIdx + 1] : 'small';

      await runBenchmark(process.cwd(), { runs, compare, project });
      process.exit(0);
    } catch (err: any) {
      console.error('Benchmark command failed:', err.message);
      process.exit(1);
    }
  })();
} else if (command === 'verify') {
  (async () => {
    try {
      const { runVerify, printVerifyReport } = await import('@ray/core');
      const report = await runVerify(process.cwd());
      printVerifyReport(report);
      const allOk = report.configOk && report.graphOk && report.cacheOk && report.ssrOk && report.buildOk;
      process.exit(allOk ? 0 : 1);
    } catch (err: any) {
      console.error('Verify command failed:', err.message);
      process.exit(1);
    }
  })();
} else if (command === 'release') {
  (async () => {
    try {
      const { runRelease } = await import('@ray/core');
      const versionIdx = args.indexOf('--version');
      const version = versionIdx !== -1 && args[versionIdx + 1] ? args[versionIdx + 1] : 'patch';
      const dryRun = args.includes('--dry-run');

      runRelease(process.cwd(), { version, dryRun });
      process.exit(0);
    } catch (err: any) {
      console.error('Release command failed:', err.message);
      process.exit(1);
    }
  })();
} else {
  console.log(`
 ⚡ Ray CLI (Milestone 15 - Ray Studio Visual Inspector) ⚡

Usage:
  ray dev             Start the live dev server
  ray dev --ssr       Start the live dev server with Server-Side Rendering
  ray dev --port N    Start the dev server on port N
  ray studio          Start the dev server and open Ray Studio dashboard
  ray build           Compile the project for production
  ray build --ssr     Compile the project for SSR production deployments
  ray build --ssg     Generate static HTML pre-rendered pages (SSG)
  ray preview         Serve static production build from dist/
  ray create <name>   Scaffold a new project (templates: react, react-ts, react-ssr, library)
  ray verify          Perform full project diagnostic checks
  ray release         Publish automation pipeline (bumping version, changelog, tagging)

Options for build:
  --outDir <path>     Specify production output directory (default: dist)
  --minify <boolean>  Toggle output minification (default: true)
  --sourcemap <type>  Specify sourcemap mode (inline, external, hidden; default: external)
  --watch             Incrementally watch and rebuild on changes
  --analyze           Print visual bundle file analysis report
`);
  process.exit(1);
}
