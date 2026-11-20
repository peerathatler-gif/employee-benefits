/**
 * Shared notification logic. Used by BOTH the `/app/notifications` page's
 * form actions and the `/api/notifications*` REST endpoints, so the two
 * surfaces can never drift apart on ownership/authorization rules — each
 * one just does auth, then calls one of these.
 */
import { db } from './db';
import type { Notification } from '../../generated/prisma/client';

export async function listNotificationsForUser(
	userId: string,
	limit = 50
): Promise<Notification[]> {
	return db.notification.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		take: limit
	});
}

export async function unreadNotificationCount(userId: string): Promise<number> {
	return db.notification.count({ where: { userId, readAt: null } });
}

/**
 * Marks one notification read. Silently no-ops (returns `false`) if the
 * notification does not exist or does not belong to `userId` — this is the
 * IDOR guard: a user can never discover-by-side-effect whether another
 * user's notification id exists.
 */
export async function markNotificationRead(
	userId: string,
	notificationId: string
): Promise<boolean> {
	const result = await db.notification.updateMany({
		where: { id: notificationId, userId, readAt: null },
		data: { readAt: new Date() }
	});
	return result.count > 0;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
	const result = await db.notification.updateMany({
		where: { userId, readAt: null },
		data: { readAt: new Date() }
	});
	return result.count;
}
