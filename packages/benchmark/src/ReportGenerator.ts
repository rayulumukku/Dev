import { BenchmarkReport } from './types.js';

export function formatReportJSON(report: BenchmarkReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatReportMarkdown(report: BenchmarkReport): string {
  let md = `# Ray Benchmark Report\n\n`;
  md += `**Timestamp:** ${report.timestamp}\n\n`;
  md += `## Environment\n\n`;
  md += `- **OS:** ${report.environment.os}\n`;
  md += `- **CPU:** ${report.environment.cpu}\n`;
  md += `- **RAM:** ${report.environment.totalRamGB} GB\n`;
  md += `- **Node Version:** ${report.environment.nodeVersion}\n`;
  md += `- **Package Manager:** ${report.environment.packageManager}\n\n`;

  md += `## Settings\n\n`;
  md += `- **Project Scale:** ${report.settings.projectScale}\n`;
  md += `- **Runs:** ${report.settings.runs}\n\n`;

  md += `## Summary Statistics\n\n`;
  md += `| Bundler | Build Time (mean) | Cold Start (mean) | Memory (peak) | Bundle Size |\n`;
  md += `|---|---|---|---|---|\n`;

  for (const [bundler, data] of Object.entries(report.results)) {
    md += `| ${bundler} | ${data.summary.buildTime.mean} ms | ${data.summary.coldStartTime.mean} ms | ${data.summary.peakMemoryMB.mean} MB | ${data.summary.bundleSizeBytes.mean} bytes |\n`;
  }

  return md;
}

export function formatReportHTML(report: BenchmarkReport): string {
  const md = formatReportMarkdown(report);
  return `<!DOCTYPE html><html><head><title>Benchmark Report</title><style>body{font-family:sans-serif;padding:2rem;background:#0f172a;color:#fff;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #334155;padding:8px;text-align:left;}th{background:#1e293b;}</style></head><body><pre>${md}</pre></body></html>`;
}
