/**
 * Admin user-account management: activate/deactivate and role changes, with
 * the "last active ADMIN" invariant enforced here (not just in the UI) so a
 * concurrent or scripted request can never leave the system with zero
 * active administrators.
 */
import { db } from '../db';
import { recordAuditLog } from '../audit';
import { revokeAllSessionsForUser } from '../auth/sessions';
import type { PrismaClient, UserRole } from '../../../generated/prisma/client';

async function countOtherActiveAdmins(
	client: Pick<PrismaClient, 'user'>,
	excludeUserId: string
): Promise<number> {
	return client.user.count({
		where: { role: 'ADMIN', isActive: true, id: { not: excludeUserId } }
	});
}

export type SetActiveResult =
	{ ok: true } | { ok: false; reason: 'last-admin' | 'not-found' | 'no-op' };

/**
 * Activates/deactivates a login account. Deactivating revokes every active
 * session for it immediately. Refuses to deactivate the last remaining
 * active ADMIN account.
 */
export async function setUserActive(
	targetUserId: string,
	isActive: boolean,
	actorUserId: string
): Promise<SetActiveResult> {
	return db.$transaction(async (tx) => {
		const target = await tx.user.findUnique({
			where: { id: targetUserId },
			select: { id: true, role: true, isActive: true, email: true }
		});
		if (!target) return { ok: false, reason: 'not-found' };
		if (target.isActive === isActive) return { ok: false, reason: 'no-op' };

		if (!isActive && target.role === 'ADMIN') {
			const otherActiveAdmins = await countOtherActiveAdmins(tx, targetUserId);
			if (otherActiveAdmins === 0) return { ok: false, reason: 'last-admin' };
		}

		await tx.user.update({ where: { id: targetUserId }, data: { isActive } });
		if (!isActive) {
			await revokeAllSessionsForUser(targetUserId, undefined, tx);
		}

		await recordAuditLog({
			actorUserId,
			action: isActive ? 'USER_REACTIVATED' : 'USER_DISABLED',
			entityType: 'User',
			entityId: targetUserId,
			metadata: { email: target.email, previousIsActive: target.isActive, newIsActive: isActive }
		});

		return { ok: true };
	});
}

export type ChangeRoleResult =
	{ ok: true } | { ok: false; reason: 'last-admin' | 'not-found' | 'self' | 'no-op' };

/**
 * Changes a user's role. Refuses to demote the last remaining active ADMIN,
 * and refuses to let an admin change their OWN role (self-elevation/
 * self-demotion around the last-admin check is not allowed from this
 * screen at all). Always audit-logged with actor + target + old/new value.
 */
export async function changeUserRole(
	targetUserId: string,
	newRole: UserRole,
	actorUserId: string
): Promise<ChangeRoleResult> {
	if (targetUserId === actorUserId) return { ok: false, reason: 'self' };

	return db.$transaction(async (tx) => {
		const target = await tx.user.findUnique({
			where: { id: targetUserId },
			select: { id: true, role: true, isActive: true, email: true }
		});
		if (!target) return { ok: false, reason: 'not-found' };
		if (target.role === newRole) return { ok: false, reason: 'no-op' };

		if (target.role === 'ADMIN' && target.isActive && newRole !== 'ADMIN') {
			const otherActiveAdmins = await countOtherActiveAdmins(tx, targetUserId);
			if (otherActiveAdmins === 0) return { ok: false, reason: 'last-admin' };
		}

		await tx.user.update({ where: { id: targetUserId }, data: { role: newRole } });

		await recordAuditLog({
			actorUserId,
			action: 'USER_ROLE_CHANGED',
			entityType: 'User',
			entityId: targetUserId,
			metadata: { email: target.email, oldRole: target.role, newRole }
		});

		return { ok: true };
	});
}
