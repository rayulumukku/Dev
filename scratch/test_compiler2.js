import fs from 'fs';
async function run() {
  const compiler = await import('file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/dist/index.js');
  const code = fs.readFileSync('scratch/esbuild_scheduler.js', 'utf-8');
  const res = new compiler.RayCompiler({}).compile(code, 'scheduler.js');
  fs.writeFileSync('scratch/scheduler_out2.js', res.code);
}
run().catch(console.error);
