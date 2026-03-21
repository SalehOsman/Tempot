import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

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
  console.log(`Schemas merged successfully to ${outputSchemaPath}`);
}

mergeSchemas().catch((err) => {
  console.error('Failed to merge schemas:', err);
  process.exit(1);
});
