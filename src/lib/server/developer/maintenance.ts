/**
 * Developer-console write operations (feature flags, sessions, system
 * events). Every mutation records an audit log entry with the acting
 * developer, and never logs secrets (session token hashes stay server-side).
 */
import { db } from '../db';
import { recordAuditLog } from '../audit';

type Result<R extends string = never> = { ok: true } | { ok: false; reason: 'not-found' | R };

export async function createFeatureFlag(
	input: { key: string; description: string | null; isEnabled: boolean },
	actorUserId: string
): Promise<Result<'duplicate'>> {
	const existing = await db.featureFlag.findUnique({ where: { key: input.key } });
	if (existing) return { ok: false, reason: 'duplicate' };
	const flag = await db.featureFlag.create({ data: input });
	await recordAuditLog({
		actorUserId,
		action: 'feature_flag.create',
		entityType: 'FeatureFlag',
		entityId: flag.id,
		metadata: { key: flag.key, isEnabled: flag.isEnabled }
	});
	return { ok: true };
}

export async function setFeatureFlagEnabled(
	id: string,
	isEnabled: boolean,
	actorUserId: string
): Promise<Result> {
	const flag = await db.featureFlag.findUnique({ where: { id } });
	if (!flag) return { ok: false, reason: 'not-found' };
	await db.featureFlag.update({ where: { id }, data: { isEnabled } });
	await recordAuditLog({
		actorUserId,
		action: isEnabled ? 'feature_flag.enable' : 'feature_flag.disable',
		entityType: 'FeatureFlag',
		entityId: id,
		metadata: { key: flag.key }
	});
	return { ok: true };
}

export async function updateFeatureFlagDescription(
	id: string,
	description: string | null,
	actorUserId: string
): Promise<Result> {
	const flag = await db.featureFlag.findUnique({ where: { id } });
	if (!flag) return { ok: false, reason: 'not-found' };
	await db.featureFlag.update({ where: { id }, data: { description } });
	await recordAuditLog({
		actorUserId,
		action: 'feature_flag.update',
		entityType: 'FeatureFlag',
		entityId: id,
		metadata: { key: flag.key }
	});
	return { ok: true };
}

export async function deleteFeatureFlag(id: string, actorUserId: string): Promise<Result> {
	const flag = await db.featureFlag.findUnique({ where: { id } });
	if (!flag) return { ok: false, reason: 'not-found' };
	await db.featureFlag.delete({ where: { id } });
	await recordAuditLog({
		actorUserId,
		action: 'feature_flag.delete',
		entityType: 'FeatureFlag',
		entityId: id,
		metadata: { key: flag.key }
	});
	return { ok: true };
}

export async function revokeSession(
	sessionId: string,
	currentSessionId: string | null,
	actorUserId: string
): Promise<Result<'self'>> {
	if (sessionId === currentSessionId) return { ok: false, reason: 'self' };
	const session = await db.session.findUnique({ where: { id: sessionId } });
	if (!session || session.revokedAt) return { ok: false, reason: 'not-found' };
	await db.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
	await recordAuditLog({
		actorUserId,
		action: 'session.revoke',
		entityType: 'Session',
		entityId: sessionId,
		metadata: { userId: session.userId }
	});
	return { ok: true };
}

/** Deletes sessions/reset-tokens that can never be used again. */
export async function purgeStaleAuthRows(
	actorUserId: string
): Promise<{ sessions: number; resetTokens: number }> {
	const now = new Date();
	const [sessions, resetTokens] = await Promise.all([
		db.session.deleteMany({
			where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] }
		}),
		db.passwordResetToken.deleteMany({
			where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] }
		})
	]);
	await recordAuditLog({
		actorUserId,
		action: 'maintenance.purge_auth',
		entityType: 'System',
		metadata: { sessions: sessions.count, resetTokens: resetTokens.count }
	});
	return { sessions: sessions.count, resetTokens: resetTokens.count };
}

export async function purgeSystemEvents(
	olderThanDays: number,
	actorUserId: string
): Promise<number> {
	const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
	const { count } = await db.systemEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
	await recordAuditLog({
		actorUserId,
		action: 'maintenance.purge_system_events',
		entityType: 'SystemEvent',
		metadata: { olderThanDays, deleted: count }
	});
	return count;
}

/** Writes an INFO event so a developer can confirm the event pipeline end to end. */
export async function recordTestSystemEvent(actorEmail: string): Promise<void> {
	await db.systemEvent.create({
		data: {
			source: 'developer-console',
			severity: 'INFO',
			message: `Test event triggered from the developer console by ${actorEmail}.`
		}
	});
}
