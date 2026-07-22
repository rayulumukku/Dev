import fs from 'fs';
import path from 'path';

export function generateUtils(utilsDir: string, count: number) {
  fs.mkdirSync(utilsDir, { recursive: true });

  for (let i = 0; i < count; i++) {
    const code = `export function util${i}(val: number): number { return val + ${i}; }\nexport const CONSTANT_${i} = ${i * 42};\n`;
    fs.writeFileSync(path.join(utilsDir, `util_${i}.ts`), code);
  }
}
