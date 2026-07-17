import fs from 'fs';

const code = fs.readFileSync('tests/fixtures/ecosystem-project/.ray/cache/react.js', 'utf-8');
console.log('--- LAST 50 LINES of react.js ---');
console.log(code.split('\n').slice(-50).join('\n'));
