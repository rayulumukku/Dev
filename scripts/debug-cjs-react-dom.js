import fs from 'fs';
import { transformCjsToEsm } from '../packages/core/dist/compiler/cjsTransform.js';

const code = fs.readFileSync('node_modules/react-dom/index.js', 'utf-8');
const transformed = transformCjsToEsm(code);
console.log(transformed);
