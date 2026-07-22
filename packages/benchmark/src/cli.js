import fs from 'fs';
import path from 'path';
import { executeBenchmark } from './Benchmark.js';
import { formatReportJSON, formatReportMarkdown, formatReportHTML } from './ReportGenerator.js';

export async function runBenchmarkCLI(args) {
  const bundlers = [];
  let projectScale = 'small';
  let runs = 10;
  let outputFormat = 'markdown';
  let seed = 42;
  let outDir = process.cwd();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--bundler' && args[i + 1]) {
      bundlers.push(args[i + 1]);
      i++;
    } else if (arg === '--project' && args[i + 1]) {
      projectScale = args[i + 1];
      i++;
    } else if (arg === '--runs' && args[i + 1]) {
      runs = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--output' && args[i + 1]) {
      outputFormat = args[i + 1];
      i++;
    } else if (arg === '--seed' && args[i + 1]) {
      seed = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (bundlers.length === 0) {
    bundlers.push('ray');
  }

  const options = {
    bundlers,
    projectScale,
    runs,
    outputFormat,
    outDir,
    seed,
  };

  console.log(`\n⚡ [Ray Benchmark] Executing benchmarks (${bundlers.join(', ')} | scale: ${projectScale} | seed: ${seed} | runs: ${runs})...`);

  const report = await executeBenchmark(options);

  let formatted = '';
  let filename = `benchmark-report.${outputFormat === 'markdown' ? 'md' : outputFormat}`;

  if (outputFormat === 'json') formatted = formatReportJSON(report);
  else if (outputFormat === 'html') formatted = formatReportHTML(report);
  else formatted = formatReportMarkdown(report);

  const outputPath = path.join(outDir, filename);
  fs.writeFileSync(outputPath, formatted);

  console.log(`\n🎉 Benchmark completed successfully! Report saved to ${outputPath}\n`);
  console.log(formatted);
}
