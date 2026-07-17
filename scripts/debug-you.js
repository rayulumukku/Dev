import fs from 'fs';

const code = fs.readFileSync('tests/fixtures/ecosystem-project/.ray/cache/react-dom.js', 'utf-8');
const lines = code.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export default')) {
    count++;
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
console.log('Total export default statements:', count);
