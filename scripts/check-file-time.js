import fs from 'fs';

try {
  const stat = fs.statSync('tests/fixtures/ecosystem-project/.ray/cache/react-dom.js');
  console.log('Size:', stat.size);
  console.log('Modified time:', stat.mtime);
} catch (err) {
  console.error(err.message);
}
