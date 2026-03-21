import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// For production/runtime, we initialize the pool here
// In tests, we might want to override this or use a different instance
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

/**
 * Prisma client instance with soft delete and global where filters
 */
export const prisma = new PrismaClient({ adapter }).$extends({
  model: {
    $allModels: {
      async delete<T, A>(this: T, args: Prisma.Exact<A, Prisma.Args<T, 'delete'>>) {
        const context = Prisma.getExtensionContext(this);
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return (context as any).update({
          ...args,
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      },
      async deleteMany<T, A>(this: T, args: Prisma.Exact<A, Prisma.Args<T, 'deleteMany'>>) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).updateMany({
          ...args,
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
        /* eslint-enable @typescript-eslint/no-explicit-any */
      },
    },
  },
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { isDeleted: false, ...args.where };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { isDeleted: false, ...args.where };
        return query(args);
      },
      async findUnique({ args, query }) {
        return query(args);
      },
      async count({ args, query }) {
        args.where = { isDeleted: false, ...args.where };
        return query(args);
      },
    },
  },
});
