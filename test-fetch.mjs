import http from 'http';
const files = [
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/app/layout.jsx',
  '/src/app/page.jsx',
  '/src/doc.mdx?import',
  '/src/math.wasm?import'
];

async function run() {
  for (const file of files) {
    const res = await new Promise((resolve) => {
      http.get(`http://localhost:3000${file}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
    });
    console.log(`\n\n=== ${file} ===\n\n`);
    console.log(res);
  }
}

run();
