import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function mergeSchemas() {
  const baseSchemaPath = path.resolve(__dirname, '../prisma/base.prisma');
  const outputSchemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

  const baseSchema = await fs.readFile(baseSchemaPath, 'utf-8');

  // Find all module schemas
  // Root of monorepo is ../../
  const moduleSchemas = await glob('../../modules/*/database/*.prisma');

  let finalSchema = baseSchema;
  for (const schemaPath of moduleSchemas) {
    const content = await fs.readFile(schemaPath, 'utf-8');
    finalSchema += `\n// From ${schemaPath}\n${content}`;
  }

  await fs.writeFile(outputSchemaPath, finalSchema);
  process.stderr.write(
    JSON.stringify({
      level: 'info',
      msg: 'Schemas merged successfully',
      output: outputSchemaPath,
    }) + '\n',
  );
}

mergeSchemas().catch((error) => {
  process.stderr.write(
    JSON.stringify({ level: 'error', msg: 'Failed to merge schemas', error: String(error) }) + '\n',
  );
  process.exit(1);
});
