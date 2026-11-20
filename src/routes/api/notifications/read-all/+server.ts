import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserApi } from '$lib/server/permissions/guards';
import { markAllNotificationsRead } from '$lib/server/notifications';

/**
 * POST /api/notifications/read-all — shares `markAllNotificationsRead`
 * with the `/app/notifications` page's `markAllRead` form action.
 */
export const POST: RequestHandler = async (event) => {
	const user = requireUserApi(event);
	const count = await markAllNotificationsRead(user.id);
	return json({ ok: true, count });
};
