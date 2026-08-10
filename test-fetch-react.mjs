import http from 'http';
async function run() {
  const res = await new Promise((resolve) => {
    http.get(`http://localhost:3000/@ray/deps/react.js`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
  console.log(res);
}
run();
