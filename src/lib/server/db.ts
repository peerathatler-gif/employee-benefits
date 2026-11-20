/**
 * Single shared Prisma client for the whole server.
 *
 * Prisma 7 ships a "no Rust engine" client: it talks to the database only
 * through an explicit driver adapter. For MySQL that adapter is
 * `@prisma/adapter-mariadb` (the `mariadb` npm driver also understands
 * standard MySQL wire protocol / connection strings).
 *
 * In dev, Vite reloads modules on every change; without the global cache
 * below each reload would open a fresh connection pool and eventually
 * exhaust MySQL's connection limit.
 */
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
	// A bare connection string; the `mariadb` driver's own sensible pool
	// defaults apply (its default pool size is already small and finite).
	const adapter = new PrismaMariaDb(env.DATABASE_URL);
	return new PrismaClient({ adapter });
}

export const db: PrismaClient = globalForPrisma.prisma ?? createClient();

if (!env.isProduction) {
	globalForPrisma.prisma = db;
}
