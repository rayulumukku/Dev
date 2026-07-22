import fs from 'fs';
import path from 'path';

export function generateReactComponents(componentsDir, count) {
  fs.mkdirSync(componentsDir, { recursive: true });

  for (let i = 0; i < count; i++) {
    const parentImport = i > 0 ? `import Component${i - 1} from './Component${i - 1}';\n` : '';
    const parentJSX = i > 0 ? `<Component${i - 1} />` : '';

    const code = `import React from 'react';\n${parentImport}\nexport function Component${i}() {\n  return (\n    <div className="component-${i}">\n      <span>Component ${i}</span>\n      ${parentJSX}\n    </div>\n  );\n}\nexport default Component${i};\n`;

    fs.writeFileSync(path.join(componentsDir, `Component${i}.tsx`), code);
  }
}
