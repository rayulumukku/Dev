const fs = require('fs');
const lines = fs.readFileSync('packages/core/src/compiler/lexer.ts', 'utf-8').split('\n');
const idx = lines.findIndex(l => l.includes('char === \\\'<\\\'') || l.includes('char === "<"'));
console.log(lines.slice(idx - 10, idx + 40).join('\n'));
