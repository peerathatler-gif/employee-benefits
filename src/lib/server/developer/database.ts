/**
 * Database insight for the developer console — every query goes through the
 * shared Prisma Client (`db`):
 *  - model row counts via each model delegate's `count()`
 *  - MySQL table sizes via `information_schema` (`$queryRaw`, read-only)
 *  - migration history from Prisma's own `_prisma_migrations` table,
 *    compared against the local `prisma/migrations` folder.
 * Nothing here exposes the connection string or credentials.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Prisma } from '../../../generated/prisma/client';
import { db } from '../db';

export const MODEL_GROUPS: Record<string, Prisma.ModelName[]> = {
	identity: ['User', 'Session', 'PasswordResetToken'],
	organization: ['Department', 'Position', 'Employee'],
	benefits: [
		'BenefitCategory',
		'Benefit',
		'BenefitPolicy',
		'EmployeeBenefit',
		'BenefitRequest',
		'BenefitAttachment'
	],
	leave: ['LeaveType', 'LeaveBalance', 'LeaveRequest', 'LeaveAttachment'],
	system: ['Announcement', 'Notification', 'AuditLog', 'FeatureFlag', 'SystemEvent']
};

type CountDelegate = { count: () => Promise<number> };

function delegateFor(model: Prisma.ModelName): CountDelegate {
	const key = model.charAt(0).toLowerCase() + model.slice(1);
	return (db as unknown as Record<string, CountDelegate>)[key];
}

/** MySQL returns BIGINT columns as bigint through the mariadb driver. */
const num = (v: unknown): number => (v == null ? 0 : Number(v));

export interface ModelCount {
	model: Prisma.ModelName;
	rows: number;
}

export async function countModels(): Promise<ModelCount[]> {
	const models = Object.values(Prisma.ModelName);
	const counts = await Promise.all(models.map((m) => delegateFor(m).count()));
	return models.map((model, i) => ({ model, rows: counts[i] }));
}

export interface TableInfo {
	name: string;
	approxRows: number;
	dataBytes: number;
	indexBytes: number;
	engine: string | null;
	collation: string | null;
}

export async function tableSizes(): Promise<TableInfo[]> {
	const rows = await db.$queryRaw<
		Array<{
			name: string;
			approxRows: unknown;
			dataBytes: unknown;
			indexBytes: unknown;
			engine: string | null;
			collation: string | null;
		}>
	>`SELECT TABLE_NAME AS name, TABLE_ROWS AS approxRows, DATA_LENGTH AS dataBytes,
	         INDEX_LENGTH AS indexBytes, ENGINE AS engine, TABLE_COLLATION AS collation
	  FROM information_schema.TABLES
	  WHERE TABLE_SCHEMA = DATABASE()
	  ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC`;
	return rows.map((r) => ({
		name: r.name,
		approxRows: num(r.approxRows),
		dataBytes: num(r.dataBytes),
		indexBytes: num(r.indexBytes),
		engine: r.engine,
		collation: r.collation
	}));
}

export interface ServerInfo {
	databaseName: string | null;
	version: string | null;
	maxConnections: number | null;
	threadsConnected: number | null;
	uptimeSeconds: number | null;
}

export async function serverInfo(): Promise<ServerInfo> {
	const [[base], vars, status] = await Promise.all([
		db.$queryRaw<Array<{ dbName: string | null; version: string }>>`
			SELECT DATABASE() AS dbName, VERSION() AS version`,
		db.$queryRaw<Array<{ Variable_name: string; Value: string }>>`
			SHOW VARIABLES WHERE Variable_name = 'max_connections'`,
		db.$queryRaw<Array<{ Variable_name: string; Value: string }>>`
			SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected', 'Uptime')`
	]);
	const statusOf = (name: string) => {
		const v = status.find((s) => s.Variable_name === name)?.Value;
		return v == null ? null : Number(v);
	};
	return {
		databaseName: base?.dbName ?? null,
		version: base?.version ?? null,
		maxConnections: vars[0] ? Number(vars[0].Value) : null,
		threadsConnected: statusOf('Threads_connected'),
		uptimeSeconds: statusOf('Uptime')
	};
}

export interface MigrationInfo {
	name: string;
	status: 'applied' | 'failed' | 'rolled-back' | 'pending';
	startedAt: string | null;
	finishedAt: string | null;
	steps: number;
}

export async function migrations(): Promise<MigrationInfo[]> {
	const applied = await db.$queryRaw<
		Array<{
			migration_name: string;
			started_at: Date | null;
			finished_at: Date | null;
			rolled_back_at: Date | null;
			applied_steps_count: unknown;
		}>
	>`SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count
	  FROM _prisma_migrations ORDER BY started_at`;

	const result: MigrationInfo[] = applied.map((m) => ({
		name: m.migration_name,
		status: m.rolled_back_at ? 'rolled-back' : m.finished_at ? 'applied' : 'failed',
		startedAt: m.started_at ? new Date(m.started_at).toISOString() : null,
		finishedAt: m.finished_at ? new Date(m.finished_at).toISOString() : null,
		steps: num(m.applied_steps_count)
	}));

	// Local migration folders that the database has never seen = pending.
	try {
		const dir = path.resolve('prisma', 'migrations');
		const known = new Set(result.map((m) => m.name));
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory() && !known.has(entry.name)) {
				result.push({
					name: entry.name,
					status: 'pending',
					startedAt: null,
					finishedAt: null,
					steps: 0
				});
			}
		}
	} catch {
		// Migrations folder not shipped next to the build — show DB history only.
	}
	return result;
}

export const prismaInfo = {
	clientVersion: Prisma.prismaVersion.client,
	adapter: '@prisma/adapter-mariadb',
	provider: 'mysql'
};
