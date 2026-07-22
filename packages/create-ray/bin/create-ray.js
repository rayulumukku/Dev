#!/usr/bin/env node

import { runCreate } from '../src/index.js';

runCreate(process.argv.slice(2)).catch((err) => {
  console.error('\n❌ Error during project creation:', err.message || err);
  process.exit(1);
});
