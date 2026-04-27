import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const referenceDir = path.resolve(currentDir, '..', '..', '..', 'docs', 'product', 'reference');

fs.rmSync(referenceDir, { recursive: true, force: true });
