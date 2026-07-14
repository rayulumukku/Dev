import { transformJsx } from '@ray/transform';
import { buildProject } from '@ray/core';
import { planUpdates } from '../packages/dev-server/dist/updatePlanner.js';
import { RayCore } from '@ray/core';
import fs from 'fs';
import path from 'path';

async function runBenchmarks() {
  console.log('================================================');
  console.log('⚡ Starting Ray Compilation & Build Benchmarks ⚡');
  console.log('================================================\n');

  // Benchmark 1: Dynamic JSX Transformation Latency
  console.log('📊 Benchmark 1: Dynamic JSX Compiler Latency');
  const demoAppPath = path.join(process.cwd(), 'demo/src/App.jsx');
  if (fs.existsSync(demoAppPath)) {
    const rawContent = fs.readFileSync(demoAppPath, 'utf-8');
    
    // Warm-up run
    await transformJsx(rawContent, demoAppPath);
    
    const iterations = 50;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await transformJsx(rawContent, demoAppPath);
    }
    const end = performance.now();
    const avg = (end - start) / iterations;
    console.log(`   [esbuild.transform] Average compilation time: ${avg.toFixed(3)} ms (based on ${iterations} runs)`);
  } else {
    console.log('   App.jsx not found, skipping Benchmark 1.');
  }

  // Benchmark 2: Dependency Graph & HMR Update Planner Latency
  console.log('\n📊 Benchmark 2: Dependency Graph HMR Resolving Speed');
  const ray = new RayCore(path.join(process.cwd(), 'demo'));
  // Load files to build dependency graph
  const mainPath = path.join(process.cwd(), 'demo/src/main.jsx');
  const appPath = path.join(process.cwd(), 'demo/src/App.jsx');
  if (fs.existsSync(mainPath) && fs.existsSync(appPath)) {
    await ray.transform(fs.readFileSync(mainPath, 'utf-8'), mainPath);
    await ray.transform(fs.readFileSync(appPath, 'utf-8'), appPath);
    
    const start = performance.now();
    const result = planUpdates(ray, appPath, Date.now());
    const end = performance.now();
    console.log(`   [Update Planner] Traversal and boundary planning duration: ${(end - start).toFixed(3)} ms`);
    console.log(`   [Update Planner] Boundary found: ${JSON.stringify(result.updates)}`);
  } else {
    console.log('   Demo source files not found, skipping Benchmark 2.');
  }

  // Benchmark 3: Production Build Latency
  console.log('\n📊 Benchmark 3: Production Build Pipeline Output');
  // Store original directory, switch to demo directory to simulate ray build
  const originalDir = process.cwd();
  process.chdir(path.join(process.cwd(), 'demo'));
  
  try {
    const start = performance.now();
    await buildProject({
      outDir: 'dist',
      minify: true,
      sourcemap: 'external',
      watch: false,
      analyze: false
    });
    const end = performance.now();
    console.log(`   [Production Builder] Completed in ${(end - start).toFixed(2)} ms`);
  } catch (err) {
    console.error('   Production build benchmark failed:', err);
  } finally {
    process.chdir(originalDir);
  }
  
  console.log('\n================================================');
  console.log('⚡ Benchmarks Completed Successfully! ⚡');
  console.log('================================================');
}

runBenchmarks().catch(console.error);
