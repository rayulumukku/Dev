import fs from 'fs';

const code = fs.readFileSync('tests/fixtures/ecosystem-project/.ray/cache/react-dom.js', 'utf-8');
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('zx3uzseu')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
