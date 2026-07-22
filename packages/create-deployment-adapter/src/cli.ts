import fs from 'fs';
import path from 'path';

export function scaffoldAdapter(targetDir: string, adapterName: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

  const pkgJson = {
    name: `ray-adapter-${adapterName}`,
    version: '1.0.0',
    type: 'module',
    main: './dist/index.js',
  };

  const indexTs = `import { defineDeploymentAdapter } from '@ray/deployment';

export default defineDeploymentAdapter({
  name: '${adapterName}',
  capabilities: { static: true, node: true, edge: false, ssr: true, ssg: true },
  async prepare() {},
  async validate() { return true; },
  async bundle() {},
  async generateManifest() { return { adapter: '${adapterName}' }; },
  async finalize() {},
});
`;

  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
  fs.writeFileSync(path.join(targetDir, 'src/index.ts'), indexTs);
}

const args = process.argv.slice(2);
if (args.length > 0) {
  const name = args[0];
  scaffoldAdapter(path.resolve(process.cwd(), name), name);
  console.log(`🚀 Ray Deployment Adapter "${name}" scaffolded cleanly!`);
}
