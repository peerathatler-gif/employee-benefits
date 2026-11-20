import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserApi } from '$lib/server/permissions/guards';
import { markNotificationRead } from '$lib/server/notifications';

/**
 * PATCH /api/notifications/:id/read — shares `markNotificationRead` with
 * the `/app/notifications` page's `markRead` form action, so ownership
 * ("can only ever mark your OWN notification read") is enforced in exactly
 * one place regardless of which surface called it.
 */
export const PATCH: RequestHandler = async (event) => {
	const user = requireUserApi(event);
	const ok = await markNotificationRead(user.id, event.params.id);
	if (!ok) {
		error(404, 'Notification not found.');
	}
	return json({ ok: true });
};
