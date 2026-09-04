#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entryPath = fs.existsSync(path.resolve(__dirname, '../dist/index.js'))
  ? '../dist/index.js'
  : '../src/index.js';

const { runCreate } = await import(entryPath);

runCreate(process.argv.slice(2)).catch((err) => {
  console.error('\n❌ Error during project creation:', err.message || err);
  process.exit(1);
});

