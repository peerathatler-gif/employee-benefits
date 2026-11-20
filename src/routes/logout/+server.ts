import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$lib/server/env';
import { revokeSessionByToken } from '$lib/server/auth/sessions';
import { recordAuditLog } from '$lib/server/audit';
import { SESSION_COOKIE_OPTIONS } from '../../hooks.server';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	const rawToken = cookies.get(env.SESSION_COOKIE_NAME);

	if (rawToken) {
		try {
			await revokeSessionByToken(rawToken);
		} catch (err) {
			console.error('[logout] failed to revoke session', err);
		}
	}

	cookies.delete(env.SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);

	if (locals.user) {
		await recordAuditLog({
			actorUserId: locals.user.id,
			action: 'LOGOUT',
			entityType: 'User',
			entityId: locals.user.id
		});
	}

	redirect(303, '/login');
};
