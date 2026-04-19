/**
 * ESM/CJS interop for @prisma/client.
 *
 * Problem: In production Docker deploys, Node.js ESM runtime cannot statically
 * resolve named exports from CJS modules, causing:
 *   "SyntaxError: Named export 'Prisma' not found."
 *
 * Solution: Import types only from @prisma/client (erased at compile time),
 * and load the runtime values via createRequire which forces CJS resolution.
 * This satisfies both TypeScript (types are correct) and Node.js (no ESM/CJS crash).
 */
import type { PrismaClient as PrismaClientType, Prisma } from '@prisma/client';
import { createRequire } from 'node:module';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load @prisma/client as CJS at runtime — works in both dev and Docker production.
const _require = createRequire(import.meta.url);
const { PrismaClient } = _require('@prisma/client') as {
  PrismaClient: typeof PrismaClientType;
};

export type { Prisma };
export { PrismaClient };

/**
 * Extended Prisma client type after applying soft-delete extensions.
 * Prisma's $extends() returns a complex branded type that cannot be
 * expressed as a simple generic — we capture it as the return type of buildExtendedClient().
 */
type ExtendedPrismaClient = ReturnType<typeof buildExtendedClient>;

let _prisma: ExtendedPrismaClient | undefined;

/**
 * Soft-delete data shape passed via the `data` field in delete args.
 */
interface SoftDeleteData {
  deletedBy?: string | null;
  [key: string]: unknown;
}

/**
 * Args shape for the model extension delete override.
 */
interface DeleteArgs {
  where: Record<string, unknown>;
  data?: SoftDeleteData;
  [key: string]: unknown;
}

/**
 * Args shape for the model extension deleteMany override.
 */
interface DeleteManyArgs {
  where?: Record<string, unknown>;
  data?: SoftDeleteData;
  [key: string]: unknown;
}

/**
 * Prisma query extension callback arguments for $allModels operations.
 */
interface QueryExtensionArgs<TArgs> {
  args: TArgs;
  query: (args: TArgs) => Promise<unknown>;
}

/**
 * Args for find/count query extensions that have a `where` clause.
 */
interface WhereArgs {
  where?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Result shape from findUnique that may have isDeleted flag.
 */
interface SoftDeletableRecord {
  isDeleted?: boolean;
  [key: string]: unknown;
}

/**
 * Soft-delete model extensions.
 * Override delete/deleteMany to set isDeleted instead of removing rows.
 *
 * Note: Prisma.Exact and Prisma.Args are type-only — they are erased at runtime.
 * The `this: T` context provides getExtensionContext() at runtime.
 */
const modelExtensions = {
  $allModels: {
    async delete<T, A>(this: T, args: Prisma.Exact<A, Prisma.Args<T, 'delete'>>) {
      const { Prisma: PrismaRuntime } = _require(
        '@prisma/client',
      ) as typeof import('@prisma/client');
      const context = PrismaRuntime.getExtensionContext(this);
      const typedArgs = args as unknown as DeleteArgs;
      const data: SoftDeleteData = typedArgs.data ?? {};
      return (context as Record<string, (...args: unknown[]) => unknown>).update({
        ...typedArgs,
        data: { ...data, isDeleted: true, deletedAt: new Date() },
      });
    },
    async deleteMany<T, A>(this: T, args: Prisma.Exact<A, Prisma.Args<T, 'deleteMany'>>) {
      const { Prisma: PrismaRuntime } = _require(
        '@prisma/client',
      ) as typeof import('@prisma/client');
      const context = PrismaRuntime.getExtensionContext(this);
      const typedArgs = args as unknown as DeleteManyArgs;
      const data: SoftDeleteData = typedArgs.data ?? {};
      return (context as Record<string, (...args: unknown[]) => unknown>).updateMany({
        ...typedArgs,
        data: { ...data, isDeleted: true, deletedAt: new Date() },
      });
    },
  },
};

/**
 * Global query extensions — inject isDeleted: false into all read queries.
 */
const queryExtensions = {
  $allModels: {
    async findMany({ args, query }: QueryExtensionArgs<WhereArgs>) {
      args.where = { isDeleted: false, ...(args.where ?? {}) };
      return query(args);
    },
    async findFirst({ args, query }: QueryExtensionArgs<WhereArgs>) {
      args.where = { isDeleted: false, ...(args.where ?? {}) };
      return query(args);
    },
    async findUnique({ args, query }: QueryExtensionArgs<WhereArgs>) {
      const result = await query(args);
      if (result && (result as SoftDeletableRecord).isDeleted) return null;
      return result;
    },
    async count({ args, query }: QueryExtensionArgs<WhereArgs>) {
      args.where = { isDeleted: false, ...(args.where ?? {}) };
      return query(args);
    },
  },
};

/**
 * Build the extended Prisma client with soft-delete model + query extensions.
 * Extracted as a named function so we can capture ReturnType for the type alias.
 */
function buildExtendedClient(pool: Pool) {
  // PrismaPg expects its own bundled @types/pg@8.11.11 Pool type,
  // which conflicts with our @types/pg@8.20.0. Structurally compatible at runtime.
  const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0]);
  return new PrismaClient({ adapter }).$extends({
    model: modelExtensions,
    query: queryExtensions,
  });
}

/**
 * Internal function to initialize Prisma with the current DATABASE_URL.
 * Throws a fatal error at startup if DATABASE_URL is not configured.
 */
function getPrismaClient(): ExtendedPrismaClient {
  if (!_prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'FATAL: DATABASE_URL environment variable is not set. ' +
          'Copy .env.example to .env and configure it.',
      );
    }
    const pool = new Pool({ connectionString });
    _prisma = buildExtendedClient(pool);
  }
  return _prisma;
}

/**
 * Prisma client singleton — lazy proxy, initialized on first access.
 */
export const prisma = new Proxy({} as ExtendedPrismaClient, {
  get: (_target, prop: string | symbol) => {
    const client = getPrismaClient();
    return client[prop as keyof typeof client];
  },
});
