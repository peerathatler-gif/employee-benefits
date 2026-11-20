/**
 * Live system health snapshot for the developer console. Everything here
 * is measured at request time — no cached or invented numbers. Nothing in
 * this module may expose secrets (connection strings, SMTP passwords, ...):
 * only booleans like "SMTP configured" and non-sensitive runtime facts.
 */
import os from 'node:os';
import { db } from '../db';
import { env } from '../env';

export interface DatabaseHealth {
	ok: boolean;
	latencyMs: number | null;
	version: string | null;
	error: string | null;
}

export interface RuntimeInfo {
	nodeVersion: string;
	platform: string;
	hostname: string;
	pid: number;
	uptimeSeconds: number;
	systemUptimeSeconds: number;
	environment: string;
	timezone: string;
	currency: string;
	smtpConfigured: boolean;
	memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
	system: { totalMemMb: number; freeMemMb: number; cpuCount: number; loadAvg: number[] };
}

const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

export async function checkDatabase(): Promise<DatabaseHealth> {
	const started = performance.now();
	try {
		const rows = await db.$queryRaw<Array<{ v: string }>>`SELECT VERSION() AS v`;
		const latencyMs = Math.round((performance.now() - started) * 10) / 10;
		return { ok: true, latencyMs, version: rows[0]?.v ?? null, error: null };
	} catch (err) {
		// Only the error class/code goes to the UI — driver messages can echo
		// host names or user names from the connection string.
		const code =
			err && typeof err === 'object' && 'code' in err
				? String((err as { code: unknown }).code)
				: null;
		console.error('[developer/health] database check failed', err);
		return { ok: false, latencyMs: null, version: null, error: code ?? 'UNREACHABLE' };
	}
}

export function runtimeInfo(): RuntimeInfo {
	const mem = process.memoryUsage();
	return {
		nodeVersion: process.version,
		platform: `${process.platform} ${os.release()} (${process.arch})`,
		hostname: os.hostname(),
		pid: process.pid,
		uptimeSeconds: Math.round(process.uptime()),
		systemUptimeSeconds: Math.round(os.uptime()),
		environment: process.env.NODE_ENV || 'development',
		timezone: env.APP_TIMEZONE,
		currency: env.APP_CURRENCY,
		smtpConfigured: env.smtpConfigured,
		memory: {
			rssMb: toMb(mem.rss),
			heapUsedMb: toMb(mem.heapUsed),
			heapTotalMb: toMb(mem.heapTotal)
		},
		system: {
			totalMemMb: toMb(os.totalmem()),
			freeMemMb: toMb(os.freemem()),
			cpuCount: os.cpus().length,
			loadAvg: os.loadavg().map((n) => Math.round(n * 100) / 100)
		}
	};
}
