import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { checkDatabase, runtimeInfo } from '$lib/server/developer/health';

const SEVERITIES = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const;
type Severity = (typeof SEVERITIES)[number];

/** Developer console overview: live health + real counts, nothing mocked. */
export const load: PageServerLoad = async () => {
	const database = await checkDatabase();
	const runtime = runtimeInfo();

	if (!database.ok) {
		return { database, runtime, stats: null, recentEvents: [], recentAudit: [] };
	}

	const now = new Date();
	const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	const [
		usersByRole,
		activeSessions,
		flagTotal,
		flagEnabled,
		eventsBySeverity,
		recentEvents,
		recentAudit,
		auditToday
	] = await Promise.all([
		db.user.groupBy({ by: ['role'], _count: { _all: true } }),
		db.session.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
		db.featureFlag.count(),
		db.featureFlag.count({ where: { isEnabled: true } }),
		db.systemEvent.groupBy({
			by: ['severity'],
			where: { createdAt: { gte: dayAgo } },
			_count: { _all: true }
		}),
		db.systemEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
		db.auditLog.findMany({
			orderBy: { createdAt: 'desc' },
			take: 6,
			include: { actor: { select: { email: true } } }
		}),
		db.auditLog.count({ where: { createdAt: { gte: dayAgo } } })
	]);

	const roleCount = (role: 'USER' | 'DEVELOPER' | 'ADMIN') =>
		usersByRole.find((r) => r.role === role)?._count._all ?? 0;

	return {
		database,
		runtime,
		stats: {
			users: {
				USER: roleCount('USER'),
				DEVELOPER: roleCount('DEVELOPER'),
				ADMIN: roleCount('ADMIN')
			},
			activeSessions,
			flagTotal,
			flagEnabled,
			auditToday,
			events24h: Object.fromEntries(
				SEVERITIES.map((s) => [s, eventsBySeverity.find((e) => e.severity === s)?._count._all ?? 0])
			) as Record<Severity, number>
		},
		recentEvents: recentEvents.map((e) => ({
			id: e.id,
			source: e.source,
			severity: e.severity,
			message: e.message,
			createdAt: e.createdAt.toISOString()
		})),
		recentAudit: recentAudit.map((a) => ({
			id: a.id,
			action: a.action,
			entityType: a.entityType,
			actorEmail: a.actor?.email ?? null,
			createdAt: a.createdAt.toISOString()
		}))
	};
};
