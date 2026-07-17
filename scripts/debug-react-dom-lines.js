import fs from 'fs';

const code = fs.readFileSync('tests/fixtures/ecosystem-project/.ray/cache/react-dom.js', 'utf-8');
const lines = code.split('\n');
console.log('--- react-dom.js lines 315 to 345 ---');
console.log(lines.slice(314, 345).join('\n'));
