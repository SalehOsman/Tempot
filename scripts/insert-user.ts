import { prisma } from '@tempot/database';
import { logger } from '@tempot/logger';

async function insertUser() {
  const telegramId = 7594239391n; // BigInt

  // Check if user exists
  const existingUser = await prisma.userProfile.findUnique({
    where: { telegramId },
  });

  if (existingUser) {
    logger.info({ msg: 'User already exists', user: existingUser });
    return;
  }

  // Insert user
  const user = await prisma.userProfile.create({
    data: {
      telegramId,
      username: 'super_admin',
      email: 'admin@tempot.com',
      language: 'ar',
      role: 'SUPER_ADMIN',
    },
  });

  logger.info({ msg: 'User created successfully', user });
}

insertUser()
  .catch((error) => {
    logger.error({ msg: 'Error inserting user', error: String(error) });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
