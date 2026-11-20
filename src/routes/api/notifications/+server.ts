import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserApi } from '$lib/server/permissions/guards';
import { listNotificationsForUser, unreadNotificationCount } from '$lib/server/notifications';

/**
 * GET /api/notifications — the signed-in user's own notifications only.
 * Shares `listNotificationsForUser`/`unreadNotificationCount` with the
 * `/app/notifications` page's `load`, so there is exactly one query that
 * decides what a user may see here.
 */
export const GET: RequestHandler = async (event) => {
	const user = requireUserApi(event);
	const [notifications, unreadCount] = await Promise.all([
		listNotificationsForUser(user.id, 100),
		unreadNotificationCount(user.id)
	]);
	return json({ notifications, unreadCount });
};
