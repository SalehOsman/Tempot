import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  engineType: 'library',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
