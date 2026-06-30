import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: '/usr/local/bin/node --import tsx/esm ./prisma/seed.ts',
  },
})
