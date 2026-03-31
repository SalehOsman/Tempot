import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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
 * Prisma's Exact<A, Args<T, 'delete'>> narrows to this at runtime.
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
 * The Prisma extension API passes { args, query } to each hook.
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
 * Define model extensions for soft delete.
 * These override delete/deleteMany to set isDeleted instead of removing rows.
 *
 * Note: Prisma's extension typing for $allModels uses complex mapped generics
 * (Prisma.Exact<A, Prisma.Args<T, 'delete'>>). The runtime values are typed above.
 * The `this: T` context provides getExtensionContext() which returns the delegate.
 */
const modelExtensions = {
  $allModels: {
    async delete<T, A>(this: T, args: Prisma.Exact<A, Prisma.Args<T, 'delete'>>) {
      const context = Prisma.getExtensionContext(this);
      const typedArgs = args as unknown as DeleteArgs;
      const data: SoftDeleteData = typedArgs.data ?? {};
      return (context as Record<string, (...args: unknown[]) => unknown>).update({
        ...typedArgs,
        data: {
          ...data,
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    },
    async deleteMany<T, A>(this: T, args: Prisma.Exact<A, Prisma.Args<T, 'deleteMany'>>) {
      const context = Prisma.getExtensionContext(this);
      const typedArgs = args as unknown as DeleteManyArgs;
      const data: SoftDeleteData = typedArgs.data ?? {};
      return (context as Record<string, (...args: unknown[]) => unknown>).updateMany({
        ...typedArgs,
        data: {
          ...data,
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    },
  },
};

/**
 * Define query extensions for global filters.
 * These inject isDeleted: false into all read queries.
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
      if (result && (result as SoftDeletableRecord).isDeleted) {
        return null;
      }
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
  // which conflicts with our @types/pg@8.20.0. The types are structurally
  // compatible at runtime; we assert via ConstructorParameters to avoid `any`.
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
 * Prisma client instance with soft delete and global where filters.
 * Initialized lazily on first property access via Proxy.
 *
 * The Proxy target is typed as ExtendedPrismaClient. At runtime, every
 * property access delegates to the real client returned by getPrismaClient().
 */
export const prisma = new Proxy({} as ExtendedPrismaClient, {
  get: (_target, prop: string | symbol) => {
    const client = getPrismaClient();
    return client[prop as keyof typeof client];
  },
});

export { Prisma, PrismaClient };
export * from '@prisma/client';
