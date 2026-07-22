export interface ExtensionCommand {
  id: string;
  cliCommand: string;
  description: string;
}

export const RAY_EXTENSION_COMMANDS: ExtensionCommand[] = [
  { id: 'ray.startDevServer', cliCommand: 'ray dev', description: 'Start Ray Dev Server' },
  { id: 'ray.buildProject', cliCommand: 'ray build', description: 'Build Ray Project for Production' },
  { id: 'ray.runBenchmark', cliCommand: 'npx ray-benchmark', description: 'Run Ray Performance Benchmarks' },
  { id: 'ray.migrateProject', cliCommand: 'ray migrate', description: 'Migrate Project to Ray' },
  { id: 'ray.createProject', cliCommand: 'npm create ray@latest', description: 'Scaffold new Ray project' },
  { id: 'ray.openBenchmarkReport', cliCommand: 'code benchmark-report.md', description: 'Open Benchmark Report' },
];

export function executeCommand(commandId: string): string | null {
  const cmd = RAY_EXTENSION_COMMANDS.find((c) => c.id === commandId);
  return cmd ? cmd.cliCommand : null;
}
