import fs from 'fs';

const code = fs.readFileSync('tests/fixtures/ecosystem-project/.ray/cache/react.js', 'utf-8');
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
