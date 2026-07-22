import fs from 'fs';
import path from 'path';

export function generateAssets(assetsDir, count, prng) {
  fs.mkdirSync(assetsDir, { recursive: true });

  for (let i = 0; i < count; i++) {
    const assetType = i % 4;

    if (assetType === 0) {
      const colorHex = Math.floor(prng.nextFloat() * 16777215).toString(16).padStart(6, '0');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#${colorHex}"/></svg>`;
      fs.writeFileSync(path.join(assetsDir, `asset_${i}.svg`), svg);
    } else if (assetType === 1) {
      const css = `.asset-class-${i} { color: #${i}12345; padding: ${i % 20}px; }\n`;
      fs.writeFileSync(path.join(assetsDir, `asset_${i}.css`), css);
    } else if (assetType === 2) {
      const json = JSON.stringify({ id: i, name: `Asset ${i}`, active: true, value: prng.nextInt(1, 1000) });
      fs.writeFileSync(path.join(assetsDir, `asset_${i}.json`), json);
    } else {
      const md = `# Asset ${i}\n\nGenerated benchmark Markdown file for index ${i}.\n`;
      fs.writeFileSync(path.join(assetsDir, `asset_${i}.md`), md);
    }
  }
}
