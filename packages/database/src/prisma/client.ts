import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/* eslint-disable @typescript-eslint/no-explicit-any */

let _prisma: any;

/**
 * Define model extensions for soft delete
 */
const modelExtensions = {
  $allModels: {
    async delete<T, A>(this: T, args: Prisma.Exact<A, Prisma.Args<T, 'delete'>>) {
      const context = Prisma.getExtensionContext(this);
      const data = (args as any).data || {};
      return (context as any).update({
        ...args,
        data: {
          ...data,
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    },
    async deleteMany<T, A>(this: T, args: Prisma.Exact<A, Prisma.Args<T, 'deleteMany'>>) {
      const context = Prisma.getExtensionContext(this);
      const data = (args as any).data || {};
      return (context as any).updateMany({
        ...args,
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
 * Define query extensions for global filters
 */
const queryExtensions = {
  $allModels: {
    async findMany({ args, query }: any) {
      args.where = { isDeleted: false, ...args.where };
      return query(args);
    },
    async findFirst({ args, query }: any) {
      args.where = { isDeleted: false, ...args.where };
      return query(args);
    },
    async findUnique({ args, query }: any) {
      const result = await query(args);
      if (result && (result as any).isDeleted) {
        return null;
      }
      return result;
    },
    async count({ args, query }: any) {
      args.where = { isDeleted: false, ...args.where };
      return query(args);
    },
  },
};

/**
 * Internal function to initialize Prisma with the current DATABASE_URL
 */
function getPrismaClient() {
  if (!_prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // Pool will throw if connectionString is missing
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    _prisma = new PrismaClient({ adapter }).$extends({
      model: modelExtensions,
      query: queryExtensions,
    });
  }
  return _prisma;
}

/**
 * Prisma client instance with soft delete and global where filters.
 * Initialized lazily on first access.
 */
export const prisma = new Proxy({} as any, {
  get: (_target, prop) => {
    return (getPrismaClient() as any)[prop];
  },
});

/* eslint-enable @typescript-eslint/no-explicit-any */
