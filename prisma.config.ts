// Prisma 7 CLI configuration (migrate / db seed / studio). Application code
// does NOT read this file — see src/lib/server/db.ts for how PrismaClient is
// instantiated at runtime with an explicit driver adapter.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
		seed: 'tsx prisma/seed.ts'
	},
	datasource: {
		url: env('DATABASE_URL'),
		// `prisma migrate dev` needs a scratch database to diff against. The
		// app's DB user only has privileges on its own two databases (no
		// global CREATE), so we point this at a pre-created, dedicated shadow
		// database instead of letting Prisma create/drop a randomly-named one.
		shadowDatabaseUrl: env('SHADOW_DATABASE_URL')
	}
});
