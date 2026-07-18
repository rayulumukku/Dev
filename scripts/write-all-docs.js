import fs from 'fs';
import path from 'path';

const docsDir = path.resolve('docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const docs = {
  'introduction.md': `# Introduction to Ray

Ray is a next-generation, high-performance web compiler and bundler designed for high developer velocity. It leverages a native Rust compilation backend with transparent TypeScript compiler fallbacks.

## Key Design Pillars
* **Speed**: Parallel scheduling and incremental caching.
* **Flexibility**: Fully extensible plugin architecture.
* **DX**: Colorized diagnostic reporting, visual telemetry dashboard, and integrated doctor tools.
`,
  'installation.md': `# Installation

To install Ray, use npm, pnpm, or yarn.

\`\`\`bash
npm install @ray/cli @ray/core --save-dev
\`\`\`

Ensure you have Node.js >= 18 installed.
`,
  'quick-start.md': `# Quick Start

Get up and running with Ray in a few commands.

## 1. Initialize a Project
\`\`\`bash
npx ray create my-app --template react-ts
cd my-app
\`\`\`

## 2. Start Dev Server
\`\`\`bash
npx ray dev
\`\`\`

## 3. Build for Production
\`\`\`bash
npx ray build
\`\`\`
`,
  'cli.md': `# CLI Documentation

Ray comes with an interactive, diagnostic-driven command-line interface.

## Commands
* \`ray dev\`: Launches the live development server with fast HMR.
* \`ray build\`: Compiles modules for production deployments.
* \`ray preview\`: Serves build outputs for verification.
* \`ray doctor\`: Validates project, system, and package configurations.
* \`ray stats\`: Displays active engine telemetry and memory usage metrics.
* \`ray inspect\`: Inspects configurations and active plugins list.
* \`ray verify\`: Runs a full self-test verification of dev-server, HMR, compiler, and release artifacts.
`,
  'configuration.md': `# Configuration

Configure Ray through a \`ray.config.ts\` or \`ray.config.js\` file in your project root.

\`\`\`typescript
import { defineConfig } from '@ray/core';

export default defineConfig({
  mode: 'development',
  outDir: 'dist',
  plugins: [],
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
\`\`\`
`,
  'plugin-api.md': `# Plugin API

Extend Ray's behavior by implementing custom plugins.

## Interface
\`\`\`typescript
export interface RayPlugin {
  name: string;
  configResolved?(config: any): void | Promise<void>;
  buildStart?(): void | Promise<void>;
  resolveId?(id: string, importer?: string): string | null | Promise<string | null>;
  load?(id: string): string | null | Promise<string | null>;
  transform?(code: string, id: string): { code: string; map?: any } | null | Promise<{ code: string; map?: any } | null>;
  buildEnd?(): void | Promise<void>;
}
\`\`\`
`,
  'compiler.md': `# Compiler Architecture

Ray routes JavaScript, TypeScript, JSX, and TSX files through distinct compiler stages.

* **Lexer**: Tokenizes source files.
* **Parser**: Generates a typed AST representation.
* **Optimizer**: Performs dead-code elimination, scope optimization, and tree shaking.
* **Code Generator**: Generates ES-compliant target JS with source maps.
`,
  'hmr.md': `# Hot Module Replacement (HMR)

Ray utilizes a custom Hot Module Replacement engine for instant page updates.

* Files are watched for changes.
* Changed modules trigger graph invalidation.
* Update planner traverses the graph to find accepting boundaries.
* Playloads containing updated code are pushed to active clients via WebSockets.
`,
  'ssr.md': `# Server-Side Rendering (SSR)

Build SSR-capable frontends with Ray.

Use \`ray dev --ssr\` to launch dev-server with server rendering capabilities, and load modules dynamically via \`ssrLoadModule\`.

\`\`\`typescript
const render = (await core.ssrLoadModule('src/entry-server.jsx')).render;
const { html } = await render(url);
\`\`\`
`,
  'library-mode.md': `# Library Mode

Ray supports packaging codebases as reusable libraries.

Enable library mode with the \`--lib\` flag:

\`\`\`bash
ray build --lib --entry src/index.ts --name MyLibrary --formats esm,cjs,umd
\`\`\`
`,
  'performance.md': `# Performance Tuning

Maximize compilations speed and reduce bundle sizes.

* Utilize the native Rust compiler by building Rust binaries.
* Keep dependencies optimized through pre-bundling.
* Ensure caching is verified and active.
`,
  'benchmarks.md': `# Benchmarks

Ray performance is tracked across 8 metrics and compared against Vite, Parcel, and Rspack.

Run benchmarks locally using:
\`\`\`bash
ray benchmark
\`\`\`
Metrics are outputted to \`benchmark-report.json\` and \`benchmark-report.html\`.
`,
  'troubleshooting.md': `# Troubleshooting

Common errors and solutions.

* **Missing Rust Binary**: Run \`cargo build --release\` inside compiler-rust to compile the native wrapper.
* **Port in Use**: Override ports with the \`--port <port>\` CLI argument.
`,
  'faq.md': `# Frequently Asked Questions

* **Can I use Tailwind CSS?** Yes, configure the Tailwind CSS plugin in \`ray.config.ts\`.
* **Does Ray support TypeScript?** Out of the box, with type checking and TSX compile support.
`,
  'migration-guide.md': `# Migration Guide

Migrate projects from Vite to Ray.

Run the automatic migration doctor:
\`\`\`bash
ray doctor --fix
\`\`\`
This parses your current configurations and sets up suitable Ray plugins.
`,
  'contributing-guide.md': `# Contributing Guide

Thank you for contributing to Ray!

## Development Setup
1. Clone repo.
2. Run \`npm install\`.
3. Compile packages with \`npm run build\`.
4. Run tests with \`npm test\`.
`,
  'release-guide.md': `# Release Guide

Ray automates the packaging and release pipeline.

Run the release CLI:
\`\`\`bash
ray release --version <patch|minor|major>
\`\`\`
`
};

for (const [filename, content] of Object.entries(docs)) {
  fs.writeFileSync(path.join(docsDir, filename), content.trim() + '\n', 'utf-8');
  console.log(`Created docs/${filename}`);
}
console.log('All docs files written successfully!');
